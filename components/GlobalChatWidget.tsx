import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Paperclip, Smile, MessageSquare, Gift, Ghost, Rabbit, RotateCcw } from 'lucide-react';
import { globalChatService, ChatMessage as RealtimeChatMessage, ChatSession } from '../services/globalChatRealtimeService';
import { widgetConfigService, WidgetConfig } from '../services/widgetConfigService';
import { aiService } from '../services/aiService';
import { VisitorInfoPanel } from './VisitorInfoPanel';

interface Message {
    id: string;
    content: string;
    sender: 'visitor' | 'agent' | 'system' | 'ai';
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

    // Track visitor metrics (scroll depth & clicks)
    useEffect(() => {
        if (!currentSession?.id) return;

        let maxScroll = 0;
        let clickCount = 0;
        let lastUpdate = Date.now();

        const updateMetrics = () => {
            const now = Date.now();
            if (now - lastUpdate < 5000) return; // Throttle to 5s

            globalChatService.updateVisitorMetadata(currentSession.id, {
                scrollDepth: maxScroll,
                clickCount: clickCount
            });
            lastUpdate = now;
        };

        const handleScroll = () => {
            const h = document.documentElement;
            const b = document.body;
            const st = h.scrollTop || b.scrollTop;
            const sh = h.scrollHeight || b.scrollHeight;
            const ch = h.clientHeight;
            const scrollPercent = Math.round((st / (sh - ch)) * 100);

            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                updateMetrics();
            }
        };

        const handleClick = () => {
            clickCount++;
            updateMetrics();
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('click', handleClick);
        };
    }, [currentSession?.id]);

    // Load configuration
    useEffect(() => {
        const loadConfig = async () => {
            let result;
            if (forceGlobalConfig) {
                result = await widgetConfigService.getGlobalConfig();
            } else if (publicTenantId !== undefined) {
                result = await widgetConfigService.getConfig(publicTenantId);
            } else {
                result = await widgetConfigService.getConfig();
            }

            if (result?.config) {
                setConfig(result.config);
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
                if (realtimeMessage.sender_type !== 'visitor') {
                    const newMessage: Message = {
                        id: realtimeMessage.id,
                        content: realtimeMessage.content,
                        sender: realtimeMessage.sender_type,
                        timestamp: new Date(realtimeMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        senderName: realtimeMessage.sender_name
                    };
                    setMessages(prev => [...prev, newMessage]);
                }
            },
            (updatedSession) => {
                if (updatedSession.status === 'resolved' || updatedSession.status === 'expired') {
                    console.log('[Realtime] Session concluded. Resetting UI.');
                    setCurrentSession(null);
                    setShowPreChat(true);
                    setMessages([]);
                } else {
                    setCurrentSession(prev => prev ? { ...prev, ...updatedSession } : null);
                }
            }
        );

        setConnectionStatus('connected');

        return () => {
            globalChatService.unsubscribe(`session:${currentSession.id}`);
        };
    }, [currentSession?.id]);

    const handleEndChat = async () => {
        if (!currentSession?.id) return;

        if (window.confirm('Are you sure you want to end this conversation?')) {
            setIsLoading(true);
            try {
                await globalChatService.endSession(currentSession.id);
                setCurrentSession(null);
                setShowPreChat(true);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const loadChatHistory = async (sessionId: string) => {
        const { messages: history } = await globalChatService.getMessages(sessionId);
        const formattedHistory = history.map(m => ({
            id: m.id,
            content: m.content,
            sender: m.sender_type,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: m.sender_name
        }));
        setMessages(formattedHistory);
    };

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { session, error } = await globalChatService.findOrCreateSession({
                visitor_name: visitorName,
                visitor_email: visitorEmail,
                visitor_id: visitorId.current,
                tenant_id: forceGlobalConfig ? null : (publicTenantId || config?.tenant_id)
            });

            if (session) {
                setCurrentSession(session);
                setShowPreChat(false);
                loadChatHistory(session.id);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentSession || connectionStatus !== 'connected') return;

        const content = messageInput;
        setMessageInput('');

        // Optimistic update
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: tempId,
            content,
            sender: 'visitor',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: visitorName || 'You'
        }]);

        await globalChatService.sendMessage({
            session_id: currentSession.id,
            content,
            sender_type: 'visitor',
            sender_name: visitorName || 'Visitor'
        });

        // AI Response Logic - Only respond if:
        // 1. AI is enabled
        // 2. No agent is assigned yet (AI takes over until human)
        // 3. User is not an agent
        const isAgentAssigned = !!currentSession.assigned_to;

        if (config?.ai_auto_respond && !isAgentAssigned) {
            console.log('[Widget] ========== AI AUTO-RESPONSE ==========');
            console.log('[Widget] Session ID:', currentSession.id);
            console.log('[Widget] AI Provider:', config.ai_provider);
            console.log('[Widget] AI Model:', config.ai_model);

            const history = messages.map(m => ({
                role: m.sender === 'visitor' ? 'user' : 'model',
                content: m.content
            }));

            history.push({ role: 'user', content });

            try {
                const selectedApiKey =
                    config.ai_provider === 'openai' ? (config.openai_api_key || '') :
                        config.ai_provider === 'anthropic' ? (config.anthropic_api_key || '') :
                            config.ai_provider === 'mistral' ? (config.mistral_api_key || '') :
                                config.ai_provider === 'deepseek' ? (config.deepseek_api_key || '') :
                                    config.ai_provider === 'openrouter' ? (config.openrouter_api_key || '') :
                                        (config.ai_api_key || '');

                console.log('[Widget] API Key selected for provider:', config.ai_provider, 'Present:', !!selectedApiKey);

                const aiResponse = await aiService.getAIResponse({
                    message: content,
                    history: history.map(h => ({ role: h.role, parts: h.content })),
                    instructions: config.ai_knowledge_base || 'You are a helpful customer support assistant.',
                    provider: config.ai_provider || 'gemini',
                    modelName: config.ai_model,
                    apiKey: selectedApiKey
                });

                console.log('[Widget] AI Response received:', aiResponse?.substring(0, 100));

                // Validate and send AI response
                if (aiResponse && aiResponse.trim() !== '' && !aiResponse.includes("API Key is missing")) {
                    console.log('[Widget] ✅ Sending AI response to database');
                    await globalChatService.sendMessage({
                        session_id: currentSession.id,
                        content: aiResponse,
                        sender_type: 'ai',
                        sender_name: config.team_name || 'AI Assistant'
                    });
                } else if (!aiResponse || aiResponse.trim() === '') {
                    console.error('[Widget] ❌ Empty AI response, not sending');
                } else if (aiResponse.includes("API Key is missing")) {
                    console.warn('[Widget] ⚠️ AI Response skipped: Missing API Key');
                } else {
                    console.log('[Widget] ℹ️ AI response contains error message, sending as-is');
                    await globalChatService.sendMessage({
                        session_id: currentSession.id,
                        content: aiResponse,
                        sender_type: 'system',
                        sender_name: 'System'
                    });
                }
            } catch (err) {
                console.error('[Widget] ❌ Error in AI auto-response:', err);
            }
        } else if (isAgentAssigned) {
            console.log('[Widget] AI auto-response skipped: Agent assigned');
        } else {
            console.log('[Widget] AI auto-response skipped: AI disabled or not configured');
        }
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
                {config?.seasonal_theme && config.seasonal_theme !== 'none' && (
                    <div className="animate-bounce">
                        {config.seasonal_theme === 'christmas' && <Gift className="w-8 h-8 text-red-500" />}
                        {config.seasonal_theme === 'halloween' && <Ghost className="w-8 h-8 text-orange-500" />}
                        {config.seasonal_theme === 'easter' && <Rabbit className="w-8 h-8 text-pink-400" />}
                    </div>
                )}
                <button
                    onClick={() => setIsOpen(true)}
                    style={{ backgroundColor: config?.primary_color || '#2563eb' }}
                    className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 group relative"
                >
                    <MessageSquare className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                </button>
            </div>
        );
    }

    return (
        <div
            className={`fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${isMinimized ? 'h-[72px] w-72' : 'h-[600px] w-[400px]'
                }`}
        >
            <div
                className="p-4 rounded-t-2xl flex items-center justify-between cursor-pointer border-b border-slate-700/50"
                style={{ backgroundColor: config?.primary_color || '#2563eb' }}
                onClick={() => isMinimized && setIsMinimized(false)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{config?.team_name || 'Support'}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                            <span className="text-[10px] text-white/80 font-medium">We're Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {!showPreChat && currentSession && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEndChat(); }}
                            title="End Conversation"
                            className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors">
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {showPreChat ? (
                        <div className="flex-1 p-8 flex flex-col">
                            <div className="mb-8 text-center">
                                <h4 className="text-xl font-bold text-white mb-2">Welcome! 👋</h4>
                                <p className="text-slate-400 text-sm">{config?.welcome_message || 'How can we help you today?'}</p>
                            </div>
                            <form onSubmit={handleStartChat} className="space-y-4">
                                {config?.require_name && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={visitorName}
                                            onChange={(e) => setVisitorName(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                )}
                                {config?.require_email && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                                        <input
                                            required
                                            type="email"
                                            value={visitorEmail}
                                            onChange={(e) => setVisitorEmail(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{ backgroundColor: config?.primary_color || '#2563eb' }}
                                    className="w-full text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50 mt-4"
                                >
                                    {isLoading ? 'Starting...' : 'Start Conversation'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-900/50">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'visitor'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50'
                                            }`}>
                                            {msg.sender !== 'visitor' && (
                                                <span className="text-[10px] font-bold text-blue-400 mb-1 block uppercase tracking-wider">
                                                    {msg.senderName || (msg.sender === 'system' ? 'AI Assistant' : 'Agent')}
                                                </span>
                                            )}
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                            <span className="text-[10px] opacity-50 mt-1 block">{msg.timestamp}</span>
                                        </div>
                                    </div>
                                ))}

                                {config?.ai_enabled && !currentSession?.assigned_to && (
                                    <div className="flex justify-center mt-4 pt-2">
                                        <button
                                            onClick={async () => {
                                                if (currentSession?.id) {
                                                    await globalChatService.updateSession(currentSession.id, {
                                                        status: 'unassigned'
                                                    });
                                                    setMessages(prev => [...prev, {
                                                        id: 'system_' + Date.now(),
                                                        content: 'Requesting a human agent... One will be with you shortly.',
                                                        sender: 'system',
                                                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                        senderName: 'System'
                                                    }]);
                                                }
                                            }}
                                            className="text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-tighter border border-white/10 px-3 py-1.5 rounded-full transition-all"
                                        >
                                            Talk to a Human
                                        </button>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                                <form onSubmit={handleSendMessage} className="relative">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim() || connectionStatus !== 'connected'}
                                        style={{ color: config?.primary_color || '#2563eb' }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                                <p className="text-[9px] text-slate-500 text-center mt-3 uppercase tracking-widest font-bold">
                                    Powered by TalkChat Studio
                                </p>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};
