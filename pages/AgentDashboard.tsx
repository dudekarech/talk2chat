import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import {
    MessageSquare, Clock, TrendingUp, Users, Star, Activity, CheckCircle,
    AlertCircle, BarChart3, Zap, Send, MoreVertical, User, Phone,
    Mail, MapPin, Globe, Monitor, ArrowUpCircle, FileText, Plus, X, Shield
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
    assigned_to?: string;
    created_at: string;
    last_message_at: string;
    unread_count?: number;
    notes_count?: number;
    // AI Enrichment Fields
    ai_summary?: string;
    ai_sentiment?: string;
    extracted_lead_info?: {
        email?: string;
        phone?: string;
        company?: string;
        name?: string;
    };
    resolution_category?: string;
}

interface Message {
    id: string;
    session_id: string;
    content: string;
    sender_type: 'visitor' | 'agent' | 'system' | 'ai';
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
    const [messagesLoading, setMessagesLoading] = useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const { config } = useWidgetConfig();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

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

            const tenantId = profile?.tenant_id;

            // Count total active chats (any status)
            let totalQuery = supabase
                .from('global_chat_sessions')
                .select('*', { count: 'exact', head: true })
                .in('status', ['active', 'pending', 'waiting']);

            if (tenantId) {
                totalQuery = totalQuery.eq('tenant_id', tenantId);
            } else {
                totalQuery = totalQuery.is('tenant_id', null);
            }

            const { count: totalCount, error: totalError } = await totalQuery;

            // Count completed chats today
            const today = new Date().toISOString().split('T')[0];
            let completedQuery = supabase
                .from('global_chat_sessions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('created_at', `${today}T00:00:00`)
                .lte('created_at', `${today}T23:59:59`);

            if (tenantId) {
                completedQuery = completedQuery.eq('tenant_id', tenantId);
            } else {
                completedQuery = completedQuery.is('tenant_id', null);
            }

            const { count: completedCount, error: completedError } = await completedQuery;

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

        const tenantId = profile?.tenant_id;

        // Show active, pending, escalated AND completed chats
        let query = supabase
            .from('global_chat_sessions')
            .select(`
                *,
                chat_notes(count)
            `)
            .in('status', ['active', 'pending', 'waiting', 'unassigned', 'escalated', 'completed', 'open'])
            .order('created_at', { ascending: false });

        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        } else {
            query = query.is('tenant_id', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading chats:', error);
            return;
        }

        // Map data to include notes_count
        const chatsWithNotes = (data || []).map(chat => ({
            ...chat,
            notes_count: chat.chat_notes?.[0]?.count || 0
        }));

        setChats(chatsWithNotes);
    };

    const loadMessages = async (sessionId: string) => {
        setMessagesLoading(true);
        const { data } = await supabase
            .from('global_chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        setMessages(data || []);
        setMessagesLoading(false);
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
        if (!chat.assigned_to && agentInfo) {
            await supabase
                .from('global_chat_sessions')
                .update({
                    assigned_to: agentInfo.id,
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
                content: newMessage,
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
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
                            <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">
                                {getGreeting()}, {agentInfo.profile?.name || 'Agent'}!
                            </h1>
                            <p className="text-xs text-slate-400">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/5">
                            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                            <span className="text-xs font-medium text-slate-300">{isOnline ? 'Active Now' : 'Appear Offline'}</span>
                            <button
                                onClick={() => setIsOnline(!isOnline)}
                                className="ml-2 text-[10px] uppercase tracking-wider font-bold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                {isOnline ? 'Stay' : 'Go Online'}
                            </button>
                        </div>
                        <div className="h-8 w-px bg-white/5" />
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full border border-white/10 p-0.5 bg-slate-800">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(agentInfo.profile?.name || 'Agent')}&background=3b82f6&color=fff`}
                                    className="w-full h-full rounded-full object-cover"
                                    alt="Agent"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 p-6 max-w-[1600px] mx-auto">
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Live Conversations', value: stats.activeChats, icon: MessageSquare, color: 'rgb(59, 130, 246)', bg: 'bg-blue-500/10' },
                        { label: 'Resolved Today', value: stats.completedChats, icon: CheckCircle, color: 'rgb(34, 197, 94)', bg: 'bg-green-500/10' },
                        { label: 'Response Health', value: formatTime(stats.avgResponseTime), icon: Activity, color: 'rgb(249, 115, 22)', bg: 'bg-orange-500/10' },
                        { label: 'CSAT Score', value: `${(stats.satisfactionRating * 100).toFixed(0)}%`, icon: Star, color: 'rgb(234, 179, 8)', bg: 'bg-yellow-500/10' }
                    ].map((stat, index) => (
                        <div key={index} className="group relative overflow-hidden bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className={`p-2.5 ${stat.bg} rounded-xl`}>
                                    <stat.icon style={{ color: stat.color }} className="w-5 h-5" />
                                </div>
                                <Activity className="w-4 h-4 text-white/5 group-hover:text-blue-500/20 transition-colors" />
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 w-0 bg-blue-500 transition-all duration-500 group-hover:w-full" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-12 gap-6 items-start">
                    {/* Inbox Sidebar */}
                    <div className="col-span-12 lg:col-span-4 xl:col-span-3">
                        <section className="bg-slate-900/50 border border-white/5 rounded-2xl h-[calc(100vh-320px)] flex flex-col overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                                <h2 className="font-bold text-white flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-blue-400" />
                                    Active Inbox
                                </h2>
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    {chats.length} Priority
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                                {chats.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
                                        <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mb-4">
                                            <MessageSquare className="w-8 h-8" />
                                        </div>
                                        <p className="text-sm font-medium">Clear Queue</p>
                                        <p className="text-xs mt-1">Ready for next visitor</p>
                                    </div>
                                ) : (
                                    chats.map((chat) => (
                                        <button
                                            key={chat.id}
                                            onClick={() => handleSelectChat(chat)}
                                            className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 group relative ${selectedChat?.id === chat.id
                                                ? 'bg-blue-600 shadow-lg shadow-blue-600/20'
                                                : 'hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${selectedChat?.id === chat.id ? 'bg-white/20' : 'bg-slate-800'
                                                        }`}>
                                                        {chat.visitor_name?.charAt(0).toUpperCase() || 'V'}
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${chat.status === 'active' ? 'bg-green-500' :
                                                        chat.status === 'completed' ? 'bg-slate-400' :
                                                            'bg-amber-500'
                                                        }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <p className={`text-sm font-bold truncate ${selectedChat?.id === chat.id ? 'text-white' : 'text-slate-200'}`}>
                                                                {chat.visitor_name || 'Anonymous Visitor'}
                                                            </p>
                                                            {chat.notes_count ? chat.notes_count > 0 && (
                                                                <FileText className={`w-3 h-3 flex-shrink-0 ${selectedChat?.id === chat.id ? 'text-blue-100' : 'text-purple-400'}`} />
                                                            ) : null}
                                                            {chat.status === 'completed' && (
                                                                <CheckCircle className={`w-3 h-3 flex-shrink-0 ${selectedChat?.id === chat.id ? 'text-blue-100' : 'text-green-500'}`} />
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] flex-shrink-0 ${selectedChat?.id === chat.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                                            {new Date(chat.last_message_at || chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs truncate ${selectedChat?.id === chat.id ? 'text-blue-100/80' : 'text-slate-400'}`}>
                                                        {chat.status === 'completed' ? 'Conversation Resolved' : (chat.visitor_email || 'No contact info')}
                                                    </p>
                                                </div>
                                                {chat.unread_count && chat.unread_count > 0 && (
                                                    <div className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                                                        {chat.unread_count}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Resolution styling overlay */}
                                            {chat.status === 'completed' && selectedChat?.id !== chat.id && (
                                                <div className="absolute inset-0 bg-slate-900/40 rounded-xl pointer-events-none" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Chat Display Area */}
                    <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                        <section className="bg-slate-900/50 border border-white/5 rounded-2xl h-[calc(100vh-320px)] flex flex-col overflow-hidden relative">
                            {selectedChat ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm z-20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400">
                                                {selectedChat.visitor_name?.charAt(0).toUpperCase() || 'V'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-white leading-none">{selectedChat.visitor_name || 'Anonymous'}</h3>
                                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-1.5 py-0.5 rounded">Live</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">{selectedChat.visitor_email || 'Inbound from Web Widget'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setShowNotes(!showNotes)}
                                                className={`p-2 rounded-xl transition-all ${showNotes ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                                title="Visitor Notes"
                                            >
                                                <FileText className="w-5 h-5" />
                                            </button>
                                            <div className="w-px h-6 bg-white/5 mx-1" />
                                            <button
                                                onClick={() => setShowEscalate(true)}
                                                className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                Escalate
                                            </button>
                                            <button
                                                onClick={handleResolveChat}
                                                className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Resolve
                                            </button>
                                        </div>
                                    </div>

                                    {/* Messages Scroll Area */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                                        {messagesLoading ? (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-30">
                                                <MessageSquare className="w-12 h-12 mb-4" />
                                                <p className="text-xl font-bold">No Messages Yet</p>
                                                <p className="max-w-xs text-sm mt-2">Introduce yourself to start assisting the visitor.</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, idx) => {
                                                const isAgent = msg.sender_type === 'agent';
                                                const isAI = msg.sender_type === 'ai';
                                                const isSystem = msg.sender_type === 'system';
                                                const isPreviousSame = idx > 0 && messages[idx - 1].sender_type === msg.sender_type;

                                                if (isSystem) {
                                                    return (
                                                        <div key={msg.id} className="flex justify-center my-4">
                                                            <div className="px-4 py-1.5 bg-slate-800/40 rounded-full border border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                                <Shield className="w-3 h-3" />
                                                                {msg.sender_type === 'ai' ? 'TalkChat Assistant' : msg.content}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={msg.id} className={`flex items-end gap-2 ${isAgent ? 'justify-end' : 'justify-start'} ${isPreviousSame ? '-mt-4' : ''}`}>
                                                        {!isAgent && !isPreviousSame && (
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 shadow-md ${isAI ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' : 'bg-slate-800'
                                                                }`}>
                                                                {isAI ? <Zap className="w-4 h-4" /> : (msg.sender_name?.charAt(0) || 'V')}
                                                            </div>
                                                        )}
                                                        <div className={`max-w-[75%] lg:max-w-[60%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                                                            {!isPreviousSame && (
                                                                <span className="text-[10px] font-bold text-slate-500 mb-1 px-1 flex items-center gap-1">
                                                                    {isAgent ? 'Agent' : isAI ? 'TalkChat AI' : (msg.sender_name || 'Visitor')}
                                                                    {isAI && <span className="bg-purple-500/10 text-purple-400 px-1 rounded text-[8px]">BOT</span>}
                                                                </span>
                                                            )}
                                                            <div className={`relative px-4 py-3 rounded-2xl text-sm shadow-sm ${isAgent
                                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                                : isAI
                                                                    ? 'bg-slate-800 border border-purple-500/20 text-slate-100 rounded-tl-none'
                                                                    : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/5'
                                                                }`}>
                                                                <p className="leading-relaxed">{msg.content}</p>
                                                            </div>
                                                            <span className="text-[10px] text-slate-600 mt-1 px-1">
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Container */}
                                    <div className="p-4 bg-slate-900 border-t border-white/5 relative z-20">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Write your professional response..."
                                                className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim()}
                                                className="px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Send
                                                <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        </form>

                                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-medium tracking-wide">
                                            <div className="flex gap-4">
                                                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> RT Enabled</span>
                                                <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Secure E2E</span>
                                            </div>
                                            <p>Press Enter to send</p>
                                        </div>
                                    </div>

                                    {/* AI Intelligence Section (Trendsetter Feature) */}
                                    {selectedChat?.ai_summary && (
                                        <div className="mb-6 p-5 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-2 border-blue-500/30 rounded-2xl shadow-xl">
                                            <h4 className="text-[11px] font-black text-blue-300 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4" />
                                                    AI Analyst Report
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                                            </h4>

                                            {selectedChat.resolution_category && (
                                                <div className="mb-4">
                                                    <span className="text-[10px] px-3 py-1 bg-blue-500 text-white rounded-md font-bold uppercase tracking-widest shadow-lg">
                                                        {selectedChat.resolution_category}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="bg-slate-900/60 p-4 rounded-xl border border-blue-500/20 mb-5">
                                                <p className="text-xs text-blue-100 leading-relaxed font-semibold">
                                                    {selectedChat.ai_summary}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blue-500/20">
                                                <div className="bg-slate-900/40 p-2 rounded-lg">
                                                    <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Sentiment</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedChat.ai_sentiment === 'Positive' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                            selectedChat.ai_sentiment === 'Negative' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                        }`}>
                                                        {selectedChat.ai_sentiment}
                                                    </span>
                                                </div>
                                                {selectedChat.extracted_lead_info?.email && (
                                                    <div className="bg-slate-900/40 p-2 rounded-lg">
                                                        <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Email Captured</span>
                                                        <span className="text-[10px] text-blue-300 font-bold truncate block" title={selectedChat.extracted_lead_info.email}>
                                                            {selectedChat.extracted_lead_info.email}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes Overlay */}
                                    <AnimatePresence>
                                        {showNotes && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="absolute right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md border-l border-white/5 z-40 p-5 shadow-2xl flex flex-col"
                                            >
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="font-bold text-white flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-purple-400" />
                                                        Internal Notes
                                                    </h3>
                                                    <button onClick={() => setShowNotes(false)} className="p-1.5 hover:bg-white/5 rounded-lg">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <form onSubmit={handleAddNote} className="mb-6">
                                                    <textarea
                                                        value={newNote}
                                                        onChange={(e) => setNewNote(e.target.value)}
                                                        placeholder="What should other agents know?"
                                                        className="w-full h-24 bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none transition-all"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={!newNote.trim()}
                                                        className="w-full mt-2 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/20 disabled:opacity-50"
                                                    >
                                                        Save to Registry
                                                    </button>
                                                </form>

                                                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                                    {notes.length === 0 ? (
                                                        <div className="text-center py-10 opacity-30">
                                                            <p className="text-xs">No notes recorded yet</p>
                                                        </div>
                                                    ) : (
                                                        notes.map((note) => (
                                                            <div key={note.id} className="p-3 bg-white/5 border border-white/5 rounded-xl">
                                                                <p className="text-xs text-slate-300 leading-relaxed">{note.note}</p>
                                                                <div className="mt-2 text-[9px] text-slate-500 flex justify-between uppercase tracking-tighter">
                                                                    <span>Internal System</span>
                                                                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 overflow-hidden bg-slate-950/20">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                        <div className="relative w-24 h-24 rounded-3xl bg-slate-900 border-2 border-white/5 flex items-center justify-center shadow-2xl">
                                            <Zap className="w-12 h-12 text-blue-500" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Omnichannel Terminal</h2>
                                    <p className="text-slate-400 text-center max-w-sm mb-8">Select a conversation from the sidebar to begin interacting with visitors in real-time.</p>

                                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                        <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                <Activity className="w-4 h-4 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">System Health</p>
                                                <p className="text-sm font-bold text-white">99.9% Online</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Users className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Team Load</p>
                                                <p className="text-sm font-bold text-white">Balanced</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            {/* Escalate Modal */}
            <AnimatePresence>
                {showEscalate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowEscalate(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-slate-900 border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                <Zap className="w-8 h-8 text-orange-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white text-center mb-2">Escalate Session</h3>
                            <p className="text-slate-400 text-center text-sm mb-8">
                                This will transfer the current session to the supervisor queue and notify high-level administrators. Are you sure?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEscalate(false)}
                                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                                >
                                    Keep Local
                                </button>
                                <button
                                    onClick={handleEscalate}
                                    className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all"
                                >
                                    Confirm Transfer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};
