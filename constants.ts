
import { ChatSession, SenderType, WidgetConfig, User } from './types';

export const INITIAL_CONFIG: WidgetConfig = {
  tenantId: 'tenant_123',
  isActive: true,
  
  // Appearance
  brandColor: '#2563EB', // Blue-600
  backgroundColor: '#ffffff',
  textColor: '#1e293b', // slate-800
  position: 'bottom-right',
  widgetShape: 'rounded',
  logoUrl: '',
  agentAvatarUrl: '',
  bubbleIconUrl: '',

  // Content
  welcomeMessage: 'Hi there! How can we help you today?',
  botName: 'TalkChat AI',
  
  // Chat Functionality
  enableEmojis: true,
  enableAttachments: true,
  enableVoiceNotes: false,
  quickReplies: ['Pricing', 'Support', 'Sales'],

  // AI Settings
  aiEnabled: true,
  aiOfflineFallback: true,
  aiGreetingEnabled: false,
  aiConfidence: 0.7,
  
  // Knowledge Base
  knowledgeBase: {
    textContext: `We are TalkChat Studio, a SaaS platform for customer support.
Key Features:
- Shared Inbox for teams
- AI-powered auto-replies
- Multi-tenant architecture for agencies
- Widget customization
Pricing:
- Free: 1 agent
- Pro: $29/mo, unlimited chats
- Business: $99/mo, API access`,
    files: [
      { id: 'kb_1', name: 'pricing_tier_2024.pdf', type: 'pdf', size: '1.2 MB', uploadDate: Date.now() - 10000000 },
      { id: 'kb_2', name: 'api_documentation.doc', type: 'doc', size: '450 KB', uploadDate: Date.now() - 5000000 }
    ]
  },

  // Behavior
  autoOpenDelay: 0,
  showBranding: true,
  hideWhenOffline: false,
  
  // Language & Labels
  language: 'en',
  autoDetectLanguage: true,
  customLabels: {
    startChat: 'Start Chatting',
    enterMessage: 'Type a message...',
    send: 'Send',
  },
  
  // Pre-chat Form
  preChatFormMessage: 'Please introduce yourself to start chatting.',
  requireName: false,
  requireEmail: false,
  requirePhone: false,

  // Offline Form
  offlineEnabled: true,
  offlineHeading: 'We are currently offline',
  offlineMessage: 'Please leave your name and email, and we will get back to you shortly.',
  offlineSuccessMessage: 'Thanks! We have received your message.',

  // Security & Privacy
  gdprShowConsent: false,
  gdprConsentText: 'I agree to the processing of my personal data.',
  gdprDisableTracking: false,
  gdprShowDisclaimer: false,
  gdprDisclaimerText: 'By using this chat, you agree to our Privacy Policy.',
  
  retentionPeriodDays: 365,
  privacyHideIp: false,
  privacyMaskData: false,
  
  visibilityLoggedInOnly: false,
  visibilityHideCheckout: true,
  visibilityRepeatVisitorsOnly: false,

  // Omnichannel Integrations
  integrations: {
    whatsapp: { enabled: false },
    instagram: { enabled: false },
    facebook: { enabled: false },
  },

  // Visitor Intelligence
  visitorIntelligence: {
    enabled: true,
    realTimeTyping: true,
    pageTracking: true,
    intentScoring: true,
    showMouseHeatmap: false,
  }
};

export const CURRENT_USER: User = {
  id: 'agent_1',
  name: 'Sarah Jenkins',
  email: 'sarah@talkchat.studio',
  role: 'ADMIN',
  avatar: 'https://picsum.photos/200/200',
};

export const MOCK_CHATS: ChatSession[] = [
  {
    id: 'chat_1',
    visitorName: 'Alice Freeman',
    visitorEmail: 'alice@example.com',
    status: 'OPEN',
    channel: 'WEB',
    lastActivity: Date.now() - 1000 * 60 * 5, // 5 mins ago
    unreadCount: 1,
    tags: ['Sales', 'High Priority'],
    typingPreview: 'I was wondering if you offer volume disco', // Ghost typing
    visitorActivity: {
        currentUrl: 'https://talkchat.studio/pricing',
        pageTitle: 'Pricing - TalkChat Studio',
        timeOnPage: 145, // seconds
        browser: 'Chrome 122',
        os: 'macOS',
        ip: '192.168.1.42',
        location: 'San Francisco, US',
        intentScore: 85,
        history: [
            { action: 'VIEWED', detail: '/home', timestamp: Date.now() - 1000 * 60 * 15 },
            { action: 'CLICKED', detail: 'Get Started Button', timestamp: Date.now() - 1000 * 60 * 14 },
            { action: 'VIEWED', detail: '/features/omnichannel', timestamp: Date.now() - 1000 * 60 * 10 },
            { action: 'HOVERED', detail: 'Pricing Card (Enterprise)', timestamp: Date.now() - 1000 * 60 * 6 },
            { action: 'VIEWED', detail: '/pricing', timestamp: Date.now() - 1000 * 60 * 5 },
        ]
    },
    messages: [
      {
        id: 'msg_1',
        content: 'Hi, I have a question about the Enterprise plan pricing.',
        senderType: SenderType.VISITOR,
        senderName: 'Alice Freeman',
        timestamp: Date.now() - 1000 * 60 * 10,
      },
      {
        id: 'msg_2',
        content: 'Hello Alice! I can certainly help with that. What specific features are you looking for?',
        senderType: SenderType.AGENT,
        senderName: 'Sarah Jenkins',
        timestamp: Date.now() - 1000 * 60 * 8,
      },
      {
        id: 'msg_3',
        content: 'Mostly the multi-tenant isolation and API rate limits.',
        senderType: SenderType.VISITOR,
        senderName: 'Alice Freeman',
        timestamp: Date.now() - 1000 * 60 * 5,
      },
    ],
  },
  {
    id: 'chat_2',
    visitorName: '+1 (555) 0123',
    status: 'OPEN',
    channel: 'WHATSAPP',
    lastActivity: Date.now() - 1000 * 60 * 30,
    unreadCount: 2,
    tags: ['Support', 'WhatsApp'],
    messages: [
      {
        id: 'msg_2_1',
        content: 'My widget is not loading on the staging site.',
        senderType: SenderType.VISITOR,
        senderName: 'John Doe',
        timestamp: Date.now() - 1000 * 60 * 35,
      },
      {
        id: 'msg_2_2',
        content: 'I also cannot login to the dashboard.',
        senderType: SenderType.VISITOR,
        senderName: 'John Doe',
        timestamp: Date.now() - 1000 * 60 * 30,
      },
    ],
  },
  {
    id: 'chat_3',
    visitorName: '@design_guru',
    status: 'CLOSED',
    channel: 'INSTAGRAM',
    lastActivity: Date.now() - 1000 * 60 * 60 * 24,
    unreadCount: 0,
    tags: ['General', 'Social'],
    messages: [
      {
        id: 'msg_3_1',
        content: 'Just wanted to say the new AI features are great! 🔥',
        senderType: SenderType.VISITOR,
        senderName: 'Emma Watson',
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
      },
    ],
  },
  {
    id: 'chat_4',
    visitorName: 'Mark Z.',
    status: 'OPEN',
    channel: 'FACEBOOK',
    lastActivity: Date.now() - 1000 * 60 * 120,
    unreadCount: 0,
    tags: ['Feature Request'],
    messages: [
      {
        id: 'msg_4_1',
        content: 'Do you support Facebook Messenger integration?',
        senderType: SenderType.VISITOR,
        senderName: 'Mark Z.',
        timestamp: Date.now() - 1000 * 60 * 120,
      },
    ],
  },
];
