import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSpinner, FaRobot, FaUserAlt, FaFileUpload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Chat.css';
import Sidebar from './Sidebar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Chat modes
const MODES = {
  NORMAL: 'normal',
  ELI5: 'eli5',
  COMPARE: 'compare'
};

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [mode, setMode] = useState(MODES.NORMAL);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [knowledgeBaseReady, setKnowledgeBaseReady] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);
  
  // Initialize chat session
  useEffect(() => {
    // Generate a random session ID if not exist
    if (!sessionId) {
      const newSessionId = 'session_' + Math.random().toString(36).substring(2, 10);
      setSessionId(newSessionId);
    }
  }, [sessionId]);
  
  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // Auto-switch to compare mode when multiple documents selected
  useEffect(() => {
    if (selectedDocuments.length > 1 && mode !== MODES.COMPARE) {
      setMode(MODES.COMPARE);
    }
  }, [selectedDocuments, mode]);
  
  // Show knowledge base ready message when documents are selected
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      setKnowledgeBaseReady(true);
      
      // Add system message about knowledge base being ready
      const systemMessage = {
        type: 'system',
        content: `Your knowledge base is ready with ${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''}`,
        timestamp: new Date()
      };
      
      // Only add the message if it doesn't already exist (to prevent duplicates)
      const hasSystemMessage = chatHistory.some(msg => 
        msg.type === 'system' && 
        msg.content.startsWith('Your knowledge base is ready')
      );
      
      if (!hasSystemMessage) {
        setChatHistory(prev => [...prev, systemMessage]);
      }
    }
  }, [selectedDocuments]);
  
  const handleSendMessage = async () => {
    if (message.trim() === '') return;
    if (isLoading) return;
    if (selectedDocuments.length === 0) {
      setError('Please select at least one document first');
      return;
    }
    
    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError('');
    
    try {
      // Get file IDs for selected files
      const selectedFiles = selectedDocuments.map(file => file.filename);
      
      // Send message to API
      const response = await axios.post(`${API_URL}/chat/message`, {
        message: userMessage.content,
        sessionId,
        mode,
        files: selectedFiles
      });
      
      // Add AI response to chat
      const botMessage = {
        type: 'bot',
        content: response.data.response,
        timestamp: new Date(),
        mode: mode
      };
      
      setChatHistory(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.error || 'Failed to get a response');
      
      // Add error message to chat
      const errorMessage = {
        type: 'error',
        content: error.response?.data?.error || 'Sorry, I could not process your request',
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleModeChange = (newMode) => {
    setMode(newMode);
  };
  
  const handleDocumentSelect = (docs) => {
    setSelectedDocuments(docs);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    try {
      const documentData = e.dataTransfer.getData('document');
      if (documentData) {
        const document = JSON.parse(documentData);
        if (!selectedDocuments.some(doc => doc.filename === document.filename)) {
          setSelectedDocuments([...selectedDocuments, document]);
        }
      }
    } catch (err) {
      console.error('Error handling dropped document:', err);
    }
  };
  
  const renderChatBubble = (msg, index) => {
    const isUser = msg.type === 'user';
    const isError = msg.type === 'error';
    const isSystem = msg.type === 'system';
    
    // Determine classes based on message type
    let bubbleClass = 'message-bubble';
    let contentClass = 'message-content';
    let avatarClass = 'message-avatar';
    
    if (isUser) {
      bubbleClass += ' user';
      contentClass += ' user';
      avatarClass += ' user';
    } else if (isError) {
      contentClass += ' error';
      avatarClass += ' bot';
    } else if (isSystem) {
      bubbleClass += ' system';
      contentClass += ' system';
    } else {
      // AI message
      bubbleClass += ' bot';
      avatarClass += ' bot';
      
      if (msg.mode === MODES.ELI5) {
        contentClass += ' bot-eli5';
      } else if (msg.mode === MODES.COMPARE) {
        contentClass += ' bot-compare';
      } else {
        contentClass += ' bot';
      }
    }
    
    return (
      <div key={index} className={bubbleClass}>
        {!isUser && !isSystem && (
          <div className={avatarClass}>
            <FaRobot className="message-avatar-icon" />
          </div>
        )}
        
        <div className={contentClass}>
          {msg.content}
          <div className="message-timestamp">
            {!isSystem && new Date(msg.timestamp).toLocaleTimeString()}
            {msg.mode && msg.mode !== MODES.NORMAL && (
              <span className="message-mode">
                ({msg.mode === MODES.ELI5 ? 'Simple Explanation' : 'Compare Mode'})
              </span>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className={avatarClass}>
            <FaUserAlt className="message-avatar-icon" />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="chat-container">
      <Sidebar 
        onDocumentSelect={handleDocumentSelect}
        selectedDocuments={selectedDocuments}
      />
      
      <div className="chat-main">
        <div className="chat-card">
          {/* Chat Header */}
          <div className="chat-header">
            <h2 className="chat-title">
              Chat with EmbedIQ
            </h2>
            
            <div className="chat-controls">
              <span className="mode-label">Mode:</span>
              <div className="mode-buttons">
                <button 
                  onClick={() => handleModeChange(MODES.NORMAL)}
                  className={`mode-button ${mode === MODES.NORMAL ? 'active' : 'inactive'}`}
                >
                  Normal
                </button>
                <button 
                  onClick={() => handleModeChange(MODES.ELI5)}
                  className={`mode-button ${mode === MODES.ELI5 ? 'active' : 'inactive'}`}
                >
                  ELI5
                </button>
                <button 
                  onClick={() => handleModeChange(MODES.COMPARE)}
                  className={`mode-button ${mode === MODES.COMPARE ? 'active' : 'inactive'}`}
                  disabled={selectedDocuments.length <= 1}
                >
                  Compare
                </button>
              </div>
              
              <button 
                onClick={() => navigate('/')}
                className="upload-button"
              >
                <FaFileUpload className="upload-button-icon" />
                Upload
              </button>
            </div>
          </div>
          
          {/* Selected Documents Info */}
          {selectedDocuments.length > 0 && (
            <div className="files-info">
              <span className="files-info-bold">Using {selectedDocuments.length} files: </span>
              {selectedDocuments.map((file, idx) => (
                <span key={idx}>
                  {file.filename}
                  {idx < selectedDocuments.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
          
          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}
          
          {/* Chat Messages */}
          <div 
            className={`chat-messages ${isDragging ? 'drag-active' : ''}`}
            ref={chatAreaRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {chatHistory.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-content">
                  <FaRobot className="chat-empty-icon" />
                  <h3 className="chat-empty-title">Hi, I'm EmbedIQ!</h3>
                  <p>Select documents from the sidebar or drag them here to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {chatHistory.map((msg, idx) => renderChatBubble(msg, idx))}
                {isDragging && (
                  <div className="drop-indicator">
                    Drop document here to add to knowledge base
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          {/* Chat Input */}
          <div className="chat-input-area">
            <textarea
              className="chat-textarea"
              placeholder="Ask a question about your documents..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || selectedDocuments.length === 0}
            />
            <button
              className={`send-button ${message.trim() && !isLoading ? 'active' : 'disabled'}`}
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading || selectedDocuments.length === 0}
            >
              {isLoading ? (
                <FaSpinner className="spinner" />
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 