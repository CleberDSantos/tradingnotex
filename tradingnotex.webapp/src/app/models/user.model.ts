// user.model.ts - Definições de tipos e interfaces de usuário

export enum UserType {
  BASIC = 'basic',
  PREMIUM = 'premium',
  MENTOR = 'mentor',
  OWNER = 'owner'
}

export interface User {
  objectId: string;
  username: string;
  email: string;
  userType: UserType;
  createdAt: string;
  updatedAt?: string;

  // Campos específicos para Premium
  aiCredits?: number;
  creditsUsedThisMonth?: number;
  lastCreditReset?: string;

  // Campos de perfil
  fullName?: string;
  phone?: string;
  company?: string;
  tradingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredMarkets?: string[];

  // Configurações
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  // Campos de controle
  isActive: boolean;
  isSuspended?: boolean;
  suspendedReason?: string;
  lastLogin?: string;
  loginCount?: number;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  userType: UserType.BASIC | UserType.PREMIUM;
  fullName?: string;
  phone?: string;
  company?: string;
  tradingExperience?: string;
  acceptTerms: boolean;
}

export interface UserPermissions {
  // Funcionalidades básicas
  canViewDashboard: boolean;
  canViewTrades: boolean;
  canImportTrades: boolean;
  canExportData: boolean;

  // Funcionalidades Premium
  canUseAI: boolean;
  canAccessAdvancedAnalytics: boolean;
  canCreateMultipleAccounts: boolean;
  canAccessRiskManagement: boolean;
  canAccessTraderQuest: boolean;

  // Funcionalidades de compartilhamento
  canShareTrades: boolean;
  canInviteMentors: boolean;

  // Visualização de dados
  canViewMonetaryValues: boolean;
  canViewAllMetrics: boolean;

  // Admin
  canManageUsers: boolean;
  canViewSystemStats: boolean;
  canModifySettings: boolean;
}

export interface ShareableTradeLink {
  id: string;
  tradeId: string;
  createdBy: string;
  mentorEmail?: string;
  token: string;
  expiresAt: string;
  accessCount: number;
  maxAccessCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface AIUsageLog {
  id: string;
  userId: string;
  action: 'analysis' | 'suggestion' | 'report' | 'chat';
  creditsUsed: number;
  timestamp: string;
  details?: {
    tradeId?: string;
    prompt?: string;
    response?: string;
  };
}

// Função helper para obter permissões baseadas no tipo de usuário
export function getUserPermissions(userType: UserType): UserPermissions {
  switch (userType) {
    case UserType.OWNER:
      return {
        canViewDashboard: true,
        canViewTrades: true,
        canImportTrades: true,
        canExportData: true,
        canUseAI: true,
        canAccessAdvancedAnalytics: true,
        canCreateMultipleAccounts: true,
        canAccessRiskManagement: true,
        canAccessTraderQuest: true,
        canShareTrades: true,
        canInviteMentors: true,
        canViewMonetaryValues: true,
        canViewAllMetrics: true,
        canManageUsers: true,
        canViewSystemStats: true,
        canModifySettings: true
      };

    case UserType.PREMIUM:
      return {
        canViewDashboard: true,
        canViewTrades: true,
        canImportTrades: true,
        canExportData: true,
        canUseAI: true, // Com limite de créditos
        canAccessAdvancedAnalytics: true,
        canCreateMultipleAccounts: true,
        canAccessRiskManagement: true,
        canAccessTraderQuest: true,
        canShareTrades: true,
        canInviteMentors: true,
        canViewMonetaryValues: true,
        canViewAllMetrics: true,
        canManageUsers: false,
        canViewSystemStats: false,
        canModifySettings: false
      };

    case UserType.BASIC:
      return {
        canViewDashboard: true,
        canViewTrades: true,
        canImportTrades: true,
        canExportData: false,
        canUseAI: false,
        canAccessAdvancedAnalytics: false,
        canCreateMultipleAccounts: false,
        canAccessRiskManagement: true, // Limitado
        canAccessTraderQuest: false,
        canShareTrades: false,
        canInviteMentors: false,
        canViewMonetaryValues: true,
        canViewAllMetrics: false,
        canManageUsers: false,
        canViewSystemStats: false,
        canModifySettings: false
      };

    case UserType.MENTOR:
      return {
        canViewDashboard: false,
        canViewTrades: false, // Apenas trades compartilhados
        canImportTrades: false,
        canExportData: false,
        canUseAI: false,
        canAccessAdvancedAnalytics: false,
        canCreateMultipleAccounts: false,
        canAccessRiskManagement: false,
        canAccessTraderQuest: false,
        canShareTrades: false,
        canInviteMentors: false,
        canViewMonetaryValues: false, // Crítico para mentores
        canViewAllMetrics: false,
        canManageUsers: false,
        canViewSystemStats: false,
        canModifySettings: false
      };

    default:
      // Retorna permissões mínimas por segurança
      return {
        canViewDashboard: false,
        canViewTrades: false,
        canImportTrades: false,
        canExportData: false,
        canUseAI: false,
        canAccessAdvancedAnalytics: false,
        canCreateMultipleAccounts: false,
        canAccessRiskManagement: false,
        canAccessTraderQuest: false,
        canShareTrades: false,
        canInviteMentors: false,
        canViewMonetaryValues: false,
        canViewAllMetrics: false,
        canManageUsers: false,
        canViewSystemStats: false,
        canModifySettings: false
      };
  }
}

// Configuração de créditos por tipo de ação
export const AI_CREDIT_COSTS = {
  tradeAnalysis: 1,
  marketSuggestion: 2,
  fullReport: 5,
  chatMessage: 0.5,
  advancedAnalysis: 3
};

// Limites por tipo de usuário
export const USER_LIMITS = {
  [UserType.BASIC]: {
    maxAccounts: 1,
    maxTradesPerMonth: 100,
    maxImportsPerMonth: 5,
    dataRetentionDays: 30
  },
  [UserType.PREMIUM]: {
    maxAccounts: 5,
    maxTradesPerMonth: -1, // Ilimitado
    maxImportsPerMonth: -1,
    dataRetentionDays: 365,
    initialAICredits: 10,
    monthlyAICredits: 10
  },
  [UserType.MENTOR]: {
    maxAccounts: 0,
    maxTradesPerMonth: 0,
    maxImportsPerMonth: 0,
    dataRetentionDays: 7
  },
  [UserType.OWNER]: {
    maxAccounts: -1,
    maxTradesPerMonth: -1,
    maxImportsPerMonth: -1,
    dataRetentionDays: -1,
    initialAICredits: -1, // Ilimitado
    monthlyAICredits: -1
  }
};
