import React, { createContext, useState, useEffect } from "react";
import { isAuthenticated, logout } from "./api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        setIsAuth(isAuthenticated());
    }, []);

    const handleLogin = () => setIsAuth(true);
    const handleLogout = () => {
        logout();
        setIsAuth(false);
    };

    return (
        <AuthContext.Provider value={{ isAuth, handleLogin, handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};
