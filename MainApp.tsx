import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SharedInbox } from './components/SharedInbox';
import { Settings } from './components/Settings';
import { TeamManagement } from './components/TeamManagement';
import { WidgetConfig, ChatSession, Message, SenderType } from './types';
import { INITIAL_CONFIG, MOCK_CHATS, CURRENT_USER } from './constants';
import { simulateVisitorReply } from './services/geminiService';

export const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useState<WidgetConfig>(INITIAL_CONFIG);
  const [chats, setChats] = useState<ChatSession[]>(MOCK_CHATS);

  // Mock dashboard stats based on chat data
  const stats = {
    activeChats: chats.filter(c => c.status === 'OPEN').length,
    totalVisitors: 12450,
    avgResponseTime: '1m 42s',
    sentimentScore: 4.8
  };

  const handleSendMessage = (chatId: string, content: string) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      content,
      senderType: SenderType.AGENT,
      senderName: CURRENT_USER.name,
      timestamp: Date.now(),
    };

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastActivity: Date.now(),
        };
      }
      return chat;
    }));

    // Trigger AI Simulator for visitor reply if needed
    // This part wraps the service call to update state
    setTimeout(async () => {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      // Note: passing the new message manually because state might be stale in this closure
      const updatedHistory = [...chat.messages, newMessage];
      const replyText = await simulateVisitorReply(updatedHistory);

      const visitorMsg: Message = {
        id: `msg_v_${Date.now()}`,
        content: replyText,
        senderType: SenderType.VISITOR,
        senderName: chat.visitorName,
        timestamp: Date.now()
      };

      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: [...c.messages, visitorMsg],
            lastActivity: Date.now(),
            unreadCount: c.unreadCount + 1
          };
        }
        return c;
      }));
    }, 2500); // 2.5s delay for realism
  };

  const handleUpdateChatStatus = (chatId: string, status: 'OPEN' | 'CLOSED' | 'SNOOZED') => {
    setChats(prevChats => prevChats.map(chat =>
      chat.id === chatId ? { ...chat, status } : chat
    ));
  };

  const handleAddTag = (chatId: string, tag: string) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId && !chat.tags.includes(tag)) {
        return { ...chat, tags: [...chat.tags, tag] };
      }
      return chat;
    }));
  };

  const handleRemoveTag = (chatId: string, tagToRemove: string) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, tags: chat.tags.filter(tag => tag !== tagToRemove) };
      }
      return chat;
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} />;
      case 'inbox':
        return (
          <SharedInbox
            chats={chats}
            currentUser={CURRENT_USER}
            onSendMessage={handleSendMessage}
            onUpdateChatStatus={handleUpdateChatStatus}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            aiContext={config.knowledgeBase.textContext}
            aiConfidence={config.aiConfidence}
          />
        );
      case 'settings':
        return <Settings config={config} onSave={setConfig} />;
      case 'team':
        return <TeamManagement />;
      default:
        return <Dashboard stats={stats} />;
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-hidden h-full relative">
        {renderContent()}
      </main>
    </div>
  );
};