// user-management.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  User,
  UserType,
  RegisterRequest,
  UserPermissions,
  getUserPermissions,
  ShareableTradeLink,
  AIUsageLog,
  AI_CREDIT_COSTS,
  USER_LIMITS
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private base = environment.apiBaseUrl.replace(/\/+$/, '') + '/api';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private userPermissionsSubject = new BehaviorSubject<UserPermissions | null>(null);
  public userPermissions$ = this.userPermissionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  // ========== Autenticação e Registro ==========

  register(request: RegisterRequest): Observable<User> {
    // Validações adicionais
    if (request.userType === UserType.MENTOR || request.userType === UserType.OWNER) {
      throw new Error('Tipo de usuário inválido para registro público');
    }

    // Adicionar créditos iniciais para usuários Premium
    const payload: any = { ...request };
    if (request.userType === UserType.PREMIUM) {
      payload.aiCredits = USER_LIMITS[UserType.PREMIUM].initialAICredits;
      payload.lastCreditReset = new Date().toISOString();
    }

    return this.http.post<User>(`${this.base}/Auth/register`, payload).pipe(
      tap(user => {
        this.setCurrentUser(user);
      }),
      catchError(error => {
        console.error('Erro no registro:', error);
        throw error;
      })
    );
  }

  upgradeToPremiun(): Observable<User> {
    return this.http.post<User>(`${this.base}/users/upgrade-premium`, {}).pipe(
      tap(user => {
        this.setCurrentUser(user);
        // Notificar sucesso
        this.showNotification('Conta atualizada para Premium com sucesso!', 'success');
      })
    );
  }

  // ========== Gerenciamento de Usuário Atual ==========

  loadCurrentUser(): void {
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType') as UserType;

    if (userId && userType) {
      // Criar objeto de usuário básico a partir do localStorage
      const user: Partial<User> = {
        objectId: userId,
        username: localStorage.getItem('username') || '',
        email: localStorage.getItem('email') || '',
        userType: userType,
        isActive: true,
        aiCredits: parseInt(localStorage.getItem('aiCredits') || '0')
      };

      this.setCurrentUser(user as User);

      // Tentar carregar dados completos do servidor
      this.fetchUserDetails(userId).subscribe();
    }
  }

  private fetchUserDetails(userId: string): Observable<User> {
    return this.http.get<User>(`${this.base}/users/${userId}`).pipe(
      tap(user => this.setCurrentUser(user)),
      catchError(error => {
        console.error('Erro ao carregar detalhes do usuário:', error);
        return of(null as any);
      })
    );
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      // Salvar no localStorage
      localStorage.setItem('userId', user.objectId);
      localStorage.setItem('username', user.username);
      localStorage.setItem('email', user.email);
      localStorage.setItem('userType', user.userType);
      localStorage.setItem('aiCredits', String(user.aiCredits || 0));

      // Atualizar observables
      this.currentUserSubject.next(user);
      this.userPermissionsSubject.next(getUserPermissions(user.userType));
    } else {
      // Limpar dados
      this.clearUserData();
    }
  }

  clearUserData(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('userType');
    localStorage.removeItem('aiCredits');

    this.currentUserSubject.next(null);
    this.userPermissionsSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentPermissions(): UserPermissions | null {
    return this.userPermissionsSubject.value;
  }

  getUserType(): UserType | null {
    const user = this.getCurrentUser();
    return user ? user.userType : null;
  }

  // ========== Sistema de Créditos AI ==========

  getAICredits(): number {
    const user = this.getCurrentUser();
    if (!user) return 0;

    if (user.userType === UserType.OWNER) return -1; // Ilimitado
    if (user.userType !== UserType.PREMIUM) return 0;

    return user.aiCredits || 0;
  }

  canUseAI(action: keyof typeof AI_CREDIT_COSTS): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Owner tem acesso ilimitado
    if (user.userType === UserType.OWNER) return true;

    // Basic e Mentor não têm acesso
    if (user.userType === UserType.BASIC || user.userType === UserType.MENTOR) return false;

    // Premium precisa ter créditos suficientes
    const cost = AI_CREDIT_COSTS[action];
    return this.getAICredits() >= cost;
  }

  useAICredits(action: keyof typeof AI_CREDIT_COSTS, details?: any): Observable<AIUsageLog> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Owner não consome créditos
    if (user.userType === UserType.OWNER) {
      return of({
        id: 'owner-usage',
        userId: user.objectId,
        action: action as any,
        creditsUsed: 0,
        timestamp: new Date().toISOString(),
        details
      });
    }

    if (!this.canUseAI(action)) {
      throw new Error('Créditos insuficientes');
    }

    const cost = AI_CREDIT_COSTS[action];

    return this.http.post<AIUsageLog>(`${this.base}/ai/use-credits`, {
      action,
      creditsUsed: cost,
      details
    }).pipe(
      tap(log => {
        // Atualizar créditos localmente
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.aiCredits !== undefined) {
          currentUser.aiCredits -= cost;
          this.setCurrentUser(currentUser);
        }
      })
    );
  }

  purchaseCredits(amount: number): Observable<User> {
    return this.http.post<User>(`${this.base}/ai/purchase-credits`, { amount }).pipe(
      tap(user => this.setCurrentUser(user))
    );
  }

  getAIUsageHistory(): Observable<AIUsageLog[]> {
    return this.http.get<AIUsageLog[]>(`${this.base}/ai/usage-history`);
  }

  // ========== Compartilhamento para Mentores ==========

  createShareableLink(tradeId: string, mentorEmail?: string): Observable<ShareableTradeLink> {
    const user = this.getCurrentUser();
    if (!user || user.userType === UserType.BASIC) {
      throw new Error('Apenas usuários Premium podem compartilhar trades');
    }

    return this.http.post<ShareableTradeLink>(`${this.base}/trades/${tradeId}/share`, {
      mentorEmail,
      expiresInDays: 7,
      maxAccessCount: 100
    });
  }

  getShareableLinks(): Observable<ShareableTradeLink[]> {
    return this.http.get<ShareableTradeLink[]>(`${this.base}/trades/shared-links`);
  }

  revokeShareableLink(linkId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/trades/shared-links/${linkId}`);
  }

  validateShareToken(token: string): Observable<ShareableTradeLink> {
    return this.http.get<ShareableTradeLink>(`${this.base}/trades/validate-share/${token}`);
  }

  // ========== Verificações de Permissão ==========

  canAccessRoute(route: string): boolean {
    const permissions = this.getCurrentPermissions();
    if (!permissions) return false;

    const routePermissions: { [key: string]: keyof UserPermissions } = {
      '/dashboard': 'canViewDashboard',
      '/trades': 'canViewTrades',
      '/trade-maintenance': 'canImportTrades',
      '/risk': 'canAccessRiskManagement',
      '/quest': 'canAccessTraderQuest',
      '/evolution': 'canAccessAdvancedAnalytics',
      '/accounts': 'canCreateMultipleAccounts',
      '/admin': 'canManageUsers'
    };

    const requiredPermission = routePermissions[route];
    return requiredPermission ? permissions[requiredPermission] : false;
  }

  canViewMonetaryValues(): boolean {
    const permissions = this.getCurrentPermissions();
    return permissions ? permissions.canViewMonetaryValues : true;
  }

  shouldHideMonetaryValue(): boolean {
    return !this.canViewMonetaryValues();
  }

  // ========== Gerenciamento de Limites ==========

  checkUserLimits(limitType: keyof typeof USER_LIMITS.basic): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const limits = USER_LIMITS[user.userType];
    const limit = limits[limitType as keyof typeof limits];

    // -1 significa ilimitado
    return limit === -1 || this.getCurrentUsage(limitType) < limit;
  }

  private getCurrentUsage(limitType: string): number {
    // Implementar lógica para obter uso atual
    // Por enquanto, retorna 0
    return 0;
  }

  // ========== Helpers ==========

  formatMonetaryValue(value: number): string {
    if (this.shouldHideMonetaryValue()) {
      return '•••••';
    }
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  getUpgradeMessage(): string {
    const user = this.getCurrentUser();
    if (!user) return '';

    switch (user.userType) {
      case UserType.BASIC:
        return 'Faça upgrade para Premium e desbloqueie análises com IA, múltiplas contas e mais!';
      case UserType.PREMIUM:
        return `Você tem ${this.getAICredits()} créditos de IA restantes.`;
      default:
        return '';
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info') {
    // Implementar sistema de notificação
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}
