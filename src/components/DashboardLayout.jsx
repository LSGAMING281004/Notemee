import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';
import { Bell } from 'lucide-react';
import '../styles/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    const { user } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Listen for unread notifications count
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', user.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content-wrapper">
                <header className="dashboard-top-header">
                    <div className="header-right">
                        <div className="notification-wrapper">
                            <button
                                className="icon-btn-header"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={24} />
                                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                            </button>
                            {showNotifications && (
                                <NotificationPanel onClose={() => setShowNotifications(false)} />
                            )}
                        </div>
                    </div>
                </header>
                <main className="dashboard-main">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
