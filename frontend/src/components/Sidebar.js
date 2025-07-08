import React, { useState, useEffect } from 'react';
import { FaFile, FaTrash, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import '../styles/Sidebar.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Sidebar = ({ onDocumentSelect, selectedDocuments }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all uploaded documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/files`);
      setDocuments(response.data.files);
      setError('');
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (document) => {
    if (selectedDocuments.some(doc => doc.filename === document.filename)) {
      // If already selected, remove from selection
      onDocumentSelect(selectedDocuments.filter(doc => doc.filename !== document.filename));
    } else {
      // If not selected, add to selection
      onDocumentSelect([...selectedDocuments, document]);
    }
  };

  const isSelected = (document) => {
    return selectedDocuments.some(doc => doc.filename === document.filename);
  };

  const handleDragStart = (e, document) => {
    e.dataTransfer.setData('document', JSON.stringify(document));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Knowledge Base</h3>
        <p className="document-count">{documents.length} documents</p>
      </div>

      {isLoading ? (
        <div className="sidebar-loading">Loading documents...</div>
      ) : error ? (
        <div className="sidebar-error">{error}</div>
      ) : (
        <div className="document-list">
          {documents.length === 0 ? (
            <div className="no-documents">
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            documents.map((doc, index) => (
              <div 
                key={index} 
                className={`document-item ${isSelected(doc) ? 'selected' : ''}`}
                onClick={() => handleDocumentSelect(doc)}
                draggable
                onDragStart={(e) => handleDragStart(e, doc)}
              >
                <div className="document-icon">
                  <FaFile />
                  {isSelected(doc) && <div className="selected-indicator"><FaCheck /></div>}
                </div>
                <div className="document-info">
                  <div className="document-name">{doc.filename}</div>
                  <div className="document-size">{(doc.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar; 