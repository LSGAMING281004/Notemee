import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Camera, Save, User, Mail, FileText } from 'lucide-react';
import '../styles/Profile.css';

const Profile = () => {
    const { user, updateUserProfile } = useAuth();
    const [profileData, setProfileData] = useState({
        displayName: '',
        bio: '',
        photoURL: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfileData({
                            displayName: data.displayName || user.displayName,
                            bio: data.bio || '',
                            photoURL: data.photoURL || user.photoURL
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setLoading(false);
                }
            } else {
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
            // Update Auth Profile (Sidebar/Header)
            if (user) {
                await updateUserProfile({
                    displayName: profileData.displayName,
                    photoURL: profileData.photoURL
                });
            }

            setMessage('Profile updated successfully!');

        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage('Failed to update profile.');
        } finally {
            setSaving(false);
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

                            <button type="submit" className="save-btn" disabled={saving}>
                                <Save size={20} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
