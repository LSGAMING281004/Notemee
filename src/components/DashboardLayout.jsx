import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import Sidebar from './Sidebar';
import '../styles/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    const { user } = useAuth();

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content-wrapper">
                <main className="dashboard-main">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
