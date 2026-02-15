import React from 'react';
import '../styles/Loading.css';

const Loading = ({ fullScreen = false, text = "Loading..." }) => {
    return (
        <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
            <div className="spinner"></div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default Loading;
