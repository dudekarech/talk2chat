import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Sparkles, 
  Check, 
  MoreVertical, 
  Paperclip,
  Clock,
  User as UserIcon,
  Tag,
  MessageCircle,
  Plus,
  X,
  Facebook,
  Instagram,
  Smartphone,
  Globe
} from 'lucide-react';
import { ChatSession, Message, SenderType, User, ChannelType } from '../types';
import { generateAgentSuggestion } from '../services/geminiService';

interface SharedInboxProps {
  chats: ChatSession[];
  currentUser: User;
  onSendMessage: (chatId: string, content: string) => void;
  onUpdateChatStatus: (chatId: string, status: 'OPEN' | 'CLOSED' | 'SNOOZED') => void;
  onAddTag: (chatId: string, tag: string) => void;
  onRemoveTag: (chatId: string, tag: string) => void;
  aiContext: string;
  aiConfidence: number;
}

export const SharedInbox: React.FC<SharedInboxProps> = ({ 
  chats, 
  currentUser, 
  onSendMessage,
  onUpdateChatStatus,
  onAddTag,
  onRemoveTag,
  aiContext,
  aiConfidence
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chats[0]?.id || null);
  const [inputText, setInputText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [sortOption, setSortOption] = useState<'recent' | 'unread' | 'tags'>('recent');
  const [filterChannel, setFilterChannel] = useState<ChannelType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tag management state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAiSuggestion(null);
    setIsAddingTag(false);
    setNewTag('');
  }, [selectedChatId]);

  // Filter chats based on search query and channel
  const filteredChats = chats.filter(chat => {
    const matchesSearch = 
      chat.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesChannel = filterChannel === 'ALL' || chat.channel === filterChannel;

    return matchesSearch && matchesChannel;
  });

  // Sort chats based on selected option
  const sortedChats = [...filteredChats].sort((a, b) => {
    if (sortOption === 'unread') {
      // Primary: Unread count desc
      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
      // Secondary: Recency
      return b.lastActivity - a.lastActivity;
    }
    if (sortOption === 'tags') {
       // Primary: Has tags vs no tags
       const tagsA = a.tags[0] || '';
       const tagsB = b.tags[0] || '';
       
       if (tagsA && !tagsB) return -1;
       if (!tagsA && tagsB) return 1;
       
       // Secondary: Alphabetical tag
       if (tagsA !== tagsB) return tagsA.localeCompare(tagsB);
       
       // Tertiary: Recency
       return b.lastActivity - a.lastActivity;
    }
    // Default 'recent': Recency desc
    return b.lastActivity - a.lastActivity;
  });

  const activeChat = chats.find(c => c.id === selectedChatId);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedChatId) return;
    onSendMessage(selectedChatId, inputText);
    setInputText('');
    setAiSuggestion(null);
  };

  const requestAiSuggestion = async () => {
    if (!activeChat) return;
    setIsAiThinking(true);
    const suggestion = await generateAgentSuggestion(
        activeChat.messages, 
        activeChat.visitorName, 
        aiContext || "We are a generic company. Be helpful and polite.",
        aiConfidence
    );
    setAiSuggestion(suggestion);
    setIsAiThinking(false);
  };

  const applySuggestion = () => {
    if (aiSuggestion) {
      setInputText(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleAddTagSubmit = () => {
    if (newTag.trim() && activeChat) {
        onAddTag(activeChat.id, newTag.trim());
        setNewTag('');
    }
    setIsAddingTag(false);
  };

  const getChannelIcon = (channel: ChannelType, size: number = 14) => {
      switch(channel) {
          case 'WHATSAPP': return <Smartphone size={size} className="text-green-600" />;
          case 'INSTAGRAM': return <Instagram size={size} className="text-pink-600" />;
          case 'FACEBOOK': return <Facebook size={size} className="text-blue-600" />;
          default: return <Globe size={size} className="text-slate-400" />;
      }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Inbox</h2>
          
          {/* Channel Filters */}
          <div className="flex items-center space-x-1 mb-3 overflow-x-auto no-scrollbar pb-1">
              {[
                  { id: 'ALL', label: 'All', icon: null },
                  { id: 'WEB', label: 'Web', icon: Globe },
                  { id: 'WHATSAPP', label: 'WA', icon: Smartphone },
                  { id: 'INSTAGRAM', label: 'IG', icon: Instagram },
                  { id: 'FACEBOOK', label: 'FB', icon: Facebook },
              ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterChannel(f.id as any)}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        filterChannel === f.id 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                      {f.icon && <f.icon size={12} />}
                      <span>{f.label}</span>
                  </button>
              ))}
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Sorting Controls */}
          <div className="flex items-center space-x-2">
            <button
                onClick={() => setSortOption('recent')}
                className={`flex-1 text-xs py-1.5 rounded-md border flex items-center justify-center space-x-1 transition-colors ${sortOption === 'recent' ? 'bg-slate-100 text-slate-800 border-slate-200 font-semibold' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                title="Sort by Last Activity"
            >
                <Clock size={12} />
                <span>Recent</span>
            </button>
            <button
                onClick={() => setSortOption('unread')}
                className={`flex-1 text-xs py-1.5 rounded-md border flex items-center justify-center space-x-1 transition-colors ${sortOption === 'unread' ? 'bg-slate-100 text-slate-800 border-slate-200 font-semibold' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                title="Sort by Unread Messages"
            >
                <MessageCircle size={12} />
                <span>Unread</span>
            </button>
            <button
                onClick={() => setSortOption('tags')}
                className={`flex-1 text-xs py-1.5 rounded-md border flex items-center justify-center space-x-1 transition-colors ${sortOption === 'tags' ? 'bg-slate-100 text-slate-800 border-slate-200 font-semibold' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                title="Sort by Tags"
            >
                <Tag size={12} />
                <span>Tags</span>
            </button>
          </div>
        </div>
        
        {/* Chat List Items */}
        <div className="flex-1 overflow-y-auto">
          {sortedChats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
                No chats found
            </div>
          ) : (
            sortedChats.map(chat => (
                <div 
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedChatId === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                >
                <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center space-x-2">
                        {getChannelIcon(chat.channel)}
                        <span className={`font-semibold text-sm ${selectedChatId === chat.id ? 'text-blue-900' : 'text-slate-800'}`}>
                        {chat.visitorName}
                        </span>
                    </div>
                    <span className="text-xs text-slate-400">
                    {new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="flex justify-between items-end">
                    <p className={`text-xs truncate mb-2 max-w-[180px] ${chat.unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                        {chat.messages[chat.messages.length - 1]?.content}
                    </p>
                    {chat.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {chat.unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex space-x-2 mt-1">
                    {chat.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded-full flex items-center">
                            <Tag size={8} className="mr-1 opacity-50"/> {tag}
                        </span>
                    ))}
                </div>
                </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col h-full">
          {/* Chat Header */}
          <div className="min-h-16 py-3 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
             <div className="flex items-start space-x-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 relative">
                     {activeChat.visitorName.charAt(0)}
                     <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                         {getChannelIcon(activeChat.channel, 14)}
                     </div>
                 </div>
                 <div className="flex flex-col">
                     <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                         {activeChat.visitorName}
                     </h3>
                     <p className="text-xs text-slate-500 flex items-center mb-1">
                         <span className={`w-2 h-2 rounded-full mr-1 ${activeChat.channel === 'WEB' ? 'bg-green-500' : 'bg-slate-400'}`}></span> 
                         via {activeChat.channel}
                     </p>
                     
                     {/* Tags Section */}
                     <div className="flex flex-wrap gap-2 mt-1">
                        {activeChat.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full flex items-center group border border-slate-200">
                                <Tag size={10} className="mr-1 opacity-50"/>
                                {tag}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveTag(activeChat.id, tag);
                                    }}
                                    className="ml-1.5 text-slate-400 hover:text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                    title="Remove tag"
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                        
                        {/* Add Tag Input/Button */}
                        {isAddingTag ? (
                            <div className="flex items-center">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTagSubmit();
                                        } else if (e.key === 'Escape') {
                                            setIsAddingTag(false);
                                            setNewTag('');
                                        }
                                    }}
                                    onBlur={handleAddTagSubmit}
                                    placeholder="New tag..."
                                    className="text-[10px] border border-blue-400 rounded-full px-2 py-0.5 outline-none w-20 bg-white"
                                />
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsAddingTag(true)}
                                className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-slate-300 hover:border-blue-200 rounded-full flex items-center transition-all"
                            >
                                <Plus size={10} className="mr-1" /> Add
                            </button>
                        )}
                    </div>
                 </div>
             </div>
             <div className="flex items-center space-x-2 self-start mt-1">
                 <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Snooze conversation">
                     <Clock size={20} />
                 </button>
                 <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Contact Details">
                     <UserIcon size={20} />
                 </button>
                 <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                     <MoreVertical size={20} />
                 </button>
             </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {activeChat.messages.map((msg) => {
              const isAgent = msg.senderType === SenderType.AGENT || msg.senderType === SenderType.BOT;
              return (
                <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[70%] ${isAgent ? 'order-1' : 'order-2'}`}>
                      <div className={`p-4 rounded-2xl shadow-sm text-sm ${
                          isAgent 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}>
                          {msg.content}
                      </div>
                      <div className={`text-[10px] text-slate-400 mt-1 ${isAgent ? 'text-right' : 'text-left'}`}>
                          {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                   </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* AI Suggestion Area */}
          {aiSuggestion && (
            <div className="px-6 py-2">
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex flex-col animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center space-x-2 text-purple-700 font-medium text-xs mb-1">
                        <Sparkles size={12} />
                        <span>AI Suggestion</span>
                    </div>
                    <p className="text-sm text-purple-900 mb-2">{aiSuggestion}</p>
                    <div className="flex space-x-2">
                        <button 
                           onClick={applySuggestion}
                           className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                        >
                            <Check size={12} /> <span>Apply</span>
                        </button>
                        <button 
                           onClick={() => setAiSuggestion(null)}
                           className="px-3 py-1 text-purple-600 text-xs hover:underline"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 bg-white">
             <div className="flex items-end space-x-3">
                 <button className="p-3 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                     <Paperclip size={20} />
                 </button>
                 <div className="flex-1 relative">
                     <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={`Reply via ${activeChat.channel.charAt(0) + activeChat.channel.slice(1).toLowerCase()}...`}
                        className="w-full resize-none bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 text-sm"
                        rows={1}
                     />
                     <div className="absolute right-2 bottom-2">
                         <button 
                            onClick={requestAiSuggestion}
                            disabled={isAiThinking}
                            className={`p-1.5 rounded-lg transition-all ${isAiThinking ? 'animate-pulse text-purple-400' : 'text-purple-600 hover:bg-purple-50'}`}
                            title="Generate AI Reply"
                         >
                             <Sparkles size={18} />
                         </button>
                     </div>
                 </div>
                 <button 
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
                        inputText.trim() 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                 >
                     <Send size={20} />
                 </button>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageCircle size={48} className="mb-4 text-slate-300" />
            <p>Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
};