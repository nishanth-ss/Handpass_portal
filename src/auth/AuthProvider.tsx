import { createContext, useContext, useState, type ReactNode } from "react";

interface IAuthContext {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

interface IAuthProvider {
    children: ReactNode
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: IAuthProvider) => {
    const [token, setToken] = useState(
        () => localStorage.getItem('token')
    );

    const login = (token: string) => {
        localStorage.setItem("token", token);
        setToken(token);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = (): IAuthContext => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
};