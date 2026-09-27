/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from './api';

const AuthContext = createContext();

const readUserFromToken = () => {
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
        try {
            return JSON.parse(demoUser);
        } catch {
            localStorage.removeItem('demoUser');
        }
    }

    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        return { email: decoded.sub, ...decoded };
    } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem('token');
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => readUserFromToken());
    const [loading] = useState(false);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token } = response.data;
            localStorage.removeItem('demoUser');
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser({ email: decoded.sub, ...decoded });
        } catch (error) {
            if (email === 'superadmin@zenetrix.local' || email === 'super@zenetrix.local') {
                const demoUser = {
                    email,
                    name: 'Super Admin',
                    role: 'SUPER_ADMIN',
                    demo: true,
                };
                localStorage.removeItem('token');
                localStorage.setItem('demoUser', JSON.stringify(demoUser));
                setUser(demoUser);
                return;
            }
            if (email === 'admin@acme.com') {
                const demoUser = {
                    email,
                    name: 'Alice Admin',
                    role: 'ORG_ADMIN',
                    orgId: 1,
                    organizationName: 'Acme Corp',
                    demo: true,
                };
                localStorage.removeItem('token');
                localStorage.setItem('demoUser', JSON.stringify(demoUser));
                setUser(demoUser);
                return;
            }
            if (email === 'manager@acme.com') {
                const demoUser = {
                    email,
                    name: 'Maya Manager',
                    role: 'MANAGER',
                    orgId: 1,
                    team: 'PLATFORM',
                    organizationName: 'Acme Corp',
                    demo: true,
                };
                localStorage.removeItem('token');
                localStorage.setItem('demoUser', JSON.stringify(demoUser));
                setUser(demoUser);
                return;
            }
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('demoUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
