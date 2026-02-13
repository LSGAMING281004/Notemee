import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Footer from './Footer';
import '../styles/Article.css';

const Article = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const docRef = doc(db, 'notes', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().isPublic) {
                    setArticle(docSnap.data());
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

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        return timestamp.toDate().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) return <div className="article-loading">Loading article...</div>;
    if (!article) return <div className="article-not-found">Article not found.</div>;

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
                        <span className="author">By {article.authorName}</span>
                        <span className="dot">•</span>
                        <span className="date">{formatDate(article.createdAt)}</span>
                    </div>
                    <h1>{article.title}</h1>
                </header>

                <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }}>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Article;
