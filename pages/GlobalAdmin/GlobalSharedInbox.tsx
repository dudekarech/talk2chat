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
    MessageSquare
} from 'lucide-react';
import { globalChatService, ChatSession, ChatMessage as RealtimeChatMessage } from '../../services/globalChatRealtimeService';

interface Message {
    id: string;
    content: string;
    sender: 'visitor' | 'agent' | 'system';
    timestamp: string;
    senderName?: string;
}

interface ChatListItem {
    id: string;
    visitorName: string;
    visitorEmail?: string;
    lastMessage: string;
    timestamp: string;
    status: 'open' | 'pending' | 'resolved' | 'active';
    assignedTo?: string;
    tenant_id?: string | null;
    tags: string[];
    unreadCount: number;
    avatarColor: string;
    platform: string;
    location: string;
}

interface GlobalSharedInboxProps {
    /** If true, strictly shows global chats (tenant_id IS NULL). If false/undefined, uses user context. */
    isGlobalMode?: boolean;
}

export const GlobalSharedInbox: React.FC<GlobalSharedInboxProps> = ({ isGlobalMode = false }) => {
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'unassigned'>('all');
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

    const avatarColors = ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'];

    // Load all chat sessions on mount
    useEffect(() => {
        loadChatSessions();
    }, [isGlobalMode]);

    // Subscribe to real-time updates
    useEffect(() => {
        setConnectionStatus('connecting');

        const setupSubscription = async () => {
            // Get current user's tenant_id for real-time filtering (unless forced to global)
            let currentUserTenantId: string | null = null;

            if (!isGlobalMode) {
                const { data: { user } } = await globalChatService.supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await globalChatService.supabase
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
            globalChatService.unsubscribeAll();
        };
    }, [isGlobalMode]);

    // Load messages when chat is selected
    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat);
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

            const formattedChats: ChatListItem[] = sessions.map((session, index) => ({
                id: session.id,
                visitorName: session.visitor_name,
                visitorEmail: session.visitor_email,
                lastMessage: 'Click to view conversation',
                timestamp: formatTimestamp(session.last_activity),
                status: session.status as 'open' | 'pending' | 'resolved',
                assignedTo: session.assigned_to,
                tenant_id: session.tenant_id,
                tags: session.tags || [],
                unreadCount: 0,
                avatarColor: avatarColors[index % avatarColors.length],
                platform: session.visitor_metadata?.platform || 'web',
                location: session.visitor_metadata?.location || 'Unknown'
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
            platform: session.visitor_metadata?.platform || 'web',
            location: session.visitor_metadata?.location || 'Unknown'
        };

        setChats(prev => [newChat, ...prev]);
    };

    const updateChatInList = (sessionId: string, updates: Partial<ChatSession>) => {
        setChats(prev => prev.map(chat =>
            chat.id === sessionId
                ? {
                    ...chat,
                    status: updates.status || chat.status,
                    assignedTo: updates.assigned_to || chat.assignedTo,
                    tags: updates.tags || chat.tags,
                    timestamp: updates.last_activity ? formatTimestamp(updates.last_activity) : chat.timestamp
                }
                : chat
        ));
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
            senderName: 'Gilbert M.'
        };
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const { message, error } = await globalChatService.sendMessage({
                session_id: selectedChat,
                content: messageContent,
                sender_type: 'agent',
                sender_id: 'admin_gilbert',
                sender_name: 'Gilbert M.'
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

    const handleUpdateChatStatus = async (chatId: string, status: 'open' | 'pending' | 'resolved') => {
        try {
            await globalChatService.updateSession(chatId, { status });
            // Update will be handled by real-time subscription
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
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">No conversations yet</p>
                            <p className="text-xs mt-1">New chats will appear here</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => setSelectedChat(chat.id)}
                                className={`p-4 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors ${selectedChat === chat.id ? 'bg-slate-700/50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${chat.status === 'open' ? 'bg-green-500' : chat.status === 'pending' ? 'bg-orange-500' : 'bg-slate-500'}`} />
                                        <span className="font-semibold text-sm truncate">{chat.visitorName}</span>
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
                                <h3 className="font-bold text-white">{activeChat.visitorName}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span>{activeChat.location}</span>
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
                            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors" title="Transfer Chat">
                                <CornerUpRight className="w-5 h-5" />
                            </button>
                            <div className="h-6 w-px bg-slate-700 mx-1" />
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
                                <button className="hover:text-blue-400 transition-colors">Internal Note</button>
                                <button className="hover:text-blue-400 transition-colors">Canned Response</button>
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

            {/* Right Sidebar - Visitor Info */}
            {activeChat && (
                <div className="w-72 border-l border-slate-700 bg-slate-800/30 p-6 hidden xl:block">
                    <div className="text-center mb-6">
                        <div className={`w-20 h-20 rounded-full ${activeChat.avatarColor} mx-auto flex items-center justify-center text-2xl font-bold text-white mb-3`}>
                            {activeChat.visitorName.charAt(0)}
                        </div>
                        <h3 className="font-bold text-white text-lg">{activeChat.visitorName}</h3>
                        <p className="text-sm text-slate-400">{activeChat.visitorEmail || 'Anonymous Visitor'}</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visitor Details</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Location</span>
                                    <span className="text-white">{activeChat.location}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Platform</span>
                                    <span className="text-white capitalize">{activeChat.platform}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Status</span>
                                    <span className={`text-xs font-semibold ${activeChat.status === 'open' ? 'text-green-400' :
                                        activeChat.status === 'pending' ? 'text-orange-400' :
                                            'text-slate-400'
                                        }`}>
                                        {activeChat.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Actions</h4>
                            <div className="space-y-2">
                                <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Assign Agent
                                </button>
                                <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    Add Tags
                                </button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Notes</h4>
                            <textarea
                                placeholder="Add internal note..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
