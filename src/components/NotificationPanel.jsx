import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, limit, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { Bell, User, Heart, MessageSquare, X } from 'lucide-react';
import '../styles/NotificationPanel.css';

const NotificationPanel = ({ onClose }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = [];
            snapshot.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() });
            });
            setNotifications(notifs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const markAsRead = async (notificationId) => {
        try {
            const notifRef = doc(db, 'notifications', notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.forEach((notif) => {
                if (!notif.read) {
                    const notifRef = doc(db, 'notifications', notif.id);
                    batch.update(notifRef, { read: true });
                }
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'follow': return <User size={16} className="notif-icon follow" />;
            case 'like': return <Heart size={16} className="notif-icon like" />;
            case 'comment': return <MessageSquare size={16} className="notif-icon comment" />;
            default: return <Bell size={16} className="notif-icon default" />;
        }
    };

    return (
        <div className="notification-panel" ref={panelRef}>
            <div className="panel-header">
                <h3>Notifications</h3>
                <div className="header-actions">
                    <button onClick={markAllAsRead} className="mark-read-btn">Mark all read</button>
                    <button onClick={onClose} className="close-btn"><X size={18} /></button>
                </div>
            </div>

            <div className="panel-content">
                {loading ? (
                    <div className="panel-loading">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="panel-empty">
                        <Bell size={32} />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                onClick={() => markAsRead(notif.id)}
                            >
                                <div className="notif-avatar">
                                    <img src={notif.senderPhoto || "https://via.placeholder.com/40"} alt="User" />
                                    {getIcon(notif.type)}
                                </div>
                                <div className="notif-details">
                                    <p>
                                        <span className="sender-name">{notif.senderName}</span>
                                        {' '}
                                        {notif.message}
                                    </p>
                                    <span className="notif-time">
                                        {notif.createdAt?.toDate().toLocaleDateString()}
                                    </span>
                                </div>
                                {!notif.read && <div className="unread-dot"></div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
