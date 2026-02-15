import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Send, User, MessageSquare, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import '../styles/Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Initialize chat from URL param if present
    useEffect(() => {
        const initChat = async () => {
            const targetUserId = searchParams.get('uid');
            if (targetUserId && user) {
                const chatId = [user.uid, targetUserId].sort().join('_');
                // Check if chat exists, if not, create placeholder
                const chatRef = doc(db, 'chats', chatId);
                const chatSnap = await getDoc(chatRef);

                if (!chatSnap.exists()) {
                    // Fetch target user info for local display initially
                    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
                    const targetUserData = targetUserDoc.data();

                    const newChat = {
                        id: chatId,
                        participants: [user.uid, targetUserId],
                        participantDetails: {
                            [targetUserId]: {
                                displayName: targetUserData?.displayName || 'User',
                                photoURL: targetUserData?.photoURL || ''
                            },
                            [user.uid]: {
                                displayName: user.displayName,
                                photoURL: user.photoURL
                            }
                        },
                        lastMessage: '',
                        lastMessageTime: serverTimestamp(),
                    };

                    // We don't necessarily need to create it in DB until a message is sent, 
                    // but it helps UI consistency. For now, let's just set it as active.
                    setActiveChat(newChat);
                } else {
                    setActiveChat({ id: chatSnap.id, ...chatSnap.data() });
                }
            }
        };
        initChat();
    }, [searchParams, user]);


    // Fetch conversations list
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chats = [];
            snapshot.forEach((doc) => {
                chats.push({ id: doc.id, ...doc.data() });
            });
            setConversations(chats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch messages for active chat
    useEffect(() => {
        if (!activeChat) return;

        const q = query(
            collection(db, 'chats', activeChat.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            setMessages(msgs);
            // Scroll to bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [activeChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || !user) return;

        const text = newMessage.trim();
        setNewMessage(''); // optimistic update

        try {
            // 1. Add message to subcollection
            const messagesRef = collection(db, 'chats', activeChat.id, 'messages');
            await addDoc(messagesRef, {
                senderId: user.uid,
                text: text,
                createdAt: serverTimestamp(),
                read: false
            });

            // 2. Update chat document with last message
            const chatRef = doc(db, 'chats', activeChat.id);
            // Ensure chat doc exists (in case it's the first message)
            await setDoc(chatRef, {
                participants: activeChat.participants,
                participantDetails: activeChat.participantDetails || {}, // Simplification: assume details exist or handle updates
                lastMessage: text,
                lastMessageTime: serverTimestamp()
            }, { merge: true });

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const getOtherParticipant = (chat) => {
        if (!chat.participantDetails) return { displayName: 'User', photoURL: '' };
        const otherId = chat.participants.find(id => id !== user.uid);
        return chat.participantDetails[otherId] || { displayName: 'User', photoURL: '' };
    };

    return (
        <div className="chat-container">
            {/* Sidebar / Chat List */}
            <div className={`chat-sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
                <div className="chat-header">
                    <h2>Messages</h2>
                </div>
                <div className="conversations-list">
                    {loading ? (
                        <div className="loading-state">Loading chats...</div>
                    ) : conversations.length === 0 ? (
                        <div className="empty-state-chat">
                            <MessageSquare size={32} />
                            <p>No conversations yet</p>
                            <p className="sub-text">Visit Community to message someone!</p>
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
                                        <p>{chat.lastMessage || 'Start a conversation'}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Active Chat Area */}
            <div className={`chat-main ${!activeChat ? 'mobile-hidden' : ''}`}>
                {!activeChat ? (
                    <div className="no-chat-selected">
                        <MessageSquare size={48} />
                        <h3>Select a conversation</h3>
                        <p>Choose a chat from the left or start a new one.</p>
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
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`message-bubble ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                                >
                                    <p>{msg.text}</p>
                                    <span className="timestamp">
                                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
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
