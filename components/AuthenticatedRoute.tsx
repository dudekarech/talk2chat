import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface AuthenticatedRouteProps {
    children: React.ReactNode;
}

/**
 * A lightweight route guard that only checks if the user is authenticated.
 * Unlike ProtectedRoute (which requires super_admin/admin role),
 * this allows ANY authenticated user (agent, manager, tenant_admin, etc.).
 */
export const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({ children }) => {
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setIsAuthenticated(!!user);
            } catch {
                setIsAuthenticated(false);
            } finally {
                setIsVerifying(false);
            }
        };
        checkAuth();
    }, []);

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
