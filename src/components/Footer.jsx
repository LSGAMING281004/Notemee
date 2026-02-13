import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>Notemee</h3>
                    <p>Organize your thoughts, daily.</p>
                </div>
                <div className="footer-links">
                    <Link to="/about">About Us</Link>
                    <Link to="/contact">Contact Us</Link>
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms & Conditions</Link>
                </div>
            </div>
            <div className="footer-bottom">
                &copy; {new Date().getFullYear()} Notemee. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
