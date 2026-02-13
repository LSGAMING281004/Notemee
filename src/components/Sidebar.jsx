import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
    const { logout } = useAuth();

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
                    <span className="icon">🏠</span> Dashboard
                </NavLink>
                <NavLink to="/notes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">📓</span> My Notes
                </NavLink>
                <NavLink to="/blog" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                    <span className="icon">🌐</span> Public Blog
                </NavLink>
                <NavLink to="/about" className="nav-item">
                    <span className="icon">ℹ️</span> About
                </NavLink>
            </nav>
            <div className="sidebar-footer">
                <button onClick={logout} className="logout-btn">
                    <span className="icon">🚪</span> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
