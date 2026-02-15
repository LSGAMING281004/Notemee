import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { Send, User, MessageSquare, ArrowLeft, Users, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import '../styles/Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    // Sidebar state
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'following' | 'search'
    const [conversations, setConversations] = useState([]);
    const [followedUsers, setFollowedUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sidebarLoading, setSidebarLoading] = useState(true);

    // Chat state
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Initialize chat from URL param if present
    useEffect(() => {
        const initChat = async () => {
            const targetUserId = searchParams.get('uid');
            if (targetUserId && user) {
                const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
                if (targetUserDoc.exists()) {
                    const targetUserData = targetUserDoc.data();
                    startChat({
                        id: targetUserId,
                        displayName: targetUserData?.displayName || 'User',
                        photoURL: targetUserData?.photoURL || ''
                    });
                }
            }
        };
        initChat();
    }, [searchParams, user]);

    // Fetch conversations list (real-time)
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chats = [];
            snapshot.forEach((docSnap) => {
                chats.push({ id: docSnap.id, ...docSnap.data() });
            });
            setConversations(chats);
            setSidebarLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch followed users
    useEffect(() => {
        const fetchFollowedUsers = async () => {
            if (!user?.uid) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (!userDoc.exists()) return;

                const followingIds = userDoc.data().following || [];
                if (followingIds.length === 0) {
                    setFollowedUsers([]);
                    return;
                }

                // Fetch each followed user's profile
                const users = [];
                for (const uid of followingIds) {
                    const followedDoc = await getDoc(doc(db, 'users', uid));
                    if (followedDoc.exists()) {
                        users.push({ id: followedDoc.id, ...followedDoc.data() });
                    }
                }
                setFollowedUsers(users);
            } catch (err) {
                console.error('Error fetching followed users:', err);
            }
        };
        fetchFollowedUsers();
    }, [user]);

    // Fetch all users for search
    useEffect(() => {
        const fetchAllUsers = async () => {
            if (!user) return;
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const users = [];
                querySnapshot.forEach((docSnap) => {
                    if (docSnap.id !== user.uid) {
                        users.push({ id: docSnap.id, ...docSnap.data() });
                    }
                });
                setAllUsers(users);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };
        fetchAllUsers();
    }, [user]);

    // Fetch messages for active chat (real-time)
    useEffect(() => {
        if (!activeChat?.id) return;

        const q = query(
            collection(db, 'chats', activeChat.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach((docSnap) => {
                msgs.push({ id: docSnap.id, ...docSnap.data() });
            });
            setMessages(msgs);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [activeChat?.id]);

    // Start or open a chat with a target user
    const startChat = async (targetUser) => {
        if (!user || !targetUser?.id) return;

        const chatId = [user.uid, targetUser.id].sort().join('_');

        // Check if we already have this conversation loaded
        const existingConvo = conversations.find(c => c.id === chatId);
        if (existingConvo) {
            setActiveChat(existingConvo);
            return;
        }

        // Check Firestore
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
            setActiveChat({ id: chatSnap.id, ...chatSnap.data() });
        } else {
            // Create a local placeholder (not saved to DB until first message)
            setActiveChat({
                id: chatId,
                participants: [user.uid, targetUser.id],
                participantDetails: {
                    [targetUser.id]: {
                        displayName: targetUser.displayName || 'User',
                        photoURL: targetUser.photoURL || ''
                    },
                    [user.uid]: {
                        displayName: user.displayName,
                        photoURL: user.photoURL
                    }
                },
                lastMessage: '',
                lastMessageTime: null,
                _isNew: true
            });
        }
        setMessages([]);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || !user) return;

        const text = newMessage.trim();
        setNewMessage('');

        try {
            const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
            await addDoc(messagesRef, {
                senderId: user.uid,
                text: text,
                createdAt: serverTimestamp(),
                read: false
            });

            const chatRef = doc(db, 'chats', activeChat.id);
            await setDoc(chatRef, {
                participants: activeChat.participants,
                participantDetails: activeChat.participantDetails || {},
                lastMessage: text,
                lastMessageTime: serverTimestamp()
            }, { merge: true });

            // If it was a new chat, mark it as no longer new
            if (activeChat._isNew) {
                setActiveChat(prev => ({ ...prev, _isNew: false }));
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const getOtherParticipant = (chat) => {
        if (!chat?.participantDetails) return { displayName: 'User', photoURL: '' };
        const otherId = chat.participants?.find(id => id !== user.uid);
        return chat.participantDetails[otherId] || { displayName: 'User', photoURL: '' };
    };

    // Filter users for search
    const searchResults = searchTerm.trim()
        ? allUsers.filter(u => {
            const term = searchTerm.toLowerCase();
            return u.displayName?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
        })
        : [];

    // Check if a user already has an existing conversation
    const hasExistingChat = (userId) => {
        const chatId = [user.uid, userId].sort().join('_');
        return conversations.some(c => c.id === chatId);
    };

    const formatLastMessage = (msg) => {
        if (!msg) return 'Start a conversation';
        return msg.length > 35 ? msg.substring(0, 35) + '...' : msg;
    };

    return (
        <div className="chat-container">
            {/* Sidebar */}
            <div className={`chat-sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
                <div className="chat-header">
                    <h2>Messages</h2>
                </div>

                {/* Tab Bar */}
                <div className="chat-tabs">
                    <button
                        className={`chat-tab ${activeTab === 'chats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chats')}
                    >
                        <MessageSquare size={16} />
                        <span>Chats</span>
                    </button>
                    <button
                        className={`chat-tab ${activeTab === 'following' ? 'active' : ''}`}
                        onClick={() => setActiveTab('following')}
                    >
                        <Users size={16} />
                        <span>Following</span>
                    </button>
                    <button
                        className={`chat-tab ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => setActiveTab('search')}
                    >
                        <Search size={16} />
                        <span>Search</span>
                    </button>
                </div>

                {/* Search Input (only for search tab) */}
                {activeTab === 'search' && (
                    <div className="chat-search-bar">
                        <Search size={16} className="chat-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}

                {/* Tab Content */}
                <div className="conversations-list">
                    {/* CHATS TAB */}
                    {activeTab === 'chats' && (
                        <>
                            {sidebarLoading ? (
                                <div className="empty-state-chat">
                                    <p>Loading chats...</p>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="empty-state-chat">
                                    <MessageSquare size={32} />
                                    <p>No conversations yet</p>
                                    <p className="sub-text">Follow someone and start chatting!</p>
                                </div>
                            ) : (
                                conversations.map(chat => {
                                    const otherUser = getOtherParticipant(chat);
                                    return (
                                        <div
                                            key={chat.id}
                                            className={`conversation-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                                            onClick={() => setActiveChat(chat)}
                                        >
                                            <img src={otherUser.photoURL || "https://via.placeholder.com/40"} alt="User" />
                                            <div className="conversation-info">
                                                <h4>{otherUser.displayName}</h4>
                                                <p>{formatLastMessage(chat.lastMessage)}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}

                    {/* FOLLOWING TAB */}
                    {activeTab === 'following' && (
                        <>
                            {followedUsers.length === 0 ? (
                                <div className="empty-state-chat">
                                    <Users size={32} />
                                    <p>You aren't following anyone</p>
                                    <p className="sub-text">Visit Community to find people!</p>
                                </div>
                            ) : (
                                followedUsers.map(followedUser => (
                                    <div
                                        key={followedUser.id}
                                        className="user-list-item"
                                        onClick={() => startChat(followedUser)}
                                    >
                                        <img src={followedUser.photoURL || "https://via.placeholder.com/40"} alt={followedUser.displayName} />
                                        <div className="user-list-info">
                                            <h4>{followedUser.displayName || 'User'}</h4>
                                            <p>{hasExistingChat(followedUser.id) ? '💬 Chat exists' : 'Tap to start chatting'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {/* SEARCH TAB */}
                    {activeTab === 'search' && (
                        <>
                            {!searchTerm.trim() ? (
                                <div className="empty-state-chat">
                                    <Search size={32} />
                                    <p>Search for a user</p>
                                    <p className="sub-text">Type a name or email above</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="empty-state-chat">
                                    <User size={32} />
                                    <p>No users found</p>
                                    <p className="sub-text">Try a different name or email</p>
                                </div>
                            ) : (
                                searchResults.map(resultUser => (
                                    <div
                                        key={resultUser.id}
                                        className="user-list-item"
                                        onClick={() => startChat(resultUser)}
                                    >
                                        <img src={resultUser.photoURL || "https://via.placeholder.com/40"} alt={resultUser.displayName} />
                                        <div className="user-list-info">
                                            <h4>{resultUser.displayName || 'User'}</h4>
                                            <p>{resultUser.email}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Active Chat Area */}
            <div className={`chat-main ${!activeChat ? 'mobile-hidden' : ''}`}>
                {!activeChat ? (
                    <div className="no-chat-selected">
                        <MessageSquare size={48} />
                        <h3>Select a conversation</h3>
                        <p>Choose from your chats, following list, or search for someone.</p>
                    </div>
                ) : (
                    <>
                        <div className="active-chat-header">
                            <button className="back-btn mobile-only" onClick={() => setActiveChat(null)}>
                                <ArrowLeft size={20} />
                            </button>
                            <div className="header-info">
                                <img
                                    src={getOtherParticipant(activeChat).photoURL || "https://via.placeholder.com/40"}
                                    alt="User"
                                />
                                <h3>{getOtherParticipant(activeChat).displayName}</h3>
                            </div>
                        </div>

                        <div className="messages-area">
                            {messages.length === 0 && (
                                <div className="empty-messages">
                                    <MessageSquare size={36} />
                                    <p>No messages yet. Say hello! 👋</p>
                                </div>
                            )}
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`message-bubble ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                                >
                                    <p>{msg.text}</p>
                                    <span className="timestamp">
                                        {msg.createdAt?.seconds
                                            ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '...'}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="message-input-area">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" disabled={!newMessage.trim()}>
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Chat;
