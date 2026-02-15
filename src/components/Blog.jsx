import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Eye, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import Footer from './Footer';
import '../styles/Blog.css';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPublicPosts = async () => {
            try {
                const q = query(
                    collection(db, 'notes'),
                    where('isPublic', '==', true)
                );

                const querySnapshot = await getDocs(q);
                const postsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort manually if index isn't created yet
                postsData.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

                setPosts(postsData);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicPosts();
    }, []);

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

    return (
        <div className="blog-page">
            <nav className="blog-nav">
                <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src="/notemee_logo.png" alt="Notemee Logo" className="logo-img" />
                    <div className="logo-text">Blog</div>
                </div>
                <button className="write-btn" onClick={() => navigate('/login')}>Start Writing</button>
            </nav>

            <header className="blog-header">
                <h1>Insights & Thoughts</h1>
                <p>Explore articles and notes shared by the Notemee community.</p>
            </header>

            <main className="blog-container">
                {loading ? (
                    <div className="blog-loading">Loading articles...</div>
                ) : posts.length === 0 ? (
                    <div className="blog-empty">
                        <h2>No public articles yet.</h2>
                        <p>Be the first to share your thoughts with the world!</p>
                    </div>
                ) : (
                    <div className="blog-grid">
                        {posts.map((post) => (
                            <article key={post.id} className="blog-card" onClick={() => navigate(`/blog/${post.id}`)}>
                                <div className="blog-meta">
                                    <span className="author">By {post.authorName || 'Anonymous'}</span>
                                    <span className="dot">•</span>
                                    <span className="date">{formatDate(post.createdAt)}</span>
                                </div>
                                <h2 className="blog-title">{post.title}</h2>
                                <p className="blog-excerpt">
                                    {post.content.substring(0, 200)}...
                                </p>
                                <div className="blog-footer">
                                    <div className="blog-stats">
                                        <span title="Views"><Eye size={16} /> {post.views || 0}</span>
                                        <span title="Likes"><ThumbsUp size={16} /> {post.likes?.length || 0}</span>
                                        <span title="Dislikes"><ThumbsDown size={16} /> {post.dislikes?.length || 0}</span>
                                        <span title="Comments"><MessageSquare size={16} /> {post.commentCount || 0}</span>
                                    </div>
                                    <span className="read-more">Read full article →</span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Blog;
