import React, { useEffect, useState } from 'react';
import '../styles/Toast.css';

const Toast = ({ message, type = 'success', duration = 3000, onExited }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFadingOut(true);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleAnimationEnd = () => {
        if (isFadingOut && onExited) {
            onExited();
        }
    };

    return (
        <div
            className={`toast-item ${type} ${isFadingOut ? 'fade-out' : ''}`}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className="toast-icon">
                {type === 'success' ? '✅' : '❌'}
            </div>
            <div className="toast-message">{message}</div>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onExited={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default Toast;
