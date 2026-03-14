import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import '../styles/ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel', isAlert = false }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && onCancel) {
                onCancel();
            } else if (e.key === 'Escape' && isAlert) {
                onConfirm();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel, onConfirm, isAlert]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger':
                return <AlertTriangle size={32} className="modal-icon danger" />;
            case 'warning':
                return <AlertCircle size={32} className="modal-icon warning" />;
            case 'success':
                return <CheckCircle2 size={32} className="modal-icon success" />;
            case 'info':
            default:
                return <Info size={32} className="modal-icon info" />;
        }
    };

    return createPortal(
        <div className="modal-overlay" onClick={isAlert ? onConfirm : onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={isAlert ? onConfirm : onCancel}>
                    <X size={20} />
                </button>
                <div className="modal-header-section">
                    {getIcon()}
                    <h2 className="modal-title">{title}</h2>
                </div>
                <div className="modal-body-section">
                    <p>{message}</p>
                </div>
                <div className="modal-actions-section">
                    {!isAlert && (
                        <button className="modal-btn cancel" onClick={onCancel}>
                            {cancelText}
                        </button>
                    )}
                    <button className={`modal-btn confirm ${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
