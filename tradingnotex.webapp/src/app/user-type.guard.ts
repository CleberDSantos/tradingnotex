// user-type.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { UserManagementService } from './services/user-management.service';
import { UserType } from './models/user.model';


export const userTypeGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  const currentUser = userManagementService.getCurrentUser();

  // Se não há usuário autenticado, redirecionar para login
  if (!currentUser) {
    return router.parseUrl('/login');
  }

  // Obter tipos de usuário permitidos para esta rota
  const allowedTypes = route.data['allowedUserTypes'] as UserType[];

  // Se não há restrição específica, permitir acesso
  if (!allowedTypes || allowedTypes.length === 0) {
    return true;
  }

  // Verificar se o tipo do usuário atual está na lista de permitidos
  if (allowedTypes.includes(currentUser.userType)) {
    return true;
  }

  // Redirecionar baseado no tipo de usuário
  switch (currentUser.userType) {
    case UserType.BASIC:
      // Usuário Basic tentando acessar área Premium
      return router.parseUrl('/upgrade');

    case UserType.MENTOR:
      // Mentor só pode ver trades compartilhados
      return router.parseUrl('/shared-trades');

    default:
      // Redirecionar para dashboard por padrão
      return router.parseUrl('/dashboard');
  }
};

// Guard específico para funcionalidades Premium
export const premiumGuard: CanActivateFn = () => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  const currentUser = userManagementService.getCurrentUser();

  if (!currentUser) {
    return router.parseUrl('/login');
  }

  // Permitir acesso para Premium e Owner
  if (currentUser.userType === UserType.PREMIUM || currentUser.userType === UserType.OWNER) {
    return true;
  }

  // Redirecionar Basic para página de upgrade
  if (currentUser.userType === UserType.BASIC) {
    return router.parseUrl('/upgrade');
  }

  // Mentores não têm acesso a funcionalidades premium
  return router.parseUrl('/shared-trades');
};

// Guard para funcionalidades com IA
export const aiFeatureGuard: CanActivateFn = () => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  const permissions = userManagementService.getCurrentPermissions();

  if (!permissions || !permissions.canUseAI) {
    // Redirecionar para página de upgrade ou compra de créditos
    return router.parseUrl('/upgrade?feature=ai');
  }

  // Verificar se tem créditos suficientes (para Premium)
  const credits = userManagementService.getAICredits();
  if (credits === 0) {
    return router.parseUrl('/buy-credits');
  }

  return true;
};

// Guard para acesso de Mentor
export const mentorAccessGuard: CanActivateFn = (route) => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  // Obter token de compartilhamento da URL
  const shareToken = route.queryParams['token'];

  if (!shareToken) {
    return router.parseUrl('/login');
  }

  // Validar token
  userManagementService.validateShareToken(shareToken).subscribe({
    next: (shareLink) => {
      if (shareLink.isActive && new Date(shareLink.expiresAt) > new Date()) {
        return true;
      }
      return router.parseUrl('/link-expired');
    },
    error: () => {
      return router.parseUrl('/invalid-link');
    }
  });

  return true;
};

// Guard para área administrativa
export const adminGuard: CanActivateFn = () => {
  const userManagementService = inject(UserManagementService);
  const router = inject(Router);

  const currentUser = userManagementService.getCurrentUser();

  if (!currentUser || currentUser.userType !== UserType.OWNER) {
    return router.parseUrl('/dashboard');
  }

  return true;
};
