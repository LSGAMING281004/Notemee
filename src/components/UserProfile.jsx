import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { User, Mail, FileText, MessageSquare, UserPlus, UserCheck, ChevronLeft, Calendar, FileType } from 'lucide-react';
import '../styles/UserProfile.css';

const UserProfile = () => {
    const { uid } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState(null);
    const [userArticles, setUserArticles] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!uid) return;
            try {
                setLoading(true);
                // Fetch User Details
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProfileUser({ id: userDoc.id, ...userData });

                    if (user) {
                        setIsFollowing(userData.followers?.includes(user.uid) || false);
                    }
                }

                // Fetch Public Articles by this user
                const q = query(
                    collection(db, 'notes'),
                    where('userId', '==', uid),
                    where('isPublic', '==', true)
                );
                const querySnapshot = await getDocs(q);
                const articles = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort by date manually if needed
                articles.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                setUserArticles(articles);

            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [uid, user]);

    const handleFollowToggle = async () => {
        if (!user) return navigate('/login');
        if (uid === user.uid) return;

        setFollowLoading(true);
        try {
            const currentUserRef = doc(db, 'users', user.uid);
            const targetUserRef = doc(db, 'users', uid);

            if (isFollowing) {
                await updateDoc(currentUserRef, { following: arrayRemove(uid) });
                await updateDoc(targetUserRef, { followers: arrayRemove(user.uid) });
                setIsFollowing(false);
            } else {
                await updateDoc(currentUserRef, { following: arrayUnion(uid) });
                await updateDoc(targetUserRef, { followers: arrayUnion(user.uid) });

                // Notification
                await addDoc(collection(db, 'notifications'), {
                    recipientId: uid,
                    senderId: user.uid,
                    senderName: user.displayName,
                    type: 'follow',
                    message: `${user.displayName} started following you`,
                    createdAt: serverTimestamp(),
                    isRead: false
                });
                setIsFollowing(true);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleMessage = () => {
        if (!user) return navigate('/login');
        navigate(`/chat?uid=${uid}`);
    };

    if (loading) return <div className="user-profile-loading">Loading profile...</div>;
    if (!profileUser) return <div className="user-not-found">User not found.</div>;

    return (
        <div className="user-profile-page">
            <div className="user-profile-header-nav">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Back
                </button>
            </div>

            <div className="user-profile-content">
                <div className="user-info-card">
                    <div className="user-avatar-section">
                        <img
                            src={profileUser.photoURL || "https://via.placeholder.com/120"}
                            alt={profileUser.displayName}
                            className="profile-avatar-large"
                        />
                        <div className="user-main-info">
                            <h1>{profileUser.displayName}</h1>
                            <p className="user-email"><Mail size={16} /> {profileUser.email}</p>
                        </div>

                        <div className="user-stats-public">
                            <div className="stat-item">
                                <span className="stat-count">{profileUser.followers?.length || 0}</span>
                                <span className="stat-label">Followers</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-count">{profileUser.following?.length || 0}</span>
                                <span className="stat-label">Following</span>
                            </div>
                        </div>

                        <div className="user-profile-actions">
                            {user?.uid !== uid && (
                                <>
                                    <button
                                        className={`action-btn ${isFollowing ? 'following' : 'follow'}`}
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                    >
                                        {isFollowing ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
                                    </button>
                                    <button className="action-btn message" onClick={handleMessage}>
                                        <MessageSquare size={18} /> Message
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="user-bio-section">
                        <h3><FileText size={18} /> Bio</h3>
                        <p className="bio-text">{profileUser.bio || "No bio added yet."}</p>
                    </div>
                </div>

                <div className="user-articles-section">
                    <div className="section-header">
                        <h2><FileType size={20} /> Public Articles</h2>
                        <span className="article-count">{userArticles.length} articles</span>
                    </div>

                    <div className="user-articles-list">
                        {userArticles.length === 0 ? (
                            <div className="empty-articles">
                                <p>This user hasn't published any articles yet.</p>
                            </div>
                        ) : (
                            userArticles.map(article => (
                                <div key={article.id} className="user-article-card" onClick={() => navigate(`/blog/${article.id}`)}>
                                    <h3>{article.title}</h3>
                                    <p className="article-excerpt">{article.content.substring(0, 150)}...</p>
                                    <div className="article-meta-mini">
                                        <Calendar size={14} /> {article.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
