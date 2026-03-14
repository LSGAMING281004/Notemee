import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ModalContext = createContext(null);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    const showConfirm = useCallback(({ title, message, onConfirm, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                setModalConfig(null);
            },
            onCancel: () => setModalConfig(null),
            type,
            confirmText,
            cancelText
        });
    }, []);

    const showAlert = useCallback(({ title, message, type = 'info', confirmText = 'OK' }) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => setModalConfig(null),
            onCancel: null, // No cancel button for alert
            type,
            confirmText,
            isAlert: true
        });
    }, []);

    const closeModal = useCallback(() => {
        setModalConfig(null);
    }, []);

    return (
        <ModalContext.Provider value={{ showConfirm, showAlert, closeModal }}>
            {children}
            {modalConfig && (
                <ConfirmModal
                    {...modalConfig}
                />
            )}
        </ModalContext.Provider>
    );
};
