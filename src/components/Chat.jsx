import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, rtdb } from '../firebase';
import { ref, onValue } from 'firebase/database';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    deleteDoc,
    arrayRemove,
    deleteField
} from 'firebase/firestore';
import { Send, Image as ImageIcon, MessageSquare, ChevronLeft, MoreVertical, Trash2, ShieldAlert, X, ShieldCheck, Loader } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import '../styles/Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const { showConfirm, showAlert } = useModal();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sidebarLoading, setSidebarLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sidebarError, setSidebarError] = useState(null);
    const [messagesError, setMessagesError] = useState(null);
    const messagesEndRef = useRef(null);

    // Feature states
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showActionsModal, setShowActionsModal] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [clearedChatsMap, setClearedChatsMap] = useState({});
    const [hasBlockedMe, setHasBlockedMe] = useState(false);

    const longPressTimer = useRef(null);
    const [otherUserOnline, setOtherUserOnline] = useState(false);

    // Derive chatClearedAt from the map + activeChat (no extra listener re-creation)
    const chatClearedAt = useMemo(() => {
        if (!activeChat) return null;
        return clearedChatsMap[activeChat.id] || null;
    }, [activeChat, clearedChatsMap]);

    // Listen to other user's online status from RTDB
    useEffect(() => {
        if (!activeChat || !user) {
            setOtherUserOnline(false);
            return;
        }
        const otherId = activeChat.participants.find(id => id !== user.uid);
        if (!otherId) return;

        const statusRef = ref(rtdb, `status/${otherId}`);
        const unsubscribe = onValue(statusRef, (snapshot) => {
            const data = snapshot.val();
            setOtherUserOnline(data?.state === 'online');
        });

        return () => unsubscribe();
    }, [activeChat, user]);

    // Fetch user profile for blocked users and cleared chats — single stable listener
    useEffect(() => {
        if (!user) return;
        const unsubscribe = onSnapshot(
            doc(db, 'users', user.uid),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data({ serverTimestamps: 'estimate' });
                    setBlockedUsers(data.blockedUsers || []);
                    setClearedChatsMap(data.clearedChats || {});
                }
            },
            (error) => {
                console.error('Error fetching user profile:', error);
            }
        );
        return () => unsubscribe();
    }, [user]);

    // Check if other user has blocked me
    useEffect(() => {
        if (!activeChat || !user) {
            setHasBlockedMe(false);
            return;
        }

        const otherId = activeChat.participants.find(id => id !== user.uid);
        if (!otherId) return;

        const unsubscribe = onSnapshot(
            doc(db, 'users', otherId),
            (docSnap) => {
                if (docSnap.exists()) {
                    const otherData = docSnap.data();
                    setHasBlockedMe(otherData.blockedUsers?.includes(user.uid) || false);
                }
            }
        );

        return () => unsubscribe();
    }, [activeChat, user]);

    // Clear unread flag when opening a chat
    useEffect(() => {
        if (activeChat && activeChat.unreadBy === user.uid) {
            const chatRef = doc(db, 'chats', activeChat.id);
            updateDoc(chatRef, { unreadBy: deleteField() }).catch(console.error);
        }
    }, [activeChat, user]);

    // Initialize chat from URL param if present
    useEffect(() => {
        const initChat = async () => {
            const targetUserId = searchParams.get('uid');
            if (targetUserId && user) {
                try {
                    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
                    if (targetUserDoc.exists()) {
                        const targetUserData = targetUserDoc.data();
                        startChat({
                            id: targetUserId,
                            displayName: targetUserData?.displayName || 'User',
                            photoURL: targetUserData?.photoURL || ''
                        });
                    }
                } catch (err) {
                    console.error('Error initializing chat from URL:', err);
                }
            }
        };
        initChat();
    }, [searchParams, user]);

    // Fetch conversations list (real-time) with error handling
    useEffect(() => {
        if (!user) return;

        setSidebarLoading(true);
        setSidebarError(null);

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const chats = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }));
                // Sort client-side by lastMessageAt descending
                chats.sort((a, b) => {
                    const aTime = a.lastMessageAt?.toMillis?.() || 0;
                    const bTime = b.lastMessageAt?.toMillis?.() || 0;
                    return bTime - aTime;
                });
                setConversations(chats);
                setSidebarLoading(false);
                setSidebarError(null);
            },
            (error) => {
                console.error('Error fetching conversations:', error);
                setSidebarLoading(false);
                setSidebarError('Failed to load conversations. Please refresh.');
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Setup listener for active chat messages with loading & error states
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            return;
        }

        setMessagesLoading(true);
        setMessagesError(null);

        const q = query(
            collection(db, 'chats', activeChat.id, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                let msgs = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data({ serverTimestamps: 'estimate' })
                }));

                // Filter out deleted for me messages or messages before clear
                msgs = msgs.filter(msg => {
                    const clearedTimestamp = chatClearedAt;
                    const isCleared = clearedTimestamp && msg.timestamp?.toMillis() <= clearedTimestamp.toMillis();
                    const isDeletedForMe = msg.deletedFor?.includes(user.uid);
                    return !isCleared && !isDeletedForMe;
                });

                setMessages(msgs);
                setMessagesLoading(false);
                setMessagesError(null);
            },
            (error) => {
                console.error('Error fetching messages:', error);
                setMessagesLoading(false);
                setMessagesError('Failed to load messages. Please try again.');
            }
        );

        return () => unsubscribe();
    }, [activeChat, chatClearedAt, user]);

    const startChat = async (targetUser) => {
        if (!user || user.uid === targetUser.id) return;

        const participants = [user.uid, targetUser.id].sort();
        const chatId = participants.join('_');

        const existingChat = conversations.find(chat => chat.id === chatId);
        if (existingChat) {
            setActiveChat(existingChat);
            return;
        }

        // Create new chat document
        try {
            const chatRef = doc(db, 'chats', chatId);
            await setDoc(chatRef, {
                participants,
                participantDetails: {
                    [user.uid]: { displayName: user.displayName, photoURL: user.photoURL },
                    [targetUser.id]: { displayName: targetUser.displayName, photoURL: targetUser.photoURL }
                },
                lastMessageAt: serverTimestamp(),
                lastMessage: 'Start of your conversation'
            });

            setActiveChat({
                id: chatId,
                participants,
                participantDetails: {
                    [user.uid]: { displayName: user.displayName, photoURL: user.photoURL },
                    [targetUser.id]: { displayName: targetUser.displayName, photoURL: targetUser.photoURL }
                }
            });
        } catch (err) {
            console.error('Error starting chat:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const otherId = activeChat.participants.find(id => id !== user.uid);
        if (blockedUsers.includes(otherId)) return showAlert({ 
            title: 'User Blocked', 
            message: 'You must unblock this user to send messages.', 
            type: 'warning' 
        });

        const messageContent = newMessage.trim();
        setNewMessage('');

        try {
            // Add message to subcollection
            await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
                text: messageContent,
                senderId: user.uid,
                timestamp: serverTimestamp(),
                deletedFor: []
            });

            // Update chat document last message
            await setDoc(doc(db, 'chats', activeChat.id), {
                lastMessage: messageContent,
                lastMessageAt: serverTimestamp(),
                unreadBy: otherId
            }, { merge: true });
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    // Long press logic
    const handleTouchStart = (msg) => {
        if (msg.isDeletedByEveryone) return;
        longPressTimer.current = setTimeout(() => {
            setSelectedMessage(msg);
            setShowActionsModal(true);
        }, 600);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const deleteForMe = async () => {
        if (!selectedMessage || !activeChat) return;
        try {
            const msgRef = doc(db, 'chats', activeChat.id, 'messages', selectedMessage.id);
            await updateDoc(msgRef, {
                deletedFor: arrayUnion(user.uid)
            });
            setShowActionsModal(false);
            setSelectedMessage(null);
        } catch (err) {
            console.error("Error deleting for me:", err);
        }
    };

    const deleteForEveryone = async () => {
        if (!selectedMessage || !activeChat) return;
        if (selectedMessage.senderId !== user.uid) return showAlert({
            title: 'Permission Denied',
            message: 'You can only delete your own messages for everyone.',
            type: 'warning'
        });

        try {
            const msgRef = doc(db, 'chats', activeChat.id, 'messages', selectedMessage.id);
            await updateDoc(msgRef, {
                text: 'This message was deleted',
                isDeletedByEveryone: true
            });
            setShowActionsModal(false);
            setSelectedMessage(null);
        } catch (err) {
            console.error("Error deleting for everyone:", err);
        }
    };

    const clearChat = async () => {
        if (!activeChat) return;
        showConfirm({
            title: 'Clear Chat',
            message: 'Are you sure you want to clear this chat? This will hide all current messages for you.',
            confirmText: 'Clear',
            onConfirm: async () => {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, {
                        [`clearedChats.${activeChat.id}`]: serverTimestamp()
                    });
                    setShowHeaderMenu(false);
                } catch (err) {
                    console.error("Error clearing chat:", err);
                }
            }
        });
    };

    const toggleBlockUser = async () => {
        if (!activeChat) return;
        const otherId = activeChat.participants.find(id => id !== user.uid);
        const isBlocked = blockedUsers.includes(otherId);

        showConfirm({
            title: isBlocked ? 'Unblock User' : 'Block User',
            message: `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`,
            confirmText: isBlocked ? 'Unblock' : 'Block',
            onConfirm: async () => {
                try {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, {
                        blockedUsers: isBlocked ? arrayRemove(otherId) : arrayUnion(otherId)
                    });
                    setShowHeaderMenu(false);
                } catch (err) {
                    console.error("Error toggling block:", err);
                }
            }
        });
    };

    const getOtherParticipant = (chat) => {
        if (!chat || !user) return {};
        const otherId = chat.participants.find(id => id !== user.uid);
        return chat.participantDetails?.[otherId] || { displayName: 'User' };
    };

    const formatLastMessage = (text) => {
        if (!text) return '';
        return text.length > 30 ? text.substring(0, 30) + '...' : text;
    };

    return (
        <div className="chat-container">
            {/* Sidebar */}
            <div className={`chat-sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
                <div className="chat-header">
                    <h2>Messages</h2>
                </div>

                <div className="conversations-list">
                    {sidebarLoading ? (
                        <div className="empty-state-chat-loading">
                            <div className="chat-spinner"><Loader size={28} /></div>
                            <p>Loading chats...</p>
                        </div>
                    ) : sidebarError ? (
                        <div className="empty-state-chat-error">
                            <p>{sidebarError}</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="empty-state-chat">
                            <MessageSquare size={32} />
                            <p>No conversations yet</p>
                            <p className="sub-text">Visit Community to find people and start chatting!</p>
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
                </div>
            </div>

            {/* Chat Area */}
            <div className={`chat-main ${!activeChat ? 'mobile-hidden' : ''}`}>
                {activeChat ? (
                    <>
                        {/* Chat Top Bar */}
                        <div className="chat-main-header">
                            <button className="back-btn" onClick={() => setActiveChat(null)}>
                                <ChevronLeft size={24} />
                            </button>
                            <img
                                src={getOtherParticipant(activeChat).photoURL || "https://via.placeholder.com/40"}
                                alt="Other User"
                                onClick={() => navigate(`/profile/${activeChat.participants.find(id => id !== user.uid)}`)}
                                style={{ cursor: 'pointer' }}
                            />
                            <div className="chat-main-title" onClick={() => navigate(`/profile/${activeChat.participants.find(id => id !== user.uid)}`)} style={{ cursor: 'pointer' }}>
                                <h3>{getOtherParticipant(activeChat).displayName}</h3>
                                <p className={otherUserOnline ? 'status-online' : 'status-offline'}>
                                    {blockedUsers.includes(activeChat.participants.find(id => id !== user.uid)) ? 'Blocked' : (otherUserOnline ? 'Online' : 'Offline')}
                                </p>
                            </div>
                            <div className="chat-main-actions">
                                <button className="menu-btn" onClick={() => setShowHeaderMenu(!showHeaderMenu)}>
                                    <MoreVertical size={20} />
                                </button>

                                {showHeaderMenu && (
                                    <div className="header-dropdown">
                                        <button onClick={clearChat}><Trash2 size={16} /> Clear Chat</button>
                                        <button onClick={toggleBlockUser} className="danger">
                                            {blockedUsers.includes(activeChat.participants.find(id => id !== user.uid)) ? (
                                                <><ShieldCheck size={16} /> Unblock User</>
                                            ) : (
                                                <><ShieldAlert size={16} /> Block User</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="chat-messages-wrapper" onClick={() => {
                            if (showHeaderMenu) setShowHeaderMenu(false);
                            if (showActionsModal) setShowActionsModal(false);
                        }}>
                            <div className="chat-messages">
                                {messagesLoading ? (
                                    <div className="messages-loading-state">
                                        <div className="chat-spinner"><Loader size={24} /></div>
                                        <p>Loading messages...</p>
                                    </div>
                                ) : messagesError ? (
                                    <div className="messages-error-state">
                                        <p>{messagesError}</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="messages-empty-state">
                                        <p>No messages yet. Say hello! 👋</p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={`message-bubble ${msg.senderId === user.uid ? 'sent' : 'received'} ${msg.isDeletedByEveryone ? 'deleted-msg' : ''}`}
                                            onMouseDown={() => handleTouchStart(msg)}
                                            onMouseUp={handleTouchEnd}
                                            onTouchStart={() => handleTouchStart(msg)}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            <div className="message-text">
                                                {msg.isDeletedByEveryone ? <i>This message was deleted</i> : msg.text}
                                            </div>
                                            <div className="message-time">
                                                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Message Input Area */}
                        {hasBlockedMe ? (
                            <div className="blocked-input-notice">
                                <p>You have been blocked by this user. You can no longer send messages.</p>
                            </div>
                        ) : !blockedUsers.includes(activeChat.participants.find(id => id !== user.uid)) ? (
                            <form className="chat-input-container" onSubmit={handleSendMessage}>
                                <button type="button" className="input-action-btn">
                                    <ImageIcon size={20} />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                                    <Send size={20} />
                                </button>
                            </form>
                        ) : (
                            <div className="blocked-input-notice">
                                <p>You blocked this contact. Unblock to send messages.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="no-chat-content">
                            <div className="no-chat-icon">
                                <MessageSquare size={48} />
                            </div>
                            <h3>Your Messages</h3>
                            <p>Select a conversation or follow someone from the community to start chatting.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Message Actions Modal */}
            {showActionsModal && (
                <div className="msg-actions-overlay" onClick={() => setShowActionsModal(false)}>
                    <div className="msg-actions-sheet" onClick={e => e.stopPropagation()}>
                        <div className="sheet-header">
                            <h4>Message Options</h4>
                            <button onClick={() => setShowActionsModal(false)}><X size={20} /></button>
                        </div>
                        <div className="sheet-body">
                            <button onClick={deleteForMe}><Trash2 size={18} /> Delete for me</button>
                            {selectedMessage?.senderId === user.uid && (
                                <button onClick={deleteForEveryone} className="danger">
                                    <Trash2 size={18} /> Delete for everyone
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
