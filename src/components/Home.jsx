import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import '../styles/Home.css';

const Home = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    // Listen for unread notifications count
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', user.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUnreadNotifications(snapshot.size);
        });

        return () => unsubscribe();
    }, [user]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            showToast('Please fill in both title and content', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'notes'), {
                userId: user.uid,
                authorName: user.displayName || 'Anonymous',
                title: title.trim(),
                content: content.trim(),
                isPublic: isPublic,
                createdAt: serverTimestamp()
            });

            setTitle('');
            setContent('');
            setIsPublic(false);
            showToast('Note saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving note:', error);
            showToast('Failed to save note.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="welcome-text">
                    <h1>{getGreeting()}, {user?.displayName?.split(' ')[0] || 'User'}</h1>
                    <p>What are you thinking about today?</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="notification-btn-premium" 
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notifications"
                    >
                        <Bell size={24} />
                        {unreadNotifications > 0 && (
                            <span className="notification-badge-premium">
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="dashboard-notification-panel">
                            <NotificationPanel onClose={() => setShowNotifications(false)} />
                        </div>
                    )}
                </div>
            </header>

            <div className="composer-card">
                <form onSubmit={handleSubmit} className="note-form">
                    <input
                        type="text"
                        placeholder="Title of your note..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="note-input-premium"
                        maxLength={100}
                    />
                    <textarea
                        placeholder="Start writing your thoughts here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="note-textarea-premium"
                        rows={12}
                    />

                    <div className="form-footer">
                        <label className="toggle-container">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                            />
                            <span className="toggle-label">Make this Public (Blog Post)</span>
                        </label>
                        <button
                            type="submit"
                            className="premium-submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : 'Save Note'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Home;
