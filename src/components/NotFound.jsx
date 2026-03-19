import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import '../styles/NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="notfound-container">
            <div className="notfound-content">
                <div className="notfound-icon-wrapper">
                    <AlertCircle size={80} className="notfound-icon" />
                    <div className="notfound-404-text">404</div>
                </div>
                <h1 className="notfound-title">Page Not Found</h1>
                <p className="notfound-message">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>
                <button 
                    className="notfound-home-btn" 
                    onClick={() => navigate('/dashboard')}
                >
                    <Home size={20} />
                    <span>Back to Dashboard</span>
                </button>
            </div>
            
            {/* Background elements for premium feel */}
            <div className="notfound-bg-glow"></div>
            <div className="notfound-dots"></div>
        </div>
    );
};

export default NotFound;
