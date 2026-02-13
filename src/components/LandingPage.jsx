import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import '../styles/LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src="/notemee_logo.png" alt="Notemee Logo" className="logo-img" />
                    <div className="logo-text">Notemee</div>
                </div>
                <div className="nav-btns">
                    <button onClick={() => navigate('/login')} className="login-btn">Login</button>
                    <button onClick={() => navigate('/login')} className="signup-btn">Get Started</button>
                </div>
            </nav>

            <header className="hero-section">
                <h1>Capture Your Thoughts <span className="highlight">Effortlessly</span></h1>
                <p>The simplest way to keep track of your daily notes, ideas, and reminders. Fast, secure, and available everywhere.</p>
                <button onClick={() => navigate('/login')} className="hero-cta">Start Writing for Free</button>
            </header>

            <section className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon">📝</div>
                    <h3>Fast Note Taking</h3>
                    <p>Open the app and start writing immediately. Our interface is designed for speed and simplicity.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">☁️</div>
                    <h3>Cloud Sync</h3>
                    <p>Your notes are automatically synced to the cloud. Never worry about losing your valuable thoughts again.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h3>Secure & Private</h3>
                    <p>We take your privacy seriously. Your data is encrypted and only accessible by you.</p>
                </div>
            </section>

            <section className="content-section">
                <div className="content-block">
                    <h2>Why Digital Note-Taking Matters</h2>
                    <p>In today's fast-paced world, capturing ideas as they come is crucial. Notemee provides the perfect digital canvas for your brainstorming sessions, grocery lists, or daily journaling. By organizing your thoughts digitally, you can search, edit, and access them from any device, ensuring you're always productive.</p>
                </div>
                <div className="content-block">
                    <h2>Boost Your Productivity</h2>
                    <p>Studies show that writing down your goals and tasks significantly increases the likelihood of achieving them. Use Notemee to set your daily intentions, track your progress, and clear your mind. A clear mind leads to better focus and higher quality work.</p>
                </div>
                <div className="content-block">
                    <h2>Accessible Everywhere</h2>
                    <p>Whether you're on your desktop at the office or on your mobile device during your commute, Notemee is with you. Our responsive design ensures a seamless experience across all screen sizes, so you can capture inspiration whenever it strikes.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
