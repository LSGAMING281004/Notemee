import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageSquare, UserPlus, UserCheck } from 'lucide-react';
import '../styles/UserCard.css';

const UserCard = ({ user, isFollowing, onFollow, onUnfollow }) => {
    const navigate = useNavigate();

    const handleMessage = () => {
        navigate(`/chat?uid=${user.id || user.uid}`);
    };

    return (
        <div className="user-card">
            <div className="user-card-header">
                <img
                    src={user.photoURL || "https://via.placeholder.com/60"}
                    alt={user.displayName}
                    className="user-card-avatar"
                />
                <div className="user-card-info">
                    <h3>{user.displayName || 'Anonymous User'}</h3>
                    <p>{user.email}</p>
                </div>
            </div>
            <div className="user-card-actions">
                {isFollowing ? (
                    <button className="action-btn following" onClick={() => onUnfollow(user.uid || user.id)}>
                        <UserCheck size={18} />
                        <span>Following</span>
                    </button>
                ) : (
                    <button className="action-btn follow" onClick={() => onFollow(user.uid || user.id)}>
                        <UserPlus size={18} />
                        <span>Follow</span>
                    </button>
                )}
                <button className="action-btn message" onClick={handleMessage}>
                    <MessageSquare size={18} />
                </button>
            </div>
        </div>
    );
};

export default UserCard;
