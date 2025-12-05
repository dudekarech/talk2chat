
export type Role = 'ADMIN' | 'AGENT' | 'VIEWER';

export enum SenderType {
  VISITOR = 'VISITOR',
  AGENT = 'AGENT',
  BOT = 'BOT'
}

export type ChannelType = 'WEB' | 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  senderType: SenderType;
  senderName: string;
  timestamp: number;
}

export interface DashboardStats {
  activeChats: number;
  totalVisitors: number;
  avgResponseTime: string;
  sentimentScore: number;
}

export interface VisitorActivity {
  currentUrl: string;
  pageTitle: string;
  timeOnPage: number; // seconds
  browser: string;
  os: string;
  ip: string;
  location: string;
  intentScore: number; // 0-100
  history: {
    action: string; // 'VIEWED', 'CLICKED', 'HOVERED'
    detail: string;
    timestamp: number;
  }[];
}

export interface ChatSession {
  id: string;
  visitorName: string;
  visitorEmail?: string;
  status: 'OPEN' | 'CLOSED' | 'SNOOZED';
  channel: ChannelType; 
  messages: Message[];
  lastActivity: number;
  unreadCount: number;
  tags: string[];
  // New Real-Time Fields
  typingPreview?: string; // What they are currently typing before sending
  visitorActivity?: VisitorActivity;
}

export interface KBFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'txt' | 'csv';
  size: string;
  uploadDate: number;
}

export interface IntegrationConfig {
  whatsapp: {
    enabled: boolean;
    phoneNumberId?: string;
    apiKey?: string;
  };
  instagram: {
    enabled: boolean;
    pageId?: string;
    accessToken?: string;
  };
  facebook: {
    enabled: boolean;
    pageId?: string;
    accessToken?: string;
  };
}

export interface VisitorIntelligenceConfig {
  enabled: boolean;
  realTimeTyping: boolean;
  pageTracking: boolean;
  intentScoring: boolean;
  showMouseHeatmap: boolean;
}

export interface WidgetConfig {
  tenantId: string;
  isActive: boolean;
  
  // Appearance
  brandColor: string;
  backgroundColor: string;
  textColor: string;
  position: 'bottom-right' | 'bottom-left' | 'middle-right' | 'middle-left';
  widgetShape: 'rounded' | 'square' | 'circle' | 'pill';
  logoUrl: string;
  agentAvatarUrl: string;
  bubbleIconUrl: string;

  // Content
  welcomeMessage: string;
  botName: string;
  
  // Chat Functionality
  enableEmojis: boolean;
  enableAttachments: boolean;
  enableVoiceNotes: boolean;
  quickReplies: string[];
  
  // AI Settings
  aiEnabled: boolean;
  aiOfflineFallback: boolean;
  aiGreetingEnabled: boolean;
  aiConfidence: number; // 0.0 to 1.0
  
  // Knowledge Base
  knowledgeBase: {
    textContext: string;
    files: KBFile[];
  };

  // Behavior
  autoOpenDelay: number; // seconds, 0 = disabled
  showBranding: boolean; // "Powered by TalkChat"
  hideWhenOffline: boolean;
  
  // Language & Labels
  language: 'en' | 'es' | 'fr' | 'de';
  autoDetectLanguage: boolean;
  customLabels: {
    startChat: string;
    enterMessage: string;
    send: string;
  };
  
  // Pre-chat Form
  preChatFormMessage: string;
  requireName: boolean;
  requireEmail: boolean;
  requirePhone: boolean;

  // Offline Form
  offlineEnabled: boolean;
  offlineHeading: string;
  offlineMessage: string;
  offlineSuccessMessage: string;

  // Security & Privacy
  gdprShowConsent: boolean;
  gdprConsentText: string;
  gdprDisableTracking: boolean;
  gdprShowDisclaimer: boolean;
  gdprDisclaimerText: string;
  
  retentionPeriodDays: number;
  privacyHideIp: boolean;
  privacyMaskData: boolean;
  
  visibilityLoggedInOnly: boolean;
  visibilityHideCheckout: boolean;
  visibilityRepeatVisitorsOnly: boolean;

  // Omnichannel Integrations
  integrations: IntegrationConfig;

  // Real-Time Visitor Intelligence
  visitorIntelligence: VisitorIntelligenceConfig;
}
