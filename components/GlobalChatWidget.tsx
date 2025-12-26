import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Paperclip, Smile, MessageSquare } from 'lucide-react';
import { globalChatService, ChatMessage as RealtimeChatMessage, ChatSession } from '../services/globalChatRealtimeService';
import { widgetConfigService, WidgetConfig } from '../services/widgetConfigService';
import { aiService } from '../services/aiService';
import { VisitorInfoPanel } from './VisitorInfoPanel';

interface Message {
    id: string;
    content: string;
    sender: 'visitor' | 'agent' | 'system';
    timestamp: string;
    senderName?: string;
}

interface GlobalChatWidgetProps {
    /** Force use of global config (for landing page). Ignores logged-in user's tenant. */
    forceGlobalConfig?: boolean;
    /** Specific tenant ID for public embedding. Used when no user is logged in. */
    publicTenantId?: string | null;
}

// Generate a unique visitor ID (persisted in localStorage)
const getOrCreateVisitorId = (): string => {
    let visitorId = localStorage.getItem('talkchat_visitor_id');
    if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('talkchat_visitor_id', visitorId);
    }
    return visitorId;
};

export const GlobalChatWidget: React.FC<GlobalChatWidgetProps> = ({ forceGlobalConfig = false, publicTenantId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [visitorName, setVisitorName] = useState('');
    const [visitorEmail, setVisitorEmail] = useState('');
    const [showPreChat, setShowPreChat] = useState(true);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
    const [config, setConfig] = useState<WidgetConfig | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const visitorId = useRef(getOrCreateVisitorId());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load configuration
    useEffect(() => {
        const loadConfig = async () => {
            // CRITICAL: Determine which config to load
            let result;
            if (forceGlobalConfig) {
                result = await widgetConfigService.getGlobalConfig();
            } else if (publicTenantId !== undefined) {
                // Use provided publicTenantId (for embeds)
                result = await widgetConfigService.getConfig(publicTenantId);
            } else {
                // Normal dashboard behavior (uses logged in user)
                result = await widgetConfigService.getConfig();
            }

            if (result?.config) {
                setConfig(result.config);

                console.log('[Widget] Loaded config - forceGlobal:', forceGlobalConfig, 'publicTenantId:', publicTenantId, 'teamName:', result.config.team_name);

                // Check if we should auto-open based on config
                if (result.config.auto_open) {
                    setTimeout(() => {
                        setIsOpen(true);
                    }, (result.config.auto_open_delay || 5) * 1000);
                }
            }
        };
        loadConfig();
    }, [forceGlobalConfig, publicTenantId]);

    // Communicate with parent window (for iframe mode)
    useEffect(() => {
        if (window.parent === window) return;

        if (isOpen && !isMinimized) {
            window.parent.postMessage({ type: 'TKC_WIDGET_OPEN' }, '*');
        } else {
            window.parent.postMessage({ type: 'TKC_WIDGET_CLOSE' }, '*');
        }
    }, [isOpen, isMinimized]);

    // Subscribe to real-time updates when session is active
    useEffect(() => {
        if (!currentSession) return;

        setConnectionStatus('connecting');

        const channel = globalChatService.subscribeToSession(
            currentSession.id,
            (realtimeMessage: RealtimeChatMessage) => {
                // Only add messages from agents (visitor's own messages already added optimistically)
                if (realtimeMessage.sender_type !== 'visitor') {
                    const newMessage: Message = {
                        id: realtimeMessage.id,
                        content: realtimeMessage.content,
                        sender: realtimeMessage.sender_type,
                        timestamp: new Date(realtimeMessage.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        senderName: realtimeMessage.sender_name
                    };

                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            }
        );

        // Check channel status
        if (channel) {
            setConnectionStatus('connected');
        }

        // Cleanup on unmount
        return () => {
            globalChatService.unsubscribe(`session:${currentSession.id}`);
        };
    }, [currentSession]);

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitorName.trim()) return;

        setIsLoading(true);
        setShowPreChat(false);

        try {
            // CRITICAL: Determine tenant context for session creation
            let sessionTenantId = null;
            if (forceGlobalConfig) {
                sessionTenantId = null;
            } else if (publicTenantId !== undefined) {
                sessionTenantId = publicTenantId;
            } else {
                sessionTenantId = (config as any)?.tenant_id || null;
            }

            console.log('[Widget] Creating session with tenant_id:', sessionTenantId, 'forceGlobal:', forceGlobalConfig);

            // Find or create session
            const { session, error } = await globalChatService.findOrCreateSession({
                visitor_name: visitorName,
                visitor_email: visitorEmail || undefined,
                visitor_id: visitorId.current,
                visitor_metadata: {
                    browser: navigator.userAgent,
                    platform: navigator.platform,
                    currentUrl: window.location.href
                },
                tenant_id: sessionTenantId
            });

            if (error) {
                console.error('Error creating session:', error);
                setMessages([{
                    id: 'error',
                    content: 'Failed to connect. Please try again.',
                    sender: 'system',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                setIsLoading(false);
                return;
            }

            setCurrentSession(session);

            // Load existing messages if any
            if (session) {
                const { messages: existingMessages } = await globalChatService.getMessages(session.id);

                const formattedMessages: Message[] = existingMessages.map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    sender: msg.sender_type,
                    timestamp: new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    senderName: msg.sender_name
                }));

                setMessages(formattedMessages);

                // If no messages, send welcome message from config or default
                if (formattedMessages.length === 0) {
                    const welcomeMsg = config?.welcome_message || `Hello ${visitorName}! An agent will be with you shortly. How can we help you today?`;

                    await globalChatService.sendMessage({
                        session_id: session.id,
                        content: welcomeMsg,
                        sender_type: 'system',
                        sender_name: config?.team_name || 'TalkChat Bot'
                    });
                }
            }
        } catch (error) {
            console.error('Error starting chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentSession) return;

        const messageContent = messageInput;
        setMessageInput('');

        // Optimistically add message to UI
        const optimisticMessage: Message = {
            id: `temp_${Date.now()}`,
            content: messageContent,
            sender: 'visitor',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: visitorName || 'You'
        };
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // Send to Supabase (will trigger realtime update for admin)
            const { message, error } = await globalChatService.sendMessage({
                session_id: currentSession.id,
                content: messageContent,
                sender_type: 'visitor',
                sender_id: visitorId.current,
                sender_name: visitorName
            });

            if (error) {
                console.error('Error sending message:', error);
                // Remove optimistic message and show error
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
                setMessages(prev => [...prev, {
                    id: 'error',
                    content: 'Failed to send message. Please try again.',
                    sender: 'system',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                return;
            }

            // Replace optimistic message with real one
            if (message) {
                setMessages(prev => prev.map(m =>
                    m.id === optimisticMessage.id
                        ? { ...m, id: message.id }
                        : m
                ));

                // AI AUTO-RESPOND LOGIC
                if (config?.aiEnabled && config?.aiAutoRespond) {
                    console.log('[Widget] Triggering AI response...');

                    // Show a temporary typing indicator if we were to have one, 
                    // or just delay slightly for realism
                    setTimeout(async () => {
                        try {
                            // Prepare history for Gemini
                            const history = messages
                                .filter(m => m.sender === 'visitor' || m.sender === 'agent' || m.sender === 'system')
                                .slice(-10) // Last 10 messages
                                .map(m => ({
                                    role: m.sender === 'visitor' ? 'user' : 'model',
                                    parts: [{ text: m.content }]
                                } as any));

                            const aiResponse = await aiService.getAIResponse({
                                message: messageContent,
                                history: history,
                                instructions: config?.aiKnowledgeBase || 'Follow general helpful assistant guidelines.',
                                provider: config?.aiProvider || 'gemini',
                                apiKey: config?.aiApiKey || '', // User must provide key in settings
                            });

                            if (aiResponse) {
                                await globalChatService.sendMessage({
                                    session_id: currentSession.id,
                                    content: aiResponse,
                                    sender_type: 'agent', // AI acts as an agent
                                    sender_name: config?.team_name || 'TalkChat Bot'
                                });
                            }
                        } catch (aiErr) {
                            console.error('[Widget] AI Response failed:', aiErr);
                        }
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Styles based on config
    const primaryColor = config?.primary_color || '#8b5cf6'; // Default purple
    const position = config?.position || 'bottom-right';

    // Position classes
    const getPositionClasses = () => {
        switch (position) {
            case 'bottom-left': return 'bottom-6 left-6';
            case 'top-right': return 'top-6 right-6';
            case 'top-left': return 'top-6 left-6';
            default: return 'bottom-6 right-6';
        }
    };

    if (!isOpen) {
        return (
            <div className={`fixed ${getPositionClasses()} z-50`}>
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${config?.secondary_color || '#ec4899'})` }}
                    className="group relative w-16 h-16 rounded-full shadow-2xl hover:shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
                >
                    <MessageSquare className="w-7 h-7 text-white" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-950 animate-pulse"></span>

                    {/* Pulse animation */}
                    <span className="absolute inset-0 rounded-full bg-white/20 animate-ping"></span>
                </button>
            </div>
        );
    }

    return (
        <div className={`fixed ${getPositionClasses()} z-50`}>
            <div className={`bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden transition-all duration-300 ${isMinimized ? 'w-80 h-16' : 'w-[400px] h-[600px]'
                }`}>
                {/* Header */}
                <div
                    className="h-16 px-6 flex items-center justify-between"
                    style={{ background: `linear-gradient(to right, ${primaryColor}, ${config?.secondary_color || '#ec4899'})` }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{config?.team_name || 'TalkChat Support'}</h3>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' :
                                    connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                                        'bg-red-400'
                                    }`}></span>
                                <span className="text-xs text-white/80">
                                    {connectionStatus === 'connected' ? 'Online' :
                                        connectionStatus === 'connecting' ? 'Connecting...' :
                                            'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Minimize2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {showPreChat ? (
                            <div className="h-[484px] p-6 flex flex-col justify-center bg-slate-900">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-white mb-2">{config?.pre_chat_message || 'Start a Conversation'}</h3>
                                    <p className="text-sm text-slate-400">We typically respond within a few minutes</p>
                                </div>
                                <form onSubmit={handleStartChat} className="space-y-4">
                                    {config?.require_name !== false && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
                                            <input
                                                type="text"
                                                value={visitorName}
                                                onChange={(e) => setVisitorName(e.target.value)}
                                                placeholder="John Doe"
                                                required
                                                disabled={isLoading}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50"
                                            />
                                        </div>
                                    )}
                                    {config?.require_email && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                                            <input
                                                type="email"
                                                value={visitorEmail}
                                                onChange={(e) => setVisitorEmail(e.target.value)}
                                                placeholder="john@example.com"
                                                required
                                                disabled={isLoading}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50"
                                            />
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        style={{ background: `linear-gradient(to right, ${primaryColor}, ${config?.secondary_color || '#ec4899'})` }}
                                        className="w-full text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Connecting...' : 'Start Chat'}
                                    </button>
                                </form>
                                <p className="text-xs text-slate-500 text-center mt-4">
                                    By using this chat, you agree to our Privacy Policy
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Messages Area */}
                                <div className="h-[424px] p-4 overflow-y-auto bg-slate-950/50 space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] ${msg.sender === 'system' ? 'w-full flex justify-center' : ''}`}>
                                                {msg.sender === 'system' ? (
                                                    <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                                                        {msg.content}
                                                    </span>
                                                ) : (
                                                    <div>
                                                        {msg.senderName && msg.sender === 'agent' && (
                                                            <p className="text-xs text-slate-400 mb-1 ml-3">{msg.senderName}</p>
                                                        )}
                                                        <div
                                                            className={`rounded-2xl px-4 py-3 ${msg.sender === 'visitor'
                                                                ? 'text-white rounded-tr-sm'
                                                                : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                                                                }`}
                                                            style={msg.sender === 'visitor' ? { background: `linear-gradient(to right, ${primaryColor}, ${config?.secondary_color || '#ec4899'})` } : {}}
                                                        >
                                                            <p className="text-sm">{msg.content}</p>
                                                            <p className={`text-[10px] mt-1 ${msg.sender === 'visitor' ? 'text-white/70' : 'text-slate-500'}`}>
                                                                {msg.timestamp}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="h-[60px] px-4 py-3 bg-slate-900 border-t border-slate-700">
                                    <form onSubmit={handleSendMessage} className="relative">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            placeholder="Type your message..."
                                            disabled={connectionStatus !== 'connected'}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-full pl-4 pr-24 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:opacity-50"
                                        />
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button type="button" className="p-1.5 text-slate-400 hover:text-white transition-colors">
                                                <Paperclip className="w-4 h-4" />
                                            </button>
                                            <button type="button" className="p-1.5 text-slate-400 hover:text-white transition-colors">
                                                <Smile className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!messageInput.trim() || connectionStatus !== 'connected'}
                                                style={{ background: `linear-gradient(to right, ${primaryColor}, ${config?.secondary_color || '#ec4899'})` }}
                                                className="p-1.5 text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Powered by */}
                {!isMinimized && config?.show_powered_by !== false && (
                    <div className="h-10 bg-slate-900/50 border-t border-slate-800 flex items-center justify-center">
                        <p className="text-[10px] text-slate-500">
                            Powered by <span className="text-brand-purple font-semibold">TalkChat Studio</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
