import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Camera, Save, User, Mail, FileText, LogOut, Trash2, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

const Profile = () => {
    const { user, updateUserProfile, logout, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({
        displayName: '',
        bio: '',
        photoURL: ''
    });
    const [counts, setCounts] = useState({
        followers: [],
        following: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalUsers, setModalUsers] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfileData({
                            displayName: data.displayName || user.displayName || '',
                            bio: data.bio || '',
                            photoURL: data.photoURL || user.photoURL || ''
                        });
                        setCounts({
                            followers: data.followers || [],
                            following: data.following || []
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setLoading(false);
                }
            } else if (user === null) {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [user]);

    const handleChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            if (user) {
                await updateUserProfile({
                    displayName: profileData.displayName,
                    photoURL: profileData.photoURL
                });

                const userRef = doc(db, 'users', user.uid);
                await setDoc(userRef, {
                    displayName: profileData.displayName,
                    photoURL: profileData.photoURL,
                    bio: profileData.bio
                }, { merge: true });
            }
            setMessage('Profile updated successfully!');
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("CRITICAL: Are you sure you want to delete your account? All your data will be permanently removed. This action cannot be undone.")) {
            try {
                await deleteAccount();
                navigate('/');
            } catch (error) {
                console.error("Error deleting account:", error);
                alert("Failed to delete account. You may need to log in again recently to perform this action.");
            }
        }
    };

    const openListModal = async (title, userIds) => {
        setModalTitle(title);
        setShowModal(true);
        setModalLoading(true);
        setModalUsers([]);

        if (!userIds || userIds.length === 0) {
            setModalLoading(false);
            return;
        }

        try {
            const users = [];
            // Firestore 'in' query supports up to 10-30 IDs usually, but let's do simple loop or chunk if needed
            // For now, simple loop for smaller lists
            for (const uid of userIds) {
                const uDoc = await getDoc(doc(db, 'users', uid));
                if (uDoc.exists()) {
                    users.push({ id: uDoc.id, ...uDoc.data() });
                }
            }
            setModalUsers(users);
        } catch (error) {
            console.error(`Error fetching ${title}:`, error);
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) return <div className="profile-loading">Loading profile...</div>;

    return (
        <div className="profile-page">
            <div className="profile-container">
                <header className="profile-header">
                    <h1>My Profile</h1>
                    <p>Manage your account settings and public profile.</p>
                </header>

                <div className="profile-content">
                    <div className="profile-card">
                        <div className="profile-avatar-section">
                            <div className="avatar-wrapper">
                                <img
                                    src={profileData.photoURL || "https://via.placeholder.com/150"}
                                    alt="Profile"
                                    className="profile-avatar"
                                />
                                <div className="avatar-overlay">
                                    <Camera size={24} color="white" />
                                </div>
                            </div>

                            <div className="profile-stats">
                                <div className="stat-item clickable" onClick={() => openListModal('Followers', counts.followers)}>
                                    <span className="stat-count">{counts.followers.length}</span>
                                    <span className="stat-label">Followers</span>
                                </div>
                                <div className="stat-divider"></div>
                                <div className="stat-item clickable" onClick={() => openListModal('Following', counts.following)}>
                                    <span className="stat-count">{counts.following.length}</span>
                                    <span className="stat-label">Following</span>
                                </div>
                            </div>

                            <p className="email-display"><Mail size={16} /> {user?.email}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="profile-form">
                            <div className="form-group">
                                <label><User size={18} /> Display Name</label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={profileData.displayName}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label><Camera size={18} /> Photo URL</label>
                                <input
                                    type="text"
                                    name="photoURL"
                                    value={profileData.photoURL}
                                    onChange={handleChange}
                                    placeholder="Paste image URL..."
                                />
                            </div>

                            <div className="form-group">
                                <label><FileText size={18} /> Bio</label>
                                <textarea
                                    name="bio"
                                    value={profileData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell the world about yourself..."
                                    rows="4"
                                />
                            </div>

                            {message && <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>}

                            <div className="profile-actions">
                                <button type="submit" className="save-btn" disabled={saving}>
                                    <Save size={20} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>

                                <div className="danger-zone">
                                    <button type="button" onClick={handleLogout} className="logout-btn-profile">
                                        <LogOut size={20} /> Logout
                                    </button>
                                    <button type="button" onClick={handleDeleteAccount} className="delete-acc-btn">
                                        <Trash2 size={20} /> Delete Account
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Followers/Following Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalTitle}</h3>
                            <button className="close-modal" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {modalLoading ? (
                                <div className="modal-loading">Loading users...</div>
                            ) : modalUsers.length === 0 ? (
                                <div className="modal-empty">No users found.</div>
                            ) : (
                                <div className="user-list">
                                    {modalUsers.map(u => (
                                        <div key={u.id} className="user-list-item-mini" onClick={() => {
                                            setShowModal(false);
                                            navigate(`/profile/${u.id}`);
                                        }}>
                                            <img src={u.photoURL || "https://via.placeholder.com/40"} alt={u.displayName} />
                                            <span>{u.displayName || 'Anonymous'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
