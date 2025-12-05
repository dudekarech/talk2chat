import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('global_admin_token') === 'valid';

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/global/admin');
        }
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) {
        return <Navigate to="/global/admin" replace />;
    }

    return <>{children}</>;
};
