import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './globalChatRealtimeService';

export interface PresenceUser {
    user_id: string;
    name: string;
    role: string;
    avatar_url?: string;
    online_at: string;
    current_page?: string;
    is_typing?: boolean;
    typing_to?: string;
}

export interface PresenceState {
    [key: string]: PresenceUser[];
}

class PresenceService {
    private channel: RealtimeChannel | null = null;
    private state: PresenceState = {};

    /**
     * Join the global presence channel
     */
    async joinPresence(
        userId: string,
        userData: Partial<PresenceUser>,
        onSync: (state: PresenceState) => void
    ) {
        if (this.channel) {
            await this.leavePresence();
        }

        this.channel = supabase.channel('online_presence', {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                this.state = this.channel!.presenceState() as unknown as PresenceState;
                onSync(this.state);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('[Presence] Join:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('[Presence] Leave:', key, leftPresences);
            });

        await this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                const presenceTrack = {
                    user_id: userId,
                    online_at: new Date().toISOString(),
                    ...userData
                };
                await this.channel!.track(presenceTrack);
            }
        });

        return this.channel;
    }

    /**
     * Update current user's presence data (e.g., typing status, current page)
     */
    async updatePresence(data: Partial<PresenceUser>) {
        if (this.channel) {
            await this.channel.track({
                online_at: new Date().toISOString(),
                ...data
            });
        }
    }

    /**
     * Leave the presence channel
     */
    async leavePresence() {
        if (this.channel) {
            await this.channel.unsubscribe();
            this.channel = null;
        }
    }

    /**
     * Utility to check if a specific user is online
     */
    isUserOnline(userId: string): boolean {
        return !!this.state[userId];
    }

    /**
     * Get all online users with a specific role
     */
    getOnlineUsersByRole(role: string): PresenceUser[] {
        const onlineUsers: PresenceUser[] = [];
        Object.values(this.state).forEach(presences => {
            presences.forEach(p => {
                if (p.role === role) onlineUsers.push(p);
            });
        });
        return onlineUsers;
    }
}

export const presenceService = new PresenceService();
