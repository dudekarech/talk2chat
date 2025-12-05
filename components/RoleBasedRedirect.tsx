import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Loader } from 'lucide-react';

export const RoleBasedRedirect: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkUserRoleAndRedirect();
    }, []);

    const checkUserRoleAndRedirect = async () => {
        try {
            // Get current user
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error('Auth error:', authError);
                navigate('/login');
                return;
            }

            console.log('User authenticated:', user.email);

            // Get user profile with role
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role, status, email')
                .eq('user_id', user.id)
                .single();

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                // If profile doesn't exist, create one with default role
                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: user.id,
                        email: user.email,
                        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                        role: 'agent', // Default role
                        status: 'active'
                    });

                if (insertError) {
                    console.error('Failed to create profile:', insertError);
                    setError('Failed to load user profile. Please contact support.');
                    return;
                }

                // After creating profile, redirect to agent dashboard
                navigate('/agent/dashboard');
                return;
            }

            // Check if user is pending
            if (profile.status === 'pending') {
                setError('Your account is pending approval. Please wait for an administrator to approve your account.');
                setTimeout(() => {
                    supabase.auth.signOut();
                    navigate('/login');
                }, 3000);
                return;
            }

            console.log('User profile:', profile);

            // Redirect based on role
            if (profile && profile.role) {
                switch (profile.role.toLowerCase()) {
                    case 'super_admin':
                    case 'admin':
                        console.log('Redirecting to global admin dashboard');
                        navigate('/global/dashboard');
                        break;
                    case 'manager':
                    case 'agent':
                        console.log('Redirecting to agent dashboard');
                        navigate('/agent/dashboard');
                        break;
                    default:
                        console.log('Unknown role, redirecting to agent dashboard');
                        navigate('/agent/dashboard');
                }
            } else {
                // No role found, default to agent dashboard
                console.log('No role found, redirecting to agent dashboard');
                navigate('/agent/dashboard');
            }
        } catch (error: any) {
            console.error('Error checking role:', error);
            setError('An error occurred while loading your dashboard.');
            setTimeout(() => navigate('/login'), 2000);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center max-w-md p-6 bg-slate-800 rounded-lg">
                    <p className="text-red-400 text-lg mb-4">{error}</p>
                    <p className="text-slate-400 text-sm">Redirecting...</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading your dashboard...</p>
                    <p className="text-slate-400 text-sm mt-2">Checking your role...</p>
                </div>
            </div>
        );
    }

    return null;
};
