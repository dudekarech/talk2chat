import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    Send,
    Paperclip,
    Smile,
    CheckCircle,
    Tag,
    Users,
    CornerUpRight,
    MessageSquare,
    Clock,
    Activity,
    FileText,
    TrendingUp,
    Globe,
    Monitor,
    Smartphone,
    MapPin,
    Target,
    BarChart,
    Trash2,
    Download,
    Instagram,
    Facebook,
    MessageCircle
} from 'lucide-react';
import { globalChatService, ChatSession, ChatMessage as RealtimeChatMessage, ChatNote, supabase } from '../../services/globalChatRealtimeService';
import { notificationService } from '../../services/notificationService';
import { presenceService, PresenceState } from '../../services/presenceService';
import { Loader2 } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    sender: 'visitor' | 'agent' | 'system' | 'ai';
    timestamp: string;
    senderName?: string;
}

interface ChatListItem {
    id: string;
    visitorName: string;
    visitorEmail?: string;
    lastMessage: string;
    timestamp: string;
    status: ChatSession['status'];
    assignedTo?: string;
    tenant_id?: string | null;
    tags: string[];
    unreadCount: number;
    avatarColor: string;
    platform: string;
    location: string;
    visitor_metadata?: ChatSession['visitor_metadata'];
    ai_summary?: string;
    ai_sentiment?: string;
    resolution_category?: string;
    extracted_lead_info?: any;
    is_deleted?: boolean;
}

interface GlobalSharedInboxProps {
    /** If true, strictly shows global chats (tenant_id IS NULL). If false/undefined, uses user context. */
    isGlobalMode?: boolean;
}

export const GlobalSharedInbox: React.FC<GlobalSharedInboxProps> = ({ isGlobalMode = false }) => {
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'unassigned' | 'resolved'>('all');
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

    // Enhanced State
    const [notes, setNotes] = useState<ChatNote[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [noteInput, setNoteInput] = useState('');
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [presence, setPresence] = useState<PresenceState>({});

    const avatarColors = ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'];

    // Load initial data
    useEffect(() => {
        loadChatSessions();
        loadAgentsAndProfile();
    }, [isGlobalMode]);

    const loadAgentsAndProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
            setCurrentUserProfile(profile);

            // Load team members for assignment
            const { data: team } = await notificationService.getAgents(isGlobalMode ? null : undefined);
            setAgents(team || []);

            // Join Presence
            presenceService.joinPresence(user.id, {
                name: profile?.name || user.email,
                role: profile?.role || 'agent'
            }, (state) => {
                setPresence(state);
            });
        }
    };

    // Subscribe to real-time updates
    useEffect(() => {
        setConnectionStatus('connecting');

        const setupSubscription = async () => {
            // Get current user's tenant_id for real-time filtering (unless forced to global)
            let currentUserTenantId: string | null = null;

            if (!isGlobalMode) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('tenant_id')
                        .eq('user_id', user.id)
                        .single();
                    currentUserTenantId = profile?.tenant_id || null;
                }
            }

            console.log('[Inbox] Setting up subscription. Mode:', isGlobalMode ? 'GLOBAL' : 'CONTEXTAL', 'tenantId:', currentUserTenantId);

            const channel = globalChatService.subscribeToAllSessions(
                (newSession: ChatSession) => {
                    // CRITICAL: Filter real-time sessions to prevent leakage
                    const isMatch = isGlobalMode
                        ? newSession.tenant_id === null               // Global mode: Only NULL
                        : (currentUserTenantId
                            ? newSession.tenant_id === currentUserTenantId // Tenant context
                            : newSession.tenant_id === null                // Fallback global context
                        );

                    if (isMatch) {
                        console.log('[Inbox] New session matches context:', newSession);
                        addChatToList(newSession);
                    } else {
                        console.log('[Inbox] Ignoring session (different context):', newSession.tenant_id);
                    }
                },
                (newMessage: RealtimeChatMessage) => {
                    handleNewMessage(newMessage);
                },
                (updatedSession: Partial<ChatSession> & { id: string }) => {
                    if (updatedSession.id) {
                        updateChatInList(updatedSession.id, updatedSession);
                    }
                }
            );

            if (channel) {
                setConnectionStatus('connected');
            }
        };

        setupSubscription();

        return () => {
            console.log('[Inbox] Cleaning up all_sessions subscription');
            globalChatService.unsubscribe('all_sessions');
        };
    }, [isGlobalMode]);

    // Load messages and notes when chat is selected
    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat);
            loadNotes(selectedChat);
        }
    }, [selectedChat]);

    const loadChatSessions = async () => {
        setIsLoading(true);
        try {
            // Updated to pass a forceGlobal flag if we are in global mode
            const { sessions, error } = await globalChatService.getSessions({
                forceGlobal: isGlobalMode
            });

            if (error) {
                console.error('Error loading sessions:', error);
                return;
            }

            const activeSessions = sessions.filter(s => !s.is_deleted);

            const formattedChats: ChatListItem[] = sessions.map((session, index) => ({
                id: session.id,
                visitorName: session.visitor_name,
                visitorEmail: session.visitor_email,
                lastMessage: 'Click to view conversation',
                timestamp: formatTimestamp(session.last_activity || session.created_at),
                status: session.status,
                assignedTo: session.assigned_to,
                tenant_id: session.tenant_id,
                tags: session.tags || [],
                unreadCount: 0,
                avatarColor: avatarColors[index % avatarColors.length],
                platform: session.channel || session.visitor_metadata?.platform || 'web',
                location: session.visitor_metadata?.location || 'Unknown',
                visitor_metadata: session.visitor_metadata,
                ai_summary: session.ai_summary,
                ai_sentiment: session.ai_sentiment,
                resolution_category: session.resolution_category,
                extracted_lead_info: session.extracted_lead_info,
                is_deleted: session.is_deleted
            }));

            setChats(formattedChats);

            // Auto-select first chat if available
            if (formattedChats.length > 0 && !selectedChat) {
                setSelectedChat(formattedChats[0].id);
            }
        } catch (error) {
            console.error('Error loading chat sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (sessionId: string) => {
        try {
            const { messages: fetchedMessages, error } = await globalChatService.getMessages(sessionId);

            if (error) {
                console.error('Error loading messages:', error);
                return;
            }

            const formattedMessages: Message[] = fetchedMessages.map(msg => ({
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
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleNewMessage = (realtimeMessage: RealtimeChatMessage) => {
        // Update messages if it's for the selected chat
        if (selectedChat === realtimeMessage.session_id) {
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

        // Update chat list with last message
        setChats(prev => prev.map(chat =>
            chat.id === realtimeMessage.session_id
                ? {
                    ...chat,
                    lastMessage: realtimeMessage.content.substring(0, 50) + (realtimeMessage.content.length > 50 ? '...' : ''),
                    timestamp: formatTimestamp(realtimeMessage.created_at),
                    unreadCount: chat.id === selectedChat ? chat.unreadCount : chat.unreadCount + 1
                }
                : chat
        ));
    };

    const loadNotes = async (sessionId: string) => {
        const { notes, error } = await globalChatService.getNotes(sessionId);
        if (!error) setNotes(notes);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteInput.trim() || !selectedChat) return;

        const { note, error } = await globalChatService.addNote(selectedChat, noteInput);
        if (!error && note) {
            setNotes(prev => [note, ...prev]);
            setNoteInput('');
        }
    };

    const handleAssignAgent = async (agentId: string) => {
        if (!selectedChat) return;

        const { error } = await globalChatService.updateSession(selectedChat, {
            assigned_to: agentId,
            status: 'active'
        });

        if (!error) {
            updateChatInList(selectedChat, { assigned_to: agentId, status: 'active' });
        }
    };

    const handleQualifyLead = async (metadata: Partial<ChatSession['visitor_metadata']>) => {
        if (!selectedChat) return;

        const { error } = await globalChatService.updateVisitorMetadata(selectedChat, metadata);
        if (!error) {
            setChats(prev => prev.map(chat =>
                chat.id === selectedChat
                    ? { ...chat, visitor_metadata: { ...chat.visitor_metadata, ...metadata } }
                    : chat
            ));
        }
    };

    const addChatToList = (session: ChatSession) => {
        const newChat: ChatListItem = {
            id: session.id,
            visitorName: session.visitor_name,
            visitorEmail: session.visitor_email,
            lastMessage: 'New conversation started',
            timestamp: formatTimestamp(session.created_at),
            status: session.status,
            assignedTo: session.assigned_to,
            tags: session.tags || [],
            unreadCount: 1,
            avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
            platform: session.channel || session.visitor_metadata?.platform || 'web',
            location: session.visitor_metadata?.location || 'Unknown',
            visitor_metadata: session.visitor_metadata
        };

        setChats(prev => [newChat, ...prev]);
    };

    const updateChatInList = (sessionId: string, updates: Partial<ChatSession>) => {
        setChats(prev => prev.map(chat =>
            chat.id === sessionId
                ? {
                    ...chat,
                    status: (updates.status as any) || chat.status,
                    assignedTo: updates.assigned_to || chat.assignedTo,
                    tags: updates.tags || chat.tags,
                    timestamp: updates.last_activity ? formatTimestamp(updates.last_activity) : chat.timestamp,
                    visitor_metadata: updates.visitor_metadata || chat.visitor_metadata
                }
                : chat
        ));
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedChat || isSending) return;

        const messageContent = messageInput;
        setMessageInput('');
        setIsSending(true);

        // Optimistically add message
        const optimisticMessage: Message = {
            id: `temp_${Date.now()}`,
            content: messageContent,
            sender: 'agent',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: currentUserProfile?.name || 'Agent'
        };
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const { message, error } = await globalChatService.sendMessage({
                session_id: selectedChat,
                content: messageContent,
                sender_type: 'agent',
                sender_id: currentUserProfile?.user_id || 'unknown_agent',
                sender_name: currentUserProfile?.name || 'Agent'
            });

            if (error) {
                console.error('Error sending message:', error);
                // Remove optimistic message
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
                return;
            }

            // Replace optimistic message with real one
            if (message) {
                setMessages(prev => prev.map(m =>
                    m.id === optimisticMessage.id
                        ? { ...m, id: message.id }
                        : m
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleUpdateChatStatus = async (chatId: string, status: 'open' | 'pending' | 'resolved' | 'escalated') => {
        try {
            if (status === 'resolved') {
                await globalChatService.endSession(chatId);
            } else {
                await globalChatService.updateSession(chatId, { status });
            }
        } catch (error) {
            console.error('Error updating chat status:', error);
        }
    };

    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const handleExportChat = () => {
        if (!selectedChat || messages.length === 0) return;

        const activeChat = chats.find(c => c.id === selectedChat);
        const transcript = messages
            .map(m => `[${m.timestamp}] ${m.senderName || m.sender}: ${m.content}`)
            .join('\n');

        const metadata = [
            `Chat ID: ${selectedChat}`,
            `Visitor: ${activeChat?.visitorName}`,
            `Email: ${activeChat?.visitorEmail || 'N/A'}`,
            `Status: ${activeChat?.status}`,
            `Summary: ${activeChat?.ai_summary || 'N/A'}`,
            `Sentiment: ${activeChat?.ai_sentiment || 'N/A'}`
        ].join('\n');

        const fullExport = `${metadata}\n\n--- TRANSCRIPT ---\n\n${transcript}`;

        const blob = new Blob([fullExport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_export_${selectedChat}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDeleteChat = async (chatId: string) => {
        if (window.confirm('Are you sure you want to delete this conversation? It will be removed from your inbox.')) {
            try {
                const { success } = await globalChatService.softDeleteSession(chatId);
                if (success) {
                    setChats(prev => prev.filter(c => c.id !== chatId));
                    setSelectedChat(null);
                }
            } catch (error) {
                console.error('Error deleting chat:', error);
            }
        }
    };

    const getFilteredChats = () => {
        const { data: user } = { data: { user: currentUserProfile } }; // Fallback to current profile
        const userId = currentUserProfile?.user_id;

        if (activeTab === 'mine') {
            return chats.filter(c => c.assignedTo === userId && c.status !== 'resolved');
        }
        if (activeTab === 'unassigned') {
            return chats.filter(c => !c.assignedTo && c.status !== 'resolved');
        }
        if (activeTab === 'resolved') {
            return chats.filter(c => c.status === 'resolved');
        }
        // 'all' tab shows everything except resolved
        return chats.filter(c => c.status !== 'resolved');
    };

    const activeChat = chats.find(c => c.id === selectedChat);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-900 text-white overflow-hidden">
            {/* Chat List Sidebar */}
            <div className="w-80 border-r border-slate-700 flex flex-col bg-slate-800/50">
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Global Inbox</h2>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' :
                                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                                    'bg-red-400'
                                }`}></span>
                            <span className="text-xs text-slate-400">
                                {connectionStatus === 'connected' ? 'Live' :
                                    connectionStatus === 'connecting' ? 'Connecting' :
                                        'Offline'}
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        All ({chats.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('mine')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mine' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Mine
                    </button>
                    <button
                        onClick={() => setActiveTab('unassigned')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'unassigned' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Unassigned
                    </button>
                    <button
                        onClick={() => setActiveTab('resolved')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resolved' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        Resolved
                    </button>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {getFilteredChats().length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">No conversations yet</p>
                            <p className="text-xs mt-1">New chats will appear here</p>
                        </div>
                    ) : (
                        getFilteredChats().map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => setSelectedChat(chat.id)}
                                className={`p-4 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors ${selectedChat === chat.id ? 'bg-slate-700/50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${presence[chat.visitor_metadata?.visitor_id || ''] ? 'bg-green-400 animate-pulse' : (chat.status === 'open' ? 'bg-green-500' : chat.status === 'pending' ? 'bg-orange-500' : 'bg-slate-500')}`} />
                                        <span className="font-semibold text-sm truncate">{chat.visitorName}</span>
                                        {presence[chat.visitor_metadata?.visitor_id || ''] && (
                                            <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded uppercase font-bold">Online</span>
                                        )}
                                        {/* Platform Icon */}
                                        {chat.platform === 'whatsapp' && <MessageCircle className="w-3 h-3 text-green-500" title="WhatsApp" />}
                                        {chat.platform === 'instagram' && <Instagram className="w-3 h-3 text-pink-500" title="Instagram" />}
                                        {chat.platform === 'facebook' && <Facebook className="w-3 h-3 text-blue-500" title="Messenger" />}
                                        {chat.platform === 'web' && <Globe className="w-3 h-3 text-slate-400" title="Web" />}
                                    </div>
                                    <span className="text-xs text-slate-500">{chat.timestamp}</span>
                                </div>
                                <p className="text-xs text-slate-400 truncate mb-2">{chat.lastMessage}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        {chat.tags.map(tag => (
                                            <span key={tag} className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300">{tag}</span>
                                        ))}
                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            {activeChat ? (
                <div className="flex-1 flex flex-col bg-slate-900">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-slate-700 flex items-center justify-between px-6 bg-slate-800/30">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full ${activeChat.avatarColor} flex items-center justify-center text-white font-bold`}>
                                {activeChat.visitorName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    {activeChat.visitorName}
                                    {presence[activeChat.visitor_metadata?.visitor_id || ''] && (
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Active now" />
                                    )}
                                    <span className="ml-1 opacity-50">
                                        {activeChat.platform === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5 text-green-500" />}
                                        {activeChat.platform === 'instagram' && <Instagram className="w-3.5 h-3.5 text-pink-500" />}
                                        {activeChat.platform === 'facebook' && <Facebook className="w-3.5 h-3.5 text-blue-500" />}
                                        {activeChat.platform === 'web' && <Globe className="w-3.5 h-3.5 text-slate-400" />}
                                    </span>
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    {presence[activeChat.visitor_metadata?.visitor_id || ''] ? (
                                        <span className="text-green-400">Active now on {activeChat.visitor_metadata?.currentUrl || 'Site'}</span>
                                    ) : (
                                        <span>{activeChat.location}</span>
                                    )}
                                    <span>•</span>
                                    <span>{activeChat.visitorEmail || 'No email'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleUpdateChatStatus(activeChat.id, 'resolved')}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-green-400 transition-colors"
                                title="Resolve Chat"
                            >
                                <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleUpdateChatStatus(activeChat.id, 'escalated')}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-orange-400 transition-colors"
                                title="Escalate Chat"
                            >
                                <TrendingUp className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Transfer Chat">
                                <CornerUpRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleExportChat}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                                title="Export Transcript"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <div className="h-6 w-px bg-slate-700 mx-1" />
                            <button
                                onClick={() => handleDeleteChat(activeChat.id)}
                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                title="Delete Conversation"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] ${msg.sender === 'system' ? 'w-full flex justify-center' : ''}`}>
                                    {msg.sender === 'system' ? (
                                        <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{msg.content}</span>
                                    ) : (
                                        <div className={`rounded-2xl p-4 ${msg.sender === 'agent'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'agent' ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {msg.timestamp} • {msg.senderName}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Typing Indicator */}
                    {activeChat && presence[activeChat.visitor_metadata?.visitor_id || '']?.[0]?.is_typing && (
                        <div className="px-6 py-2 flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{activeChat.visitorName} is typing...</span>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-slate-800/30 border-t border-slate-700">
                        <form onSubmit={handleSendMessage} className="relative">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder={connectionStatus === 'connected' ? "Type your message..." : "Connecting..."}
                                disabled={connectionStatus !== 'connected' || isSending}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-32 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button type="button" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <button type="button" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                    <Smile className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim() || connectionStatus !== 'connected' || isSending}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
                            <span>Enter to send, Shift + Enter for new line</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const noteArea = document.querySelector('textarea[placeholder="Add private note for team..."]') as HTMLTextAreaElement;
                                        if (noteArea) noteArea.focus();
                                    }}
                                    className="hover:text-blue-400 transition-colors"
                                >
                                    Internal Note
                                </button>
                                <button type="button" className="hover:text-blue-400 transition-colors">Canned Response</button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg">Select a conversation to start chatting</p>
                </div>
            )}

            {/* Right Sidebar - Visitor Info & Collaboration */}
            {activeChat && (
                <div className="w-80 border-l border-slate-700 bg-slate-800/30 overflow-y-auto hidden xl:block">
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <div className={`w-20 h-20 rounded-full ${activeChat.avatarColor} mx-auto flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg`}>
                                {activeChat.visitorName.charAt(0)}
                            </div>
                            <h3 className="font-bold text-white text-lg">{activeChat.visitorName}</h3>
                            <p className="text-sm text-slate-400 font-mono">{activeChat.visitorEmail || 'Anonymous Visitor'}</p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${activeChat.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                    activeChat.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                        'bg-orange-500/20 text-orange-400'
                                    }`}>
                                    {activeChat.status}
                                </span>
                                {(activeChat.visitor_metadata?.scrollDepth || 0) > 50 || (activeChat.visitor_metadata?.leadScore || 0) > 50 ? (
                                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-[10px] font-bold uppercase flex items-center gap-1 animate-pulse">
                                        <TrendingUp className="w-3 h-3" />
                                        High Value
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded text-[10px] font-bold uppercase">
                                        Low Activity
                                    </span>
                                )}
                                {activeChat.assignedTo && (
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Assigned
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Visitor Metrics Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-blue-400" />
                                    Live Metrics
                                </h4>
                                <div className="space-y-4">
                                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                                <Target className="w-3 h-3 text-cyan-400" />
                                                Scroll Depth
                                            </span>
                                            <span className="text-xs font-bold text-white">{activeChat.visitor_metadata?.scrollDepth || 0}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-cyan-400 transition-all duration-500"
                                                style={{ width: `${activeChat.visitor_metadata?.scrollDepth || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                                            <span className="text-[10px] text-slate-500 uppercase">Lead Score</span>
                                            <p className="text-lg font-bold text-orange-400">{activeChat.visitor_metadata?.leadScore || 0}</p>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                                            <span className="text-[10px] text-slate-500 uppercase">Clicks</span>
                                            <p className="text-lg font-bold text-pink-400">{activeChat.visitor_metadata?.clickCount || 0}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 flex items-center gap-1.5">
                                                <Globe className="w-3 h-3" /> Location
                                            </span>
                                            <span className="text-white">{activeChat.location}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 flex items-center gap-1.5">
                                                <Monitor className="w-3 h-3" /> Device
                                            </span>
                                            <span className="text-white capitalize truncate max-w-[120px]">{activeChat.platform}, {activeChat.visitor_metadata?.browser || 'Web'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Intelligence Section (Trendsetter Feature) */}
                            {activeChat.ai_summary && (
                                <div className="p-5 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-2 border-blue-500/30 rounded-2xl shadow-xl">
                                    <h4 className="text-[11px] font-black text-blue-300 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            AI Analyst Report
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                                    </h4>

                                    {activeChat.resolution_category && (
                                        <div className="mb-4">
                                            <span className="text-[10px] px-3 py-1 bg-blue-500 text-white rounded-md font-bold uppercase tracking-widest shadow-lg">
                                                {activeChat.resolution_category}
                                            </span>
                                        </div>
                                    )}

                                    <div className="bg-slate-900/60 p-4 rounded-xl border border-blue-500/20 mb-5">
                                        <p className="text-xs text-blue-100 leading-relaxed font-semibold">
                                            {activeChat.ai_summary}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blue-500/20">
                                        <div className="bg-slate-900/40 p-2 rounded-lg">
                                            <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Sentiment</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${activeChat.ai_sentiment === 'Positive' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                activeChat.ai_sentiment === 'Negative' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                }`}>
                                                {activeChat.ai_sentiment}
                                            </span>
                                        </div>
                                        {activeChat.extracted_lead_info?.email && (
                                            <div className="bg-slate-900/40 p-2 rounded-lg">
                                                <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Email Captured</span>
                                                <span className="text-[10px] text-blue-300 font-bold truncate block" title={activeChat.extracted_lead_info.email}>
                                                    {activeChat.extracted_lead_info.email}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Lead Qualification Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 text-green-400" />
                                    Lead Qualification
                                </h4>
                                <div className="space-y-2">
                                    <select
                                        onChange={(e) => handleQualifyLead({ industry: e.target.value })}
                                        value={activeChat.visitor_metadata?.industry || ''}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Industry</option>
                                        <option value="tech">Technology</option>
                                        <option value="finance">Finance</option>
                                        <option value="healthcare">Healthcare</option>
                                        <option value="retail">Retail</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleQualifyLead({ leadScore: (activeChat.visitor_metadata?.leadScore || 0) + 10 })}
                                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-[10px] font-bold text-white transition-colors"
                                        >
                                            + LEAD SCORE
                                        </button>
                                        <button
                                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-[10px] font-bold text-white transition-colors"
                                            title="Add Custom Tag"
                                        >
                                            <Tag className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Assignment Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Users className="w-3 h-3 text-purple-400" />
                                    Assign Agent
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-2">
                                        {agents.length === 0 ? (
                                            <p className="text-[10px] text-slate-500 italic">No other agents online</p>
                                        ) : (
                                            <select
                                                value={activeChat.assignedTo || ''}
                                                onChange={(e) => handleAssignAgent(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:ring-1 focus:ring-purple-500"
                                            >
                                                <option value="">Unassigned</option>
                                                {agents.map(agent => (
                                                    <option key={agent.user_id || agent.email || Math.random()} value={agent.user_id || ''}>{agent.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        {!activeChat.assignedTo && (
                                            <button
                                                onClick={() => currentUserProfile && handleAssignAgent(currentUserProfile.user_id)}
                                                className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-xs font-bold transition-all"
                                            >
                                                ASSIGN TO ME
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Internal Notes Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-orange-400" />
                                    Internal Notes
                                </h4>
                                <form onSubmit={handleAddNote} className="mb-4">
                                    <textarea
                                        value={noteInput}
                                        onChange={(e) => setNoteInput(e.target.value)}
                                        placeholder="Add private note for team..."
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none h-20 mb-2"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!noteInput.trim()}
                                        className="w-full py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Save Note
                                    </button>
                                </form>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {notes.length === 0 ? (
                                        <p className="text-[10px] text-slate-600 italic text-center py-4">No internal notes yet</p>
                                    ) : (
                                        notes.map(note => (
                                            <div key={note.id} className="bg-slate-900/30 border-l-2 border-orange-500/50 p-2 rounded">
                                                <p className="text-[11px] text-slate-300 leading-relaxed mb-1">{note.note}</p>
                                                <div className="flex justify-between items-center text-[9px] text-slate-500">
                                                    <span>{formatTimestamp(note.created_at)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
