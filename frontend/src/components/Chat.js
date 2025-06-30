import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSpinner, FaRobot, FaUserAlt, FaFileUpload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Chat.css';

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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [mode, setMode] = useState(MODES.NORMAL);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  
  // Initialize chat session
  useEffect(() => {
    // Generate a random session ID if not exist
    if (!sessionId) {
      const newSessionId = 'session_' + Math.random().toString(36).substring(2, 10);
      setSessionId(newSessionId);
    }
    
    // Fetch uploaded files
    fetchUploadedFiles();
  }, [sessionId]);
  
  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // Fetch list of uploaded files
  const fetchUploadedFiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/files`);
      setUploadedFiles(response.data.files);
      
      // If no files, redirect to home
      if (response.data.files.length === 0) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load uploaded documents');
    }
  };
  
  const handleSendMessage = async () => {
    if (message.trim() === '') return;
    if (isLoading) return;
    
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
      const selectedFiles = uploadedFiles.map(file => file.filename);
      
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
  
  const renderChatBubble = (msg, index) => {
    const isUser = msg.type === 'user';
    const isError = msg.type === 'error';
    
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
        {!isUser && (
          <div className={avatarClass}>
            <FaRobot className="message-avatar-icon" />
          </div>
        )}
        
        <div className={contentClass}>
          {msg.content}
          <div className="message-timestamp">
            {new Date(msg.timestamp).toLocaleTimeString()}
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
        
        {/* Files info */}
        {uploadedFiles.length > 0 && (
          <div className="files-info">
            <span className="files-info-bold">Using {uploadedFiles.length} files: </span>
            {uploadedFiles.map((file, idx) => (
              <span key={idx}>
                {file.filename}
                {idx < uploadedFiles.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
        
        {/* Chat Messages */}
        <div className="chat-messages">
          {chatHistory.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-content">
                <FaRobot className="chat-empty-icon" />
                <h3 className="chat-empty-title">Hi, I'm EmbedIQ!</h3>
                <p>Ask me anything about your uploaded documents</p>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, index) => renderChatBubble(msg, index))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Error display */}
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
        
        {/* Chat Input */}
        <div className="chat-input-area">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your documents..."
            className="chat-textarea"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || message.trim() === ''}
            className={`send-button ${isLoading || message.trim() === '' ? 'disabled' : 'active'}`}
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
  );
};

export default Chat; 