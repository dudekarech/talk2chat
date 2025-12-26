import React, { useState, useEffect } from 'react';
import { LifeBuoy, Plus, Clock, CheckCircle2, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { notificationService, SupportTicket } from '../../services/notificationService';
import { TicketManagement } from '../GlobalAdmin/TicketManagement';
import { supabase } from '../../services/supabaseClient';

export const SupportTickets: React.FC = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);

    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'medium' as any
    });

    const [activeTab, setActiveTab] = useState<'my' | 'manage'>('my');
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
        checkRole();
    }, []);

    const checkRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();
            setUserRole(data?.role || 'user');
        }
    };

    const loadTickets = async () => {
        setIsLoading(true);
        try {
            const { data } = await notificationService.getMyTickets();
            setTickets(data || []);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await notificationService.createTicket(formData);
            if (error) throw error;

            setShowNewModal(false);
            setFormData({ subject: '', description: '', priority: 'medium' });
            loadTickets();
        } catch (error: any) {
            alert(error.message || 'Failed to create ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'in_progress': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'resolved': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Support & Ticketing</h2>
                    <p className="text-slate-400">Manage your inquiries and platform support requests</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Support Ticket
                </button>
            </div>

            {/* Tabs for Admins/Managers/Agents */}
            {['admin', 'manager', 'agent', 'super_admin'].includes(userRole || '') && (
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'my' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        My Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('manage')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'manage' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                    >
                        Manage Company Tickets
                    </button>
                </div>
            )}

            {activeTab === 'manage' ? (
                <TicketManagement isGlobal={false} />
            ) : (
                <>
                    {/* Tickets List */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-900/50 border-b border-slate-700">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                                                Loading tickets...
                                            </td>
                                        </tr>
                                    ) : tickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                <LifeBuoy className="w-8 h-8 mx-auto mb-4 opacity-20" />
                                                No support tickets yet.
                                            </td>
                                        </tr>
                                    ) : tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <p className="font-medium text-white line-clamp-1">{ticket.subject}</p>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ticket.description}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusStyle(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs ${ticket.priority === 'urgent' ? 'text-red-400' :
                                                    ticket.priority === 'high' ? 'text-orange-400' :
                                                        ticket.priority === 'medium' ? 'text-blue-400' :
                                                            'text-slate-400'
                                                    }`}>
                                                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-xs text-nowrap">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-white transition-colors">
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* New Ticket Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Open Support Ticket</h3>
                            <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief summary of the issue"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={5}
                                    placeholder="Provide as much detail as possible..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: p as any })}
                                            className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${formData.priority === p
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Create Ticket
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
