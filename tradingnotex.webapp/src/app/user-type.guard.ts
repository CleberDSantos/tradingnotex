// user-type.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { UserManagementService } from './services/user-management.service';
import { AuthStateService } from './services/auth-state.service';
import { UserType } from './models/user.model';
import { catchError, map, of } from 'rxjs';

// ✅ Guard por tipo de usuário (rodar depois do authGuard)
export const userTypeGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  const currentUser = userManagementService.getCurrentUser();

  // Se não há usuário ainda (ex.: não hidratou), não bloqueie aqui.
  if (!currentUser) {
    // Deixe o authGuard (que está antes) decidir; aqui só não barra.
    return true;
  }

  const allowedTypes = route.data['allowedUserTypes'] as UserType[] | undefined;
  if (!allowedTypes || allowedTypes.length === 0) return true;

  const isAllowed = allowedTypes.includes(currentUser.userType);
  if (isAllowed) return true;

  // Redirecionar baseado no tipo de usuário
  switch (currentUser.userType) {
    case UserType.BASIC:
      return router.parseUrl('/upgrade');
    case UserType.MENTOR:
      // ⚠️ Use uma rota existente — ajustei para dashboard
      return router.parseUrl('/dashboard');
    default:
      return router.parseUrl('/dashboard');
  }
};

// ✅ Guard específico para funcionalidades Premium
export const premiumGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const auth = inject(AuthStateService);
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  // 1) Sem token? Deixa o authGuard redirecionar
  if (!auth.hasToken()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // 2) Com token mas ainda sem usuário carregado → não barre
  const user = userManagementService.getCurrentUser();
  if (!user) {
    // Você pode permitir navegação e deixar um resolver carregar,
    // ou então retornar para upgrade apenas quando souber de fato.
    return true;
  }

  if (user.userType === UserType.PREMIUM || user.userType === UserType.OWNER) return true;

  if (user.userType === UserType.BASIC) {
    return router.parseUrl('/upgrade');
  }

  // Mentor e outros sem acesso a premium
  return router.parseUrl('/dashboard');
};

// ✅ Guard para funcionalidades com IA
export const aiFeatureGuard: CanActivateFn = () => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  const permissions = userManagementService.getCurrentPermissions();
  if (!permissions || !permissions.canUseAI) {
    return router.parseUrl('/upgrade?feature=ai');
  }

  const credits = userManagementService.getAICredits();
  if (credits === 0) {
    return router.parseUrl('/buy-credits');
  }

  return true;
};

// ✅ Guard para acesso de Mentor (assíncrono CORRETO)
export const mentorAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  const shareToken = route.queryParams['token'];
  if (!shareToken) {
    return router.parseUrl('/login');
  }

  // Retorne o Observable transformado em boolean | UrlTree
  return userManagementService.validateShareToken(shareToken).pipe(
    map((shareLink) => {
      const active = !!shareLink?.isActive;
      const notExpired = shareLink?.expiresAt ? new Date(shareLink.expiresAt) > new Date() : false;
      return (active && notExpired) ? true : router.parseUrl('/link-expired');
    }),
    catchError(() => of(router.parseUrl('/invalid-link')))
  );
};

// ✅ Guard para área administrativa
export const adminGuard: CanActivateFn = () => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  const currentUser = userManagementService.getCurrentUser();
  if (!currentUser || currentUser.userType !== UserType.OWNER) {
    return router.parseUrl('/dashboard');
  }
  return true;
};
