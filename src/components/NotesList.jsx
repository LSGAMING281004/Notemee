import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import '../styles/NotesList.css';

const NotesList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = async (noteId) => {
        if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'notes', noteId));
                setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
                showToast('Note deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting note:', error);
                showToast('Failed to delete note', 'error');
            }
        }
    };

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const notesQuery = query(
                    collection(db, 'notes'),
                    where('userId', '==', user.uid)
                );

                const querySnapshot = await getDocs(notesQuery);
                const notesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                notesData.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

                setNotes(notesData);
            } catch (error) {
                console.error('Error fetching notes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, [user.uid]);

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="notes-list-premium">
            <header className="page-header">
                <div className="header-top">
                    <h1>My Notes</h1>
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search your notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <p>Manage and review your saved thoughts.</p>
            </header>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your notes...</p>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="empty-dashboard">
                    <div className="empty-icon">{searchTerm ? '🔍' : '📓'}</div>
                    <h3>{searchTerm ? 'No matches found' : 'No notes found'}</h3>
                    <p>{searchTerm ? `We couldn't find anything matching "${searchTerm}"` : "You haven't created any notes yet. Start writing on the dashboard!"}</p>
                    {!searchTerm && (
                        <button className="primary-btn" onClick={() => navigate('/dashboard')}>
                            Create First Note
                        </button>
                    )}
                </div>
            ) : (
                <div className="notes-grid-premium">
                    {filteredNotes.map((note) => (
                        <div key={note.id} className="premium-note-card">
                            <div className="card-header">
                                <div className="card-badge">
                                    {note.isPublic ? <span className="public-label">Public / Blog</span> : <span className="private-label">Private</span>}
                                </div>
                                <button
                                    className="delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(note.id);
                                    }}
                                    title="Delete Note"
                                >
                                    🗑️
                                </button>
                            </div>
                            <h3 className="card-title">{note.title}</h3>
                            <p className="card-excerpt">{note.content.substring(0, 150)}{note.content.length > 150 ? '...' : ''}</p>
                            <div className="card-footer">
                                <span className="card-date">{formatDate(note.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotesList;
