import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import {
    MessageSquare, Clock, TrendingUp, Users, Star, Activity, CheckCircle,
    AlertCircle, BarChart3, Zap, Send, MoreVertical, User, Phone,
    Mail, MapPin, Globe, Monitor, ArrowUpCircle, FileText, Plus, X
} from 'lucide-react';
import { VisitorInfoPanel } from '../components/VisitorInfoPanel';
import { useWidgetConfig } from '../hooks/useWidgetConfig';

interface AgentStats {
    totalChats: number;
    activeChats: number;
    completedChats: number;
    avgResponseTime: number;
    totalMessages: number;
    satisfactionRating: number;
}

interface Chat {
    id: string;
    visitor_id: string;
    visitor_name: string;
    visitor_email: string;
    status: string;
    assigned_agent_id?: string;
    created_at: string;
    last_message_at: string;
    unread_count?: number;
}

interface Message {
    id: string;
    session_id: string;
    message: string;
    sender_type: 'visitor' | 'agent';
    created_at: string;
    sender_name?: string;
}

interface Note {
    id: string;
    session_id: string;
    note: string;
    created_by: string;
    created_at: string;
}

export const AgentDashboard: React.FC = () => {
    const [agentInfo, setAgentInfo] = useState<any>(null);
    const [stats, setStats] = useState<AgentStats>({
        totalChats: 0,
        activeChats: 0,
        completedChats: 0,
        avgResponseTime: 0,
        totalMessages: 0,
        satisfactionRating: 0
    });
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newNote, setNewNote] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [showNotes, setShowNotes] = useState(false);
    const [showEscalate, setShowEscalate] = useState(false);
    const { config } = useWidgetConfig();

    useEffect(() => {
        loadAgentInfo();
        loadStats();
        loadChats();

        // Real-time subscriptions
        const chatsSubscription = supabase
            .channel('agent-chats')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'global_chat_sessions' },
                () => {
                    loadChats();
                    loadStats();
                }
            )
            .subscribe();

        const messagesSubscription = supabase
            .channel('agent-messages')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'global_chat_messages' },
                (payload) => {
                    if (selectedChat && payload.new.session_id === selectedChat.id) {
                        loadMessages(selectedChat.id);
                    }
                }
            )
            .subscribe();

        return () => {
            chatsSubscription.unsubscribe();
            messagesSubscription.unsubscribe();
        };
    }, [selectedChat]);

    const loadAgentInfo = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            setAgentInfo({ ...user, profile });
        }
    };

    const loadStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single();

            if (!profile?.tenant_id) return;

            // Count total active chats (any status)
            const { count: totalCount, error: totalError } = await supabase
                .from('global_chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', profile.tenant_id)
                .in('status', ['active', 'pending', 'waiting']);

            // Count completed chats today
            const today = new Date().toISOString().split('T')[0];
            const { count: completedCount, error: completedError } = await supabase
                .from('global_chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', profile.tenant_id)
                .eq('status', 'completed')
                .gte('created_at', `${today}T00:00:00`)
                .lte('created_at', `${today}T23:59:59`);

            if (!totalError && !completedError) {
                setStats({
                    totalChats: totalCount || 0,
                    activeChats: totalCount || 0,
                    completedChats: completedCount || 0,
                    avgResponseTime: 0,
                    totalMessages: 0,
                    satisfactionRating: 0
                });
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Keep stats at 0 if there's an error
        }
    };

    const loadChats = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.tenant_id) return;

        // Show ALL active/pending/waiting chats (unassigned, AI handovers, and assigned)
        const { data } = await supabase
            .from('global_chat_sessions')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .in('status', ['active', 'pending', 'waiting', 'unassigned'])
            .order('created_at', { ascending: false });

        setChats(data || []);
    };

    const loadMessages = async (sessionId: string) => {
        const { data } = await supabase
            .from('global_chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        setMessages(data || []);
    };

    const loadNotes = async (sessionId: string) => {
        const { data } = await supabase
            .from('chat_notes')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false });

        setNotes(data || []);
    };

    const handleSelectChat = async (chat: Chat) => {
        setSelectedChat(chat);
        await loadMessages(chat.id);
        await loadNotes(chat.id);

        // Assign to self if unassigned
        if (!chat.assigned_agent_id && agentInfo) {
            await supabase
                .from('global_chat_sessions')
                .update({
                    assigned_agent_id: agentInfo.id,
                    status: 'active'
                })
                .eq('id', chat.id);

            await loadChats();
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || !agentInfo) return;

        const { error } = await supabase
            .from('global_chat_messages')
            .insert({
                session_id: selectedChat.id,
                message: newMessage,
                sender_type: 'agent',
                sender_name: agentInfo.profile?.name || 'Agent'
            });

        if (!error) {
            setNewMessage('');
            await loadMessages(selectedChat.id);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !selectedChat || !agentInfo) return;

        const { error } = await supabase
            .from('chat_notes')
            .insert({
                session_id: selectedChat.id,
                note: newNote,
                created_by: agentInfo.id
            });

        if (!error) {
            setNewNote('');
            await loadNotes(selectedChat.id);
            setShowNotes(true);
        }
    };

    const handleEscalate = async () => {
        if (!selectedChat) return;

        const { error } = await supabase
            .from('global_chat_sessions')
            .update({
                status: 'escalated',
                escalated_at: new Date().toISOString()
            })
            .eq('id', selectedChat.id);

        if (!error) {
            alert('Chat escalated to supervisor');
            setShowEscalate(false);
            await loadChats();
            setSelectedChat(null);
        }
    };

    const handleResolveChat = async () => {
        if (!selectedChat) return;

        const { error } = await supabase
            .from('global_chat_sessions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', selectedChat.id);

        if (!error) {
            await loadChats();
            setSelectedChat(null);
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        return `${mins}m ${seconds % 60}s`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (!agentInfo) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-full px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {getGreeting()}, {agentInfo.profile?.name || 'Agent'}! 👋
                            </h1>
                            <p className="text-slate-400 text-sm">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>

                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${isOnline
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                }`}
                        >
                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                            {isOnline ? 'Online' : 'Offline'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-full px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Active Chats', value: stats.activeChats, icon: MessageSquare, color: 'blue', trend: '+12%' },
                        { label: 'Completed Today', value: stats.completedChats, icon: CheckCircle, color: 'green', trend: '+8%' },
                        { label: 'Avg Response', value: formatTime(stats.avgResponseTime), icon: Clock, color: 'orange', trend: '-15%' },
                        { label: 'Satisfaction', value: `${(stats.satisfactionRating * 100).toFixed(0)}%`, icon: Star, color: 'yellow', trend: '+5%' }
                    ].map((stat, index) => (
                        <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 bg-${stat.color}-500/10 rounded-lg`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                                </div>
                                <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                                    {stat.trend}
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content - Inbox and Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Shared Inbox */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 h-[calc(100vh-400px)] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-white font-bold flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-blue-400" />
                                    Shared Inbox
                                </h2>
                                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                                    {chats.length} chats
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2">
                                {chats.length === 0 ? (
                                    <div className="text-center py-12">
                                        <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-400">No active chats</p>
                                        <p className="text-slate-500 text-sm mt-1">Waiting for visitors...</p>
                                    </div>
                                ) : (
                                    chats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            onClick={() => handleSelectChat(chat)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all ${selectedChat?.id === chat.id
                                                ? 'bg-blue-500/20 border border-blue-500/50'
                                                : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {chat.visitor_name?.charAt(0).toUpperCase() || 'V'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-white text-sm truncate">{chat.visitor_name || 'Anonymous'}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                {chat.unread_count && (
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                        {chat.unread_count}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="lg:col-span-2">
                        {selectedChat ? (
                            <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col h-[calc(100vh-400px)]">
                                {/* Chat Header */}
                                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {selectedChat.visitor_name?.charAt(0).toUpperCase() || 'V'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{selectedChat.visitor_name || 'Anonymous'}</p>
                                            <p className="text-xs text-slate-400">{selectedChat.visitor_email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowNotes(!showNotes)}
                                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Notes ({notes.length})
                                        </button>
                                        <button
                                            onClick={() => setShowEscalate(true)}
                                            className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                                        >
                                            <ArrowUpCircle className="w-4 h-4" />
                                            Escalate
                                        </button>
                                        <button
                                            onClick={handleResolveChat}
                                            className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Resolve
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] ${msg.sender_type === 'agent' ? 'bg-blue-600' : 'bg-slate-700'} rounded-lg p-3`}>
                                                {msg.sender_type === 'visitor' && (
                                                    <p className="text-xs text-slate-400 mb-1">{msg.sender_name || 'Visitor'}</p>
                                                )}
                                                <p className="text-white text-sm">{msg.message}</p>
                                                <p className="text-xs text-slate-300 mt-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-slate-700">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send
                                        </button>
                                    </form>

                                    {/* Add Note */}
                                    <form onSubmit={handleAddNote} className="mt-2 flex gap-2">
                                        <input
                                            type="text"
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Add internal note..."
                                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newNote.trim()}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Note
                                        </button>
                                    </form>
                                </div>

                                {/* Notes Panel */}
                                {showNotes && (
                                    <div className="border-t border-slate-700 p-4 max-h-48 overflow-y-auto bg-slate-900/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-white text-sm">Internal Notes</h3>
                                            <button onClick={() => setShowNotes(false)}>
                                                <X className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                        {notes.length === 0 ? (
                                            <p className="text-slate-500 text-sm">No notes yet</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {notes.map((note) => (
                                                    <div key={note.id} className="bg-slate-800 rounded p-2">
                                                        <p className="text-white text-sm">{note.note}</p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {new Date(note.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-800 border border-slate-700 rounded-xl h-[calc(100vh-400px)] flex items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">Select a chat to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Escalate Modal */}
            {showEscalate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Escalate Chat</h3>
                        <p className="text-slate-400 mb-6">
                            This will escalate the chat to a supervisor or manager for further assistance.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEscalate(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEscalate}
                                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all"
                            >
                                Escalate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
