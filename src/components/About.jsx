import React from 'react';
import Footer from './Footer';
import '../styles/PolicyPages.css';

const About = () => {
    return (
        <div className="page-container">
            <main className="policy-content">
                <h1>About Notemee</h1>
                <p>Notemee is a simple, elegant, and secure note-taking application designed to help you capture your thoughts, ideas, and daily reflections instantly.</p>

                <h2>Our Mission</h2>
                <p>We believe that simplicity is the ultimate sophistication. Our mission is to provide a clutter-free environment where your thoughts can flow freely without distractions.</p>

                <h2>Why Choose Notemee?</h2>
                <ul>
                    <li><strong>Privacy First:</strong> Your notes are stored securely and are only accessible by you.</li>
                    <li><strong>Minimalist Design:</strong> Focus on what matters—your content.</li>
                    <li><strong>Sync Across Devices:</strong> Access your thoughts anywhere, anytime.</li>
                </ul>

                <h2>Who We Are</h2>
                <p>Notemee was created by a dedicated developer passionate about productivity tools. We are constantly improving the platform based on user feedback.</p>
            </main>
            <Footer />
        </div>
    );
};

export default About;
