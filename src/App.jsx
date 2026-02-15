import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Loading from './components/Loading';
import Login from './components/Login';
import Home from './components/Home';
import NotesList from './components/NotesList';
import LandingPage from './components/LandingPage';
import About from './components/About';
import Contact from './components/Contact';
import PrivacyPolicy from './components/PrivacyPolicy';
import Terms from './components/Terms';
import Blog from './components/Blog';
import Article from './components/Article';
import Profile from './components/Profile';
import Community from './components/Community';
import Chat from './components/Chat';
import DashboardLayout from './components/DashboardLayout';
import './App.css';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    return !user ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<Article />} />

            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/community"
                element={
                    <ProtectedRoute>
                        <Community />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        <Chat />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/notes"
                element={
                    <ProtectedRoute>
                        <NotesList />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <ToastProvider>
                <AuthProvider>
                    <Suspense fallback={<Loading fullScreen={true} />}>
                        <AppRoutes />
                    </Suspense>
                </AuthProvider>
            </ToastProvider>
        </Router>
    );
}

export default App;
