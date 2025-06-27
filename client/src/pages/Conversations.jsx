// client/src/pages/Conversations.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import AISummaryDisplay from '../components/ai/AISummaryDisplay';
import CreateConversationModal from '../components/CreateConversationModal'; 
import Swal from 'sweetalert2';

const Conversations = () => {
    const { conversationId: urlConversationId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null); 
    const lastMessageIdRef = useRef(null);

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState(null);


    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [showSummary, setShowSummary] = useState(false); 
    const [summaryStale, setSummaryStale] = useState(false);
    const [summaryLastGeneratedAt, setSummaryLastGeneratedAt] = useState(null);

    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user'));

    
    const fetchConversations = async () => {
        try {
            setLoadingConversations(true);
            const res = await API.get('/conversations');
            setConversations(res.data);

           
            if (urlConversationId) {
                const conversationToSelect = res.data.find(conv => conv._id === urlConversationId);
                if (conversationToSelect) {
                    setSelectedConversation(conversationToSelect);
                } else {
                    navigate('/dashboard/conversations', { replace: true });
                }
            } else if (res.data.length > 0) {
                 setSelectedConversation(res.data[0]);
                 navigate(`/dashboard/conversations/${res.data[0]._id}`, { replace: true });
            } else {
                setSelectedConversation(null); 
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError('Failed to load conversations.');
            if (err.response && err.response.status === 401) {
                localStorage.clear();
                navigate('/login');
            }
        } finally {
            setLoadingConversations(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [urlConversationId, navigate]);
    useEffect(() => {
        const fetchMessagesForConversation = async () => {
            if (selectedConversation) {
                setLoadingMessages(true);
                setError(null);
                try {
                    const res = await API.get(`/conversations/${selectedConversation._id}`);
                    setMessages(res.data.messages);
                    setSummary(res.data.conversation.aiSummary || null);
                    setSummaryLastGeneratedAt(res.data.conversation.aiSummaryGeneratedAt || null);
                    const needsUpdate = res.data.conversation.aiSummaryNeedsUpdate || false;
                    setSummaryStale(needsUpdate);
                    setShowSummary(!!res.data.conversation.aiSummary && !needsUpdate); 

                } catch (err) {
                    console.error('Error fetching messages for conversation:', err);
                    setError('Failed to load messages for this conversation.');
                    setMessages([]);
                } finally {
                    setLoadingMessages(false);
                }
            } else {
                setMessages([]);
                setSummary(null);
                setShowSummary(false);
            }
        };
        fetchMessagesForConversation();
    }, [selectedConversation]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

   
    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg._id !== lastMessageIdRef.current && lastMsg.sender && lastMsg.sender._id !== currentUser?._id) {
                lastMessageIdRef.current = lastMsg._id;
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'info',
                    title: `New message from ${lastMsg.sender.name || 'Someone'}`,
                    text: lastMsg.content ? lastMsg.content.slice(0, 80) : '',
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true,
                    background: '#f0f9ff',
                    color: '#1e293b',
                    customClass: { popup: 'swal2-border-radius' }
                });
            }
        }
    }, [messages, currentUser]);

    

    const handleConversationSelect = (conversation) => {
        setSelectedConversation(conversation);
        navigate(`/dashboard/conversations/${conversation._id}`);
        setNewMessageContent('');
       
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
    
        if (!newMessageContent.trim()) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Please type a message.' });
            return;
        }
        if (!selectedConversation) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Please select a conversation.' });
            return;
        }
    
        setSendingMessage(true);
    
        try {
            const messageResponse = await API.post('/messages', {
                conversationId: selectedConversation._id,
                content: newMessageContent.trim()
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
    
            setMessages(prevMessages => [...prevMessages, messageResponse.data]); 
            setNewMessageContent('');
    
            
            setConversations(prevConvs => prevConvs.map(conv =>
                conv._id === selectedConversation._id
                    ? { ...conv, updatedAt: new Date().toISOString(), aiSummaryNeedsUpdate: true, aiSummary: null }
                    : conv
            ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    
            setSelectedConversation(prevConv => ({
                ...prevConv,
                updatedAt: new Date().toISOString(),
                aiSummaryNeedsUpdate: true,
                aiSummary: null
            }));
            setSummary(null);
            setShowSummary(false);
            setSummaryStale(true);
    
        } catch (err) {
            console.error('Error sending message:', err);
            if (err.response) {
                console.error('Server response data:', err.response.data);
                console.error('Server response status:', err.response.status);
            }
            setError('Failed to send message. ' + (err.response?.data?.message || err.message));
        } finally {
            setSendingMessage(false);
        }
    };

    const handleSummarizeConversation = async () => {
        if (!selectedConversation) return;

        
        if (showSummary && !summaryStale) {
            setShowSummary(false);
            return;
        }
        
        setLoadingSummary(true);
        setSummary(null); 
        setError(null); 
        try {
            const response = await API.post('/ai/chat/summarize', {
                conversationId: selectedConversation._id
            });
            const generatedSummary = response.data.summary;
            setSummary(generatedSummary);
            setShowSummary(true); 
            setSummaryStale(false);
            setSummaryLastGeneratedAt(new Date());

            
            setConversations(prevConvs => prevConvs.map(conv =>
                conv._id === selectedConversation._id
                    ? { ...conv, aiSummary: generatedSummary, aiSummaryGeneratedAt: new Date(), aiSummaryNeedsUpdate: false }
                    : conv
            ));
            setSelectedConversation(prevConv => ({
                ...prevConv,
                aiSummary: generatedSummary,
                aiSummaryGeneratedAt: new Date(),
                aiSummaryNeedsUpdate: false
            }));

        } catch (err) {
            console.error('Error summarizing conversation:', err);
            setError('Failed to generate summary. Please try again later.'); 
            setSummary(null);
            setShowSummary(false); 
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleNewConversationCreated = (newConversation) => {
        setConversations(prevConvs => [newConversation, ...prevConvs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        setSelectedConversation(newConversation);
        navigate(`/dashboard/conversations/${newConversation._id}`); 
        setShowSummary(false); 
    };

    
    return (
        <div style={{
            ...styles.container,
            minHeight: '100vh',
        }}>
           
            <div style={{
                ...styles.conversationListContainer,
            }}>
                <h3 style={styles.listTitle}>Your Conversations</h3>
                {loadingConversations ? (
                    <p style={styles.loadingText}>Loading conversations...</p>
                ) : error ? (
                    <p style={styles.errorText}>{error}</p>
                ) : conversations.length === 0 ? (
                    <p style={styles.emptyText}>No conversations yet.</p>
                ) : (
                    <div style={styles.conversationsScroll}>
                        {conversations.map(conv => (
                            <div
                                key={conv._id}
                                style={{
                                    ...styles.conversationCard,
                                    ...(selectedConversation?._id === conv._id ? styles.selectedConversationCard : {})
                                }}
                                onClick={() => handleConversationSelect(conv)}
                            >
                                <h4 style={styles.conversationSubject}>{conv.subject || 'No Subject'}</h4>
                                <p style={styles.conversationParticipants}>
                                    {conv.participants
                                        .filter(p => p._id !== currentUser?._id)
                                        .map(p => p.name) 
                                        .join(', ') || 'You'}
                                </p>
                                <p style={styles.conversationDate}>
                                    Last activity: {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                <button
                    onClick={() => setIsCreateModalOpen(true)} 
                    style={styles.newConversationButton}
                >
                    + New Conversation
                </button>
            </div>

            
            <div style={{
                ...styles.messageThreadContainer,
            }}>
                {!selectedConversation ? (
                    <div style={styles.noConversationSelected}>
                        <p>Select a conversation from the left to view messages.</p>
                        <p>Or start a new one!</p>
                    </div>
                ) : (
                    <>
                        <h2 style={styles.threadHeader}>
                            {selectedConversation.subject || 'Conversation'}
                        </h2>
                        <p style={styles.threadParticipants}>
                            Participants: {selectedConversation.participants
                                .map(p => p.name) 
                                .join(', ')}
                        </p>

                        
                        <div style={styles.summarySection}>
                            {messages.length > 1 && ( 
                                <button
                                    onClick={handleSummarizeConversation}
                                    disabled={loadingSummary}
                                    style={{
                                        ...styles.summarizeButton,
                                        ...(summaryStale ? styles.staleSummarizeButton : {})
                                    }}
                                >
                                    {loadingSummary ? 'Generating Summary...' : (
                                        showSummary && !summaryStale ? 'Hide Summary' : (summaryStale ? 'Regenerate Summary' : 'Summarize Conversation')
                                    )}
                                </button>
                            )}
                            
                            {showSummary && (summary || loadingSummary) && (
                                <AISummaryDisplay
                                    summary={summary}
                                    onClose={() => setShowSummary(false)} 
                                    isStale={summaryStale}
                                    lastGeneratedAt={summaryLastGeneratedAt}
                                />
                            )}
                            {loadingSummary && <p style={styles.loadingText}>AI is thinking...</p>}
                            {error && <p style={styles.errorText}>{error}</p>} 
                        </div>

                        
                        <div style={{
                            ...styles.messagesList,
                        }}>
                            {loadingMessages ? (
                                <p style={styles.loadingText}>Loading messages...</p>
                            ) : messages.length === 0 ? (
                                <p style={styles.emptyText}>No messages yet. Start the conversation!</p>
                            ) : (
                                messages.map(msg => (
                                    console.log('*** Message being RENDERED:', msg._id, msg.content, msg.attachments),
                                    <div
                                        key={msg._id}
                                        style={{
                                            ...styles.messageBubble,
                                            ...(msg.sender && msg.sender._id === currentUser?._id ? styles.myMessage : styles.otherMessage),
                                        }}
                                    >
                                        <p style={styles.messageSender}>
                                            
                                            {msg.sender?.name || 'Unknown'}
                                        </p>
                                        {msg.content && msg.content.trim() !== '' && <p style={styles.messageContent}>{msg.content}</p>}

                                        <p style={styles.messageTimestamp}>
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input Form */}
                        <form onSubmit={handleSendMessage} style={styles.messageForm}>
                            <textarea
                                value={newMessageContent}
                                onChange={(e) => setNewMessageContent(e.target.value)}
                                placeholder="Type your message..."
                                rows="3"
                                style={styles.messageInput}
                                disabled={sendingMessage}
                            ></textarea>

                            <button
                                type="submit"
                                style={{
                                    ...styles.sendMessageButton,
                                    opacity: sendingMessage ? 0.7 : 1,
                                    cursor: sendingMessage ? 'not-allowed' : 'pointer'
                                }}
                                disabled={sendingMessage || (!newMessageContent.trim())}
                            >
                                {sendingMessage ? 'Sending Message...' : 'Send Message'}
                            </button>
                        </form>
                    </>
                )}
            </div>

            
            <CreateConversationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateSuccess={handleNewConversationCreated}
            />
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        marginLeft: '220px',
        height: '100vh',
        background: '#f0f4ff',
        boxSizing: 'border-box',
        overflow: 'hidden',
    },
    conversationListContainer: {
        width: '300px',
        backgroundColor: '#fff',
        borderRight: '1px solid #e2e8f0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        overflowY: 'auto',
    },
    listTitle: {
        fontSize: '20px',
        color: '#1e293b',
        marginBottom: '20px',
        fontWeight: '600',
    },
    conversationsScroll: {
        flexGrow: 1,
        overflowY: 'auto',
        marginBottom: '20px',
    },
    conversationCard: {
        padding: '15px',
        marginBottom: '10px',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        '&:hover': {
            backgroundColor: '#eef2ff',
            borderColor: '#c3dafe',
        },
    },
    selectedConversationCard: {
        backgroundColor: '#e0e7ff',
        borderColor: '#4f46e5',
        boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)',
    },
    conversationSubject: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1e293b',
        margin: '0 0 5px 0',
    },
    conversationParticipants: {
        fontSize: '13px',
        color: '#64748b',
        margin: '0 0 5px 0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    conversationDate: {
        fontSize: '11px',
        color: '#94a3b8',
        textAlign: 'right',
    },
    staleSummaryBadge: { // This style is no longer directly used for the badge but kept for reference
        position: 'absolute',
        top: '8px',
        right: '8px',
        backgroundColor: '#f97316',
        color: 'white',
        padding: '3px 7px',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: 'bold',
    },
    newConversationButton: {
        padding: '10px 15px',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        marginTop: '10px',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: '#4338ca',
        },
    },
    messageThreadContainer: {
        flexGrow: 1,
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
    },
    noConversationSelected: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#64748b',
        fontSize: '18px',
        textAlign: 'center',
    },
    threadHeader: {
        fontSize: '24px',
        color: '#1e293b',
        marginBottom: '5px',
    },
    threadParticipants: {
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '20px',
    },
    summarySection: {
        backgroundColor: '#eef2ff',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #c3dafe',
    },
    summarizeButton: {
        padding: '8px 15px',
        backgroundColor: '#22c55e', // Default green
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 'bold',
        marginBottom: '10px',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: '#16a34a',
        },
        '&:disabled': {
            backgroundColor: '#a7f3d0',
            cursor: 'not-allowed',
        }
    },
    staleSummarizeButton: { // New style for stale summary button
        backgroundColor: '#f97316', // Orange
        '&:hover': {
            backgroundColor: '#ea580c',
        }
    },
    messagesList: {
        flexGrow: 1,
        overflowY: 'auto',
        paddingRight: '15px',
        marginBottom: '20px',
    },
    messageBubble: {
        maxWidth: '70%',
        padding: '12px 18px',
        borderRadius: '20px',
        marginBottom: '10px',
        position: 'relative',
    },
    myMessage: {
        backgroundColor: '#4f46e5',
        color: 'white',
        alignSelf: 'flex-end',
        marginLeft: 'auto',
        borderBottomRightRadius: '5px',
    },
    otherMessage: {
        backgroundColor: '#e2e8f0',
        color: '#1e293b',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: '5px',
    },
    messageSender: {
        fontSize: '12px',
        fontWeight: 'bold',
        marginBottom: '5px',
        opacity: 0.8,
        color: 'inherit',
    },
    messageContent: {
        fontSize: '15px',
        margin: '0',
        lineHeight: '1.4',
        wordWrap: 'break-word',
    },
    messageTimestamp: {
        fontSize: '10px',
        marginTop: '8px',
        textAlign: 'right',
        opacity: 0.6,
        color: 'inherit',
    },
    messageForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0',
    },
    messageInput: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
        resize: 'vertical',
        minHeight: '60px',
        '&:focus': {
            borderColor: '#4f46e5',
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
        },
    },
    sendMessageButton: {
        padding: '12px 20px',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: '#4338ca',
        },
        '&:disabled': {
            backgroundColor: '#a5b4fc',
            cursor: 'not-allowed',
        }
    },
    loadingText: {
        color: '#64748b',
        textAlign: 'center',
        padding: '20px',
    },
    errorText: {
        color: '#dc2626',
        textAlign: 'center',
        padding: '20px',
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        padding: '20px',
    },
};

export default Conversations;
