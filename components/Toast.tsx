import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        info: 'bg-sky-500'
    };

    return (
        <div className={`fixed top-6 right-6 z-[9999] ${bgColors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right-10 fade-in duration-300`}>
            <div className="font-bold text-sm">{message}</div>
            <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>
    );
};

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const root = createRoot(container);

    const handleClose = () => {
        root.unmount();
    };

    root.render(<Toast message={message} type={type} onClose={handleClose} />);
};

export const ToastContainer = () => <div id="toast-container" />;
