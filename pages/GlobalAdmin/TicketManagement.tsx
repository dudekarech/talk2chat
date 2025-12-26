import React, { useState, useEffect } from 'react';
import { LifeBuoy, MessageSquare, CheckCircle2, Clock, AlertCircle, Search, Filter, Loader2, Building, User } from 'lucide-react';
import { notificationService, SupportTicket } from '../../services/notificationService';
import { supabase } from '../../services/supabaseClient';

export interface TicketManagementProps {
    isGlobal?: boolean;
}

export const TicketManagement: React.FC<TicketManagementProps> = ({ isGlobal = true }) => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadTickets();
    }, [isGlobal]);

    const loadTickets = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await notificationService.getAllTickets(isGlobal);
            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', ticketId);

            if (error) throw error;
            loadTickets();
        } catch (error: any) {
            alert('Failed to update status');
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tenants?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || t.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        {isGlobal ? 'Global Support Tickets' : 'Company Help Requests'}
                    </h2>
                    <p className="text-slate-400">
                        {isGlobal
                            ? 'Manage inquiries from all platform tenants'
                            : 'Manage and resolve support requests from your team'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search tickets or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                {isLoading ? (
                    <div className="p-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500 mb-4" />
                        <p className="text-slate-500 font-medium">Loading platform tickets...</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-20 text-center">
                        <LifeBuoy className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium">No tickets found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900 border-b border-slate-700">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Company & User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Inquiry Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredTickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-slate-700/20 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                    <Building className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{ticket.tenants?.name}</p>
                                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <User className="w-2.5 h-2.5" /> Request by Admin
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-md">
                                                <p className="text-sm font-medium text-white">{ticket.subject}</p>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ticket.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-500' :
                                                ticket.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                                                    'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                                                className={`text-[10px] font-bold uppercase py-1 px-2 rounded-lg border focus:outline-none transition-all ${ticket.status === 'open' ? 'bg-blue-600 border-blue-600 text-white' :
                                                    ticket.status === 'in_progress' ? 'bg-yellow-600 border-yellow-600 text-white' :
                                                        'bg-slate-700 border-slate-600 text-slate-400'
                                                    }`}
                                            >
                                                <option value="open">Open</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
