import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Search, Users, Activity } from 'lucide-react';
import UserCard from './UserCard';
import Loading from './Loading';
import '../styles/Community.css';

const Community = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [onlineCount, setOnlineCount] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [followingIds, setFollowingIds] = useState([]);
    const [error, setError] = useState('');

    // Fetch ALL users on mount so search is instant
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const usersRef = collection(db, 'users');
                const querySnapshot = await getDocs(usersRef);
                const users = [];
                querySnapshot.forEach((docSnap) => {
                    if (docSnap.id !== user?.uid) {
                        users.push({ id: docSnap.id, ...docSnap.data() });
                    }
                });
                setAllUsers(users);
                setOnlineCount(Math.floor(Math.random() * 50) + 100 + (user ? 1 : 0));
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Could not load users. Check Firestore rules allow reading the 'users' collection.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAllUsers();
        }
    }, [user]);

    // Fetch current user's following list
    useEffect(() => {
        const fetchFollowing = async () => {
            if (user?.uid) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setFollowingIds(userDoc.data().following || []);
                    }
                } catch (err) {
                    console.error("Error fetching following list:", err);
                }
            }
        };
        fetchFollowing();
    }, [user]);

    // Live search as user types — filter from already-fetched users
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const results = allUsers.filter((u) => {
            const nameMatch = u.displayName?.toLowerCase().includes(searchLower);
            const emailMatch = u.email?.toLowerCase().includes(searchLower);
            return nameMatch || emailMatch;
        });

        setSearchResults(results);
    }, [searchTerm, allUsers]);

    const handleFollow = async (targetUserId) => {
        if (!user) return;
        try {
            const currentUserRef = doc(db, 'users', user.uid);
            const targetUserRef = doc(db, 'users', targetUserId);

            await updateDoc(currentUserRef, {
                following: arrayUnion(targetUserId)
            });
            await updateDoc(targetUserRef, {
                followers: arrayUnion(user.uid)
            });

            setFollowingIds([...followingIds, targetUserId]);

            // Create notification for the target user
            await addDoc(collection(db, 'notifications'), {
                recipientId: targetUserId,
                senderId: user.uid,
                senderName: user.displayName || 'Someone',
                senderPhoto: user.photoURL || '',
                type: 'follow',
                message: 'started following you',
                read: false,
                createdAt: serverTimestamp(),
                link: '/community'
            });

        } catch (err) {
            console.error("Error following user:", err);
        }
    };

    const handleUnfollow = async (targetUserId) => {
        if (!user) return;
        try {
            const currentUserRef = doc(db, 'users', user.uid);
            const targetUserRef = doc(db, 'users', targetUserId);

            await updateDoc(currentUserRef, {
                following: arrayRemove(targetUserId)
            });
            await updateDoc(targetUserRef, {
                followers: arrayRemove(user.uid)
            });

            setFollowingIds(followingIds.filter(id => id !== targetUserId));
        } catch (err) {
            console.error("Error unfollowing user:", err);
        }
    };

    if (loading) return <Loading text="Loading community..." />;

    return (
        <div className="community-page">
            <header className="community-header">
                <div className="header-content">
                    <h1>Community</h1>
                    <div className="online-status">
                        <Activity size={18} color="#4CAF50" />
                        <span>{onlineCount} Users Online</span>
                    </div>
                </div>
                <p>Find friends, follow authors, and explore the community.</p>
            </header>

            {error && (
                <div className="search-error">
                    <p>⚠️ {error}</p>
                </div>
            )}

            <div className="search-section">
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="results-section">
                {searchTerm.trim() ? (
                    searchResults.length > 0 ? (
                        <div className="users-grid">
                            {searchResults.map((resultUser) => (
                                <UserCard
                                    key={resultUser.id}
                                    user={resultUser}
                                    isFollowing={followingIds.includes(resultUser.id)}
                                    onFollow={() => handleFollow(resultUser.id)}
                                    onUnfollow={() => handleUnfollow(resultUser.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="no-results">
                            <Users size={48} />
                            <p>No users found matching "{searchTerm}"</p>
                        </div>
                    )
                ) : allUsers.length > 0 ? (
                    <>
                        <h3 className="section-title">Suggested People ({allUsers.length})</h3>
                        <div className="users-grid">
                            {allUsers.slice(0, 12).map((resultUser) => (
                                <UserCard
                                    key={resultUser.id}
                                    user={resultUser}
                                    isFollowing={followingIds.includes(resultUser.id)}
                                    onFollow={() => handleFollow(resultUser.id)}
                                    onUnfollow={() => handleUnfollow(resultUser.id)}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <Users size={64} />
                        <h3>Be the First!</h3>
                        <p>No other users have signed up yet. Invite your friends!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;
