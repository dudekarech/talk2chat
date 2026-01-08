import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsAuthorized(false);
                setIsVerifying(false);
                return;
            }

            // Verify if the user has a global admin/super_admin role AND NO tenant_id
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role, tenant_id')
                .eq('user_id', user.id)
                .single();

            if (profile && ['super_admin', 'admin'].includes(profile.role) && !profile.tenant_id) {
                setIsAuthorized(true);
                // Sync the legacy token for compatibility with other components if needed
                localStorage.setItem('global_admin_token', 'valid');
            } else {
                setIsAuthorized(false);
            }
        } catch (error) {
            console.error('Auth verification error:', error);
            setIsAuthorized(false);
        } finally {
            setIsVerifying(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthorized) {
        return <Navigate to="/global/admin" replace />;
    }

    return <>{children}</>;
};
