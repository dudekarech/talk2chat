import React, { useState } from 'react';
import {
    Users, MessageSquare, Shield, Plus, Search, MoreVertical,
    Mail, Phone, CheckCircle, XCircle, Clock, AlertCircle,
    Send, Paperclip, Smile, UserPlus, Trash2, Edit2, Lock
} from 'lucide-react';
import { User, Role } from '../types';

interface TeamMember extends User {
    status: 'online' | 'offline' | 'busy';
    lastActive: string;
    assignedChats: number;
    department: string;
}

interface TeamMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: number;
    tags: string[]; // User IDs tagged
    isPrivate: boolean;
}

const MOCK_TEAM: TeamMember[] = [
    {
        id: 'u1',
        name: 'Sarah Wilson',
        email: 'sarah@talkchat.com',
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        status: 'online',
        lastActive: 'Now',
        assignedChats: 12,
        department: 'Management'
    },
    {
        id: 'u2',
        name: 'Mike Johnson',
        email: 'mike@talkchat.com',
        role: 'AGENT',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
        status: 'busy',
        lastActive: '5m ago',
        assignedChats: 5,
        department: 'Support'
    },
    {
        id: 'u3',
        name: 'Emily Davis',
        email: 'emily@talkchat.com',
        role: 'AGENT',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        status: 'offline',
        lastActive: '2h ago',
        assignedChats: 0,
        department: 'Sales'
    }
];

const MOCK_MESSAGES: TeamMessage[] = [
    {
        id: 'm1',
        senderId: 'u1',
        senderName: 'Sarah Wilson',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        content: 'Hey team, please prioritize the tickets from "Enterprise" clients today.',
        timestamp: Date.now() - 3600000,
        tags: [],
        isPrivate: false
    },
    {
        id: 'm2',
        senderId: 'u2',
        senderName: 'Mike Johnson',
        senderAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
        content: '@Sarah Wilson I handled the issue with Client X, they are happy now.',
        timestamp: Date.now() - 1800000,
        tags: ['u1'],
        isPrivate: false
    }
];

export const TeamManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'members' | 'board' | 'permissions'>('members');
    const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM);
    const [messages, setMessages] = useState<TeamMessage[]>(MOCK_MESSAGES);
    const [newMessage, setNewMessage] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const msg: TeamMessage = {
            id: `tm_${Date.now()}`,
            senderId: 'currentUser', // Mock current user
            senderName: 'You',
            content: newMessage,
            timestamp: Date.now(),
            tags: [],
            isPrivate: false
        };

        setMessages([...messages, msg]);
        setNewMessage('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'busy': return 'bg-red-500';
            case 'offline': return 'bg-slate-400';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Team Management</h1>
                        <p className="text-slate-500 mt-1">Manage your team, assign roles, and collaborate.</p>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-colors"
                    >
                        <UserPlus size={18} />
                        <span>Invite Member</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'members'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Users size={18} />
                        <span>Team Members</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('board')}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'board'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <MessageSquare size={18} />
                        <span>Message Board</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'permissions'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Shield size={18} />
                        <span>Roles & Permissions</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-8">
                {activeTab === 'members' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Filters */}
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none">
                                    <option>All Roles</option>
                                    <option>Admin</option>
                                    <option>Agent</option>
                                </select>
                                <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none">
                                    <option>All Departments</option>
                                    <option>Support</option>
                                    <option>Sales</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Member</th>
                                        <th className="px-6 py-4 text-left">Role</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                        <th className="px-6 py-4 text-left">Assigned Chats</th>
                                        <th className="px-6 py-4 text-left">Last Active</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {members.map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative">
                                                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                                        <p className="text-xs text-slate-500">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 capitalize">{member.status}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600">{member.assignedChats}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500">{member.lastActive}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-slate-600 p-1">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'board' && (
                    <div className="flex h-full gap-6">
                        {/* Message List */}
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-800">Team Updates</h3>
                                <div className="flex space-x-2 text-xs">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">@Mentions</span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">#Announcements</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex space-x-4">
                                        <img src={msg.senderAvatar || 'https://via.placeholder.com/40'} alt={msg.senderName} className="w-10 h-10 rounded-full object-cover" />
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-semibold text-slate-900">{msg.senderName}</span>
                                                <span className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none text-slate-700 text-sm border border-slate-100">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-200 bg-white">
                                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
                                        <Paperclip size={18} />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message to your team... Use @ to tag"
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 placeholder-slate-400"
                                    />
                                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
                                        <Smile size={18} />
                                    </button>
                                    <button
                                        onClick={handleSendMessage}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="w-80 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="font-semibold text-slate-800 mb-4">Online Members</h3>
                                <div className="space-y-3">
                                    {members.filter(m => m.status === 'online').map(m => (
                                        <div key={m.id} className="flex items-center space-x-3">
                                            <div className="relative">
                                                <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                            </div>
                                            <span className="text-sm text-slate-700">{m.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                                <h3 className="font-semibold text-blue-900 mb-2">Quick Tips</h3>
                                <ul className="text-sm text-blue-800 space-y-2 list-disc pl-4">
                                    <li>Use <strong>@name</strong> to notify a specific team member.</li>
                                    <li>Mark urgent messages with <strong>#urgent</strong>.</li>
                                    <li>Check the "Permissions" tab to manage access rights.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'permissions' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-slate-800 mb-2">Role Permissions</h2>
                                <p className="text-slate-500 text-sm">Control what each role can access and manage within the dashboard.</p>
                            </div>

                            <div className="space-y-8">
                                {/* Permission Group */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Chat Management</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 border border-slate-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-800">View All Chats</span>
                                                <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                                            </div>
                                            <p className="text-xs text-slate-500">Can view chats assigned to other agents.</p>
                                        </div>
                                        <div className="p-4 border border-slate-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-800">Reassign Chats</span>
                                                <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                                            </div>
                                            <p className="text-xs text-slate-500">Can transfer chats to other team members.</p>
                                        </div>
                                        <div className="p-4 border border-slate-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-800">Delete History</span>
                                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                            </div>
                                            <p className="text-xs text-slate-500">Can permanently delete chat logs.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Permission Group */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Settings & Configuration</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 border border-slate-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-800">Manage Team</span>
                                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                            </div>
                                            <p className="text-xs text-slate-500">Can invite and remove team members.</p>
                                        </div>
                                        <div className="p-4 border border-slate-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-800">Widget Settings</span>
                                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                            </div>
                                            <p className="text-xs text-slate-500">Can modify widget appearance and behavior.</p>
                                        </div>
                                        <div className="p-4 border border-slate-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-800">Billing Access</span>
                                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                            </div>
                                            <p className="text-xs text-slate-500">Can view invoices and manage subscription.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Invite Team Member</h2>
                            <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input type="email" placeholder="colleague@company.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="AGENT">Agent</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Agents can chat with visitors. Admins have full access.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="Support">Support</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Technical">Technical</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex space-x-3">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Mock invite logic
                                    setShowInviteModal(false);
                                    alert('Invitation sent successfully!');
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Send Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
