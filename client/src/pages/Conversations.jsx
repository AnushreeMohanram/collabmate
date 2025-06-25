// client/src/pages/Conversations.jsx
import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import AISummaryDisplay from '../components/ai/AISummaryDisplay';
import CreateConversationModal from '../components/CreateConversationModal'; // Import the new modal component

const Conversations = () => {
    const { conversationId: urlConversationId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null); // Ref for the file input

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState(null);

    // AI Summary states
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [showSummary, setShowSummary] = useState(false); // Default to false
    const [summaryStale, setSummaryStale] = useState(false);
    const [summaryLastGeneratedAt, setSummaryLastGeneratedAt] = useState(null);

    // New state for modal visibility
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // NEW STATE FOR FILE ATTACHMENTS
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploadingFile, setIsUploadingFile] = useState(false); // To indicate only file is uploading

    const currentUser = JSON.parse(localStorage.getItem('user'));

    // --- Fetch Conversations List ---
    const fetchConversations = async () => {
        try {
            setLoadingConversations(true);
            const res = await API.get('/conversations');
            setConversations(res.data);

            // If a conversation ID is in the URL, try to select and load it
            if (urlConversationId) {
                const conversationToSelect = res.data.find(conv => conv._id === urlConversationId);
                if (conversationToSelect) {
                    setSelectedConversation(conversationToSelect);
                } else {
                    // If URL ID not found (e.g., user not participant), clear URL
                    navigate('/dashboard/conversations', { replace: true });
                }
            } else if (res.data.length > 0) {
                 // If no URL ID and conversations exist, select the most recent one
                 setSelectedConversation(res.data[0]);
                 navigate(`/dashboard/conversations/${res.data[0]._id}`, { replace: true });
            } else {
                setSelectedConversation(null); // No conversations to select
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError('Failed to load conversations.');
            // Optionally handle unauthorized/expired token by logging out or redirecting
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

    // --- Fetch Messages for Selected Conversation ---
    useEffect(() => {
        const fetchMessagesForConversation = async () => {
            if (selectedConversation) {
                setLoadingMessages(true);
                setError(null);
                try {
                    const res = await API.get(`/conversations/${selectedConversation._id}`);
                    setMessages(res.data.messages);
                    // Set summary states from fetched data
                    setSummary(res.data.conversation.aiSummary || null);
                    setSummaryLastGeneratedAt(res.data.conversation.aiSummaryGeneratedAt || null);
                    const needsUpdate = res.data.conversation.aiSummaryNeedsUpdate || false;
                    setSummaryStale(needsUpdate);
                    
                    // --- MODIFIED: Show summary if it exists and is NOT stale ---
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

    // --- Scroll to bottom of messages ---
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // --- Handlers ---

    const handleConversationSelect = (conversation) => {
        setSelectedConversation(conversation);
        navigate(`/dashboard/conversations/${conversation._id}`);
        setNewMessageContent('');
        clearFileSelection(); // Clear selected file when changing conversations
        // --- REMOVED: setShowSummary(false) from here. Let useEffect handle initial state based on fetched data. ---
    };

    // --- NEW FILE HANDLING FUNCTIONS ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', file);
            console.log('File type (mimetype property):', file.type);
            console.log('File size:', file.size);

            const allowedMimeTypes = [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf',
                'text/plain',
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/zip', 'application/x-rar-compressed',
                'video/mp4', 'video/quicktime', 'video/x-msvideo',
                'audio/mpeg', 'audio/wav'
            ];
            const maxSize = 25 * 1024 * 1024; // 25MB, matches backend Multer limit

            if (!allowedMimeTypes.includes(file.type)) {
                alert('Unsupported file type. Please upload a common image, document, video, audio, or archive (max 25MB).');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
                return;
            }
            if (file.size > maxSize) {
                alert('File size exceeds 25MB limit.');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
                return;
            }
            setSelectedFile(file);
        }
    };

    const clearFileSelection = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the file input element itself
        }
    };


    const handleSendMessage = async (e) => {
        e.preventDefault();
    
        if (!newMessageContent.trim() && !selectedFile) {
            alert('Please type a message or select a file to send.');
            return;
        }
        if (!selectedConversation) {
            alert('Please select a conversation.');
            return;
        }
    
        setSendingMessage(true);
        setIsUploadingFile(false);
    
        try {
            // Prepare FormData for the message, including text content and files
            const messageFormData = new FormData();
            messageFormData.append('conversationId', selectedConversation._id);
            messageFormData.append('content', newMessageContent.trim());
            
            if (selectedFile) {
                messageFormData.append('attachments', selectedFile); // Append the file directly
            }
            
            const messageResponse = await API.post('/messages', messageFormData, { // POST to /messages (unified endpoint)
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for FormData
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
    
            setMessages(prevMessages => [...prevMessages, messageResponse.data]); 
            setNewMessageContent('');
            clearFileSelection();
    
            // Update conversation list and summary staleness
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
            setShowSummary(false); // Ensure summary is hidden after sending a new message (as it's stale)
            setSummaryStale(true);
    
        } catch (err) {
            console.error('Error sending message or uploading file:', err);
            if (err.response) {
                console.error('Server response data:', err.response.data);
                console.error('Server response status:', err.response.status);
            }
            setError('Failed to send message or upload file. ' + (err.response?.data?.message || err.message));
            if (selectedFile) {
                clearFileSelection();
            }
        } finally {
            setSendingMessage(false);
            setIsUploadingFile(false);
        }
    };

    const handleSummarizeConversation = async () => {
        if (!selectedConversation) return;

        // If summary is currently shown and not stale, hide it (toggle behavior)
        if (showSummary && !summaryStale) {
            setShowSummary(false);
            return;
        }
        // If summary is hidden, or stale, try to generate/show it
        setLoadingSummary(true);
        setSummary(null); // Clear previous summary while generating
        setError(null); // Clear potential previous errors
        try {
            const response = await API.post('/ai/chat/summarize', {
                conversationId: selectedConversation._id
            });
            const generatedSummary = response.data.summary;
            setSummary(generatedSummary);
            setShowSummary(true); // Show the summary once generated
            setSummaryStale(false);
            setSummaryLastGeneratedAt(new Date());

            // Update conversation state in local list and selectedConversation
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
            setError('Failed to generate summary. Please try again later.'); // Set error state
            setSummary(null);
            setShowSummary(false); // Hide summary if generation fails
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleNewConversationCreated = (newConversation) => {
        // Add the new conversation to the list and select it
        setConversations(prevConvs => [newConversation, ...prevConvs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        setSelectedConversation(newConversation);
        navigate(`/dashboard/conversations/${newConversation._id}`); // Navigate to the new conversation
        setShowSummary(false); // Ensure summary is hidden when a new conversation is created
    };

    // --- UI Rendering ---
    return (
        <div style={styles.container}>
            {/* Left Sidebar: Conversation List */}
            <div style={styles.conversationListContainer}>
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
                                    {/* This maps participant names for the conversation list */}
                                    {conv.participants
                                        .filter(p => p._id !== currentUser?._id)
                                        .map(p => p.name) // Use p.name directly here as well
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
                    onClick={() => setIsCreateModalOpen(true)} // Open the modal
                    style={styles.newConversationButton}
                >
                    + New Conversation
                </button>
            </div>

            {/* Right Panel: Message Thread & Input */}
            <div style={styles.messageThreadContainer}>
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
                                .map(p => p.name) // Use p.name directly here as well
                                .join(', ')}
                        </p>

                        {/* AI Summary Section */}
                        <div style={styles.summarySection}>
                            {messages.length > 1 && ( // Show summarize button if there are enough messages
                                <button
                                    onClick={handleSummarizeConversation}
                                    disabled={loadingSummary}
                                    style={{
                                        ...styles.summarizeButton,
                                        // Apply orange style if summary is stale
                                        ...(summaryStale ? styles.staleSummarizeButton : {})
                                    }}
                                >
                                    {loadingSummary ? 'Generating Summary...' : (
                                        // Change button text based on showSummary state
                                        showSummary && !summaryStale ? 'Hide Summary' : (summaryStale ? 'Regenerate Summary' : 'Summarize Conversation')
                                    )}
                                </button>
                            )}
                            {/* Only show AISummaryDisplay if showSummary is true and there's summary content */}
                            {showSummary && (summary || loadingSummary) && (
                                <AISummaryDisplay
                                    summary={summary}
                                    onClose={() => setShowSummary(false)} // This closes the summary when clicked
                                    isStale={summaryStale}
                                    lastGeneratedAt={summaryLastGeneratedAt}
                                />
                            )}
                            {loadingSummary && <p style={styles.loadingText}>AI is thinking...</p>}
                            {error && <p style={styles.errorText}>{error}</p>} {/* Display general error */}
                        </div>

                        {/* Message List */}
                        <div style={styles.messagesList}>
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
                                            // Check if sender exists and matches current user
                                            ...(msg.sender && msg.sender._id === currentUser?._id ? styles.myMessage : styles.otherMessage)
                                        }}
                                    >
                                        <p style={styles.messageSender}>
                                            {/* Corrected: Access msg.sender.name directly */}
                                            {msg.sender?.name || 'Unknown'}
                                        </p>
                                        {/* Display message content only if present */}
                                        {msg.content && msg.content.trim() !== '' && <p style={styles.messageContent}>{msg.content}</p>}

                                        {/* NEW: Display Attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div style={styles.attachmentsContainer}>
                                                {msg.attachments.map((attachment, index) => (
                                                    <div key={index} style={styles.attachmentItem}>
                                                        {attachment.mimetype.startsWith('image/') ? (
                                                            <img
                                                                src={`${process.env.REACT_APP_API_BASE_URL}${attachment.filePath}`}
                                                                alt={attachment.originalName}
                                                                style={styles.attachedImage}
                                                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/CCCCCC/FFFFFF?text=Image+Error"; }} // Fallback image on error
                                                                onClick={() => window.open(`${process.env.REACT_APP_API_BASE_URL}${attachment.filePath}`, '_blank')} // Open in new tab
                                                            />
                                                        ) : (
                                                            <a
                                                                href={`${process.env.REACT_APP_API_BASE_URL}${attachment.filePath}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download={attachment.originalName}
                                                                style={styles.attachmentLink}
                                                            >
                                                                📄 {attachment.originalName} ({
                                                                    (attachment.size / (1024 * 1024)).toFixed(2)
                                                                } MB)
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

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
                                disabled={sendingMessage || isUploadingFile}
                            ></textarea>

                            <div style={styles.fileInputContainer}>
                                {/* Hidden file input */}
                                <input
                                    type="file"
                                    id="file-upload-conversation"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                    disabled={sendingMessage || isUploadingFile}
                                />
                                {/* Custom label/button to trigger file input */}
                                <label
                                    htmlFor="file-upload-conversation"
                                    style={styles.attachButton}
                                >
                                    📎 Attach File
                                </label>
                                {selectedFile && (
                                    <span style={styles.selectedFileName}>
                                        {selectedFile.name}
                                        <button type="button" onClick={clearFileSelection} style={styles.clearFileButton}>
                                            &times;
                                        </button>
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                style={{
                                    ...styles.sendMessageButton,
                                    opacity: (sendingMessage || isUploadingFile) ? 0.7 : 1,
                                    cursor: (sendingMessage || isUploadingFile) ? 'not-allowed' : 'pointer'
                                }}
                                disabled={sendingMessage || isUploadingFile || (!newMessageContent.trim() && !selectedFile)}
                            >
                                {isUploadingFile ? 'Uploading File...' : (sendingMessage ? 'Sending Message...' : 'Send Message')}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Create Conversation Modal */}
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
    // NEW FILE ATTACHMENT STYLES
    fileInputContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '5px',
    },
    attachButton: {
        padding: '8px 12px',
        backgroundColor: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: '#4b5563',
        },
    },
    selectedFileName: {
        fontSize: '13px',
        color: '#475569',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#e2e8f0',
        padding: '5px 10px',
        borderRadius: '5px',
    },
    clearFileButton: {
        background: 'none',
        border: 'none',
        color: '#64748b',
        fontSize: '16px',
        marginLeft: '8px',
        cursor: 'pointer',
        '&:hover': {
            color: '#ef4444',
        }
    },
    attachmentsContainer: {
        marginTop: '10px',
        marginBottom: '5px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    attachmentItem: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    attachedImage: {
        maxWidth: '100%',
        maxHeight: '150px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    attachmentLink: {
        color: 'inherit',
        textDecoration: 'underline',
        fontWeight: 'bold',
        fontSize: '14px',
        wordBreak: 'break-all',
    }
};

export default Conversations;
