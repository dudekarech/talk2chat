import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Loader } from 'lucide-react';

export const RoleBasedRedirect: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUserRoleAndRedirect();
    }, []);

    const checkUserRoleAndRedirect = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/login');
                return;
            }

            // Get user profile with role
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            // Redirect based on role
            if (profile) {
                switch (profile.role) {
                    case 'super_admin':
                    case 'admin':
                        navigate('/global/dashboard');
                        break;
                    case 'manager':
                    case 'agent':
                        navigate('/agent/dashboard');
                        break;
                    default:
                        navigate('/agent/dashboard');
                }
            } else {
                // No profile found, default to agent dashboard
                navigate('/agent/dashboard');
            }
        } catch (error) {
            console.error('Error checking role:', error);
            navigate('/login');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return null;
};
