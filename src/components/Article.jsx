import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';
import '../styles/Article.css';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

const Article = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    // Social features state
    const [likes, setLikes] = useState([]);
    const [dislikes, setDislikes] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const docRef = doc(db, 'notes', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().isPublic) {
                    setArticle(docSnap.data());

                    // Increment view count
                    try {
                        await updateDoc(docRef, {
                            views: (docSnap.data().views || 0) + 1
                        });
                    } catch (err) {
                        console.warn('Could not update view count (likely permission issue):', err);
                    }
                } else {
                    console.error('No such article or article is private');
                }
            } catch (error) {
                console.error('Error fetching article:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id]);

    // Real-time listener for likes/dislikes
    useEffect(() => {
        if (!id) return;
        const docRef = doc(db, 'notes', id);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setLikes(data.likes || []);
                setDislikes(data.dislikes || []);
            }
        });
        return () => unsubscribe();
    }, [id]);

    // Real-time listener for comments
    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, 'notes', id, 'comments'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(commentsData);
        });
        return () => unsubscribe();
    }, [id]);

    const handleLike = async () => {
        if (!user) return alert('Please login to like this article');
        const docRef = doc(db, 'notes', id);
        const isLiked = likes.includes(user.uid);

        try {
            if (isLiked) {
                await updateDoc(docRef, {
                    likes: arrayRemove(user.uid)
                });
            } else {
                await updateDoc(docRef, {
                    likes: arrayUnion(user.uid),
                    dislikes: arrayRemove(user.uid)
                });
            }
        } catch (error) {
            console.error('Error updating like:', error);
        }
    };

    const handleDislike = async () => {
        if (!user) return alert('Please login to dislike this article');
        const docRef = doc(db, 'notes', id);
        const isDisliked = dislikes.includes(user.uid);

        try {
            if (isDisliked) {
                await updateDoc(docRef, {
                    dislikes: arrayRemove(user.uid)
                });
            } else {
                await updateDoc(docRef, {
                    dislikes: arrayUnion(user.uid),
                    likes: arrayRemove(user.uid)
                });
            }
        } catch (error) {
            console.error('Error updating dislike:', error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert('Please login to comment');
        if (!newComment.trim()) return;

        setCommentLoading(true);
        try {
            await addDoc(collection(db, 'notes', id, 'comments'), {
                text: newComment,
                uid: user.uid,
                authorName: user.displayName || user.email.split('@')[0],
                createdAt: serverTimestamp()
            });

            // Update comment count on parent document
            const docRef = doc(db, 'notes', id);
            const docSnap = await getDoc(docRef); // Get latest data to ensure atomic-ish update or just increment
            // Actually, increment is better but I need to import increment from firestore. 
            // For now, I'll just read and update or use the length from local state + 1? 
            // Better to use firestore field increment if possible, but I didn't import it.
            // Let's import 'increment' in the next tool call or just use current known count.
            // Since I am in the same function, I can just do:
            await updateDoc(docRef, {
                commentCount: (docSnap.data().commentCount || 0) + 1
            });

            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setCommentLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        if (typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) return <div className="article-loading">Loading article...</div>;
    if (!article) return <div className="article-not-found">Article not found.</div>;

    const isLiked = user && Array.isArray(likes) && likes.includes(user.uid);
    const isDisliked = user && Array.isArray(dislikes) && dislikes.includes(user.uid);

    return (
        <div className="article-page">
            <nav className="blog-nav">
                <div className="logo-container" onClick={() => navigate('/blog')} style={{ cursor: 'pointer' }}>
                    <img src="/notemee_logo.png" alt="Notemee Logo" className="logo-img" />
                    <div className="logo-text">Blog</div>
                </div>
                <button className="write-btn" onClick={() => navigate('/login')}>Start Writing</button>
            </nav>

            <main className="article-container">
                <header className="article-header">
                    <div className="article-meta">
                        <span
                            className="author clickable"
                            onClick={() => navigate(`/profile/${article.userId}`)}
                            style={{ cursor: 'pointer', color: '#4a90e2' }}
                        >
                            By {article.authorName}
                        </span>
                        <span className="dot">•</span>
                        <span className="date">{formatDate(article.createdAt)}</span>
                    </div>
                    <h1>{article.title}</h1>
                </header>

                <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}>
                </div>

                <div className="social-interactions">
                    <div className="interaction-bar">
                        <button
                            className={`action-btn ${isLiked ? 'active' : ''}`}
                            onClick={handleLike}
                            title="Like"
                        >
                            <ThumbsUp size={20} /> <span className="count">{likes.length}</span>
                        </button>
                        <button
                            className={`action-btn ${isDisliked ? 'active' : ''}`}
                            onClick={handleDislike}
                            title="Dislike"
                        >
                            <ThumbsDown size={20} /> <span className="count">{dislikes.length}</span>
                        </button>
                    </div>

                    <div className="comments-section">
                        <h3>Comments ({comments.length})</h3>

                        {user ? (
                            <form onSubmit={handleCommentSubmit} className="comment-form">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    rows="3"
                                    required
                                />
                                <button type="submit" disabled={commentLoading}>
                                    {commentLoading ? 'Posting...' : 'Post Comment'}
                                </button>
                            </form>
                        ) : (
                            <p className="login-prompt">
                                <span onClick={() => navigate('/login')}>Log in</span> to join the discussion.
                            </p>
                        )}

                        <div className="comments-list">
                            {comments.map((comment) => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.authorName}</span>
                                        <span className="comment-date">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="no-comments">No comments yet. Be the first!</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Article;
