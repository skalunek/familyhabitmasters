import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Auth context manages the current role (parent/child) and selected child profile.
 */
export function AuthProvider({ children }) {
    const [currentRole, setCurrentRole] = useState(null); // null | 'parent' | 'child'
    const [currentChildId, setCurrentChildId] = useState(null);

    const loginAsParent = useCallback(() => {
        setCurrentRole('parent');
        setCurrentChildId(null);
    }, []);

    const selectChild = useCallback((childId) => {
        setCurrentRole('child');
        setCurrentChildId(childId);
    }, []);

    const logout = useCallback(() => {
        setCurrentRole(null);
        setCurrentChildId(null);
    }, []);

    const value = {
        currentRole,
        currentChildId,
        loginAsParent,
        selectChild,
        logout,
        isParent: currentRole === 'parent',
        isChild: currentRole === 'child',
        isLoggedIn: currentRole !== null,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
