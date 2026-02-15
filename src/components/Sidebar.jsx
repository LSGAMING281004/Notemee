import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

import { LayoutDashboard, NotebookPen, Globe, Info, LogOut, User, Users, MessageSquare } from 'lucide-react';

const Sidebar = () => {
    const { logout, user } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/notemee_logo.png" alt="Notemee Logo" className="logo-img" />
                    <h2 className="logo-text">Notemee</h2>
                </div>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <LayoutDashboard size={20} className="icon" />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/notes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <NotebookPen size={20} className="icon" />
                    <span>My Notes</span>
                </NavLink>
                <NavLink to="/blog" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Globe size={20} className="icon" />
                    <span>Public Blog</span>
                </NavLink>
                <NavLink to="/community" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <Users size={20} className="icon" />
                    <span>Community</span>
                </NavLink>
                <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <MessageSquare size={20} className="icon" />
                    <span>Messages</span>
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <User size={20} className="icon" />
                    <span>Profile</span>
                </NavLink>
                <NavLink to="/about" className="nav-item">
                    <Info size={20} className="icon" />
                    <span>About</span>
                </NavLink>
            </nav>
            <div className="sidebar-footer">
                <div className="user-profile-section">
                    <div className="user-info">
                        <img
                            src={user?.photoURL || "https://via.placeholder.com/40"}
                            alt="Profile"
                            className="sidebar-avatar"
                        />
                        <div className="user-details">
                            <span className="user-name">{user?.displayName?.split(' ')[0] || 'User'}</span>
                            <span className="user-status">Online</span>
                        </div>
                    </div>
                    <button onClick={logout} className="logout-icon-btn" title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
