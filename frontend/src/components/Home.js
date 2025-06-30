import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaSpinner, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';
import '../styles/Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Filter for PDF files only
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      setError('Only PDF files are allowed');
    } else {
      setError('');
    }
    
    setFiles(pdfFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_URL}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setUploadedFiles(response.data.files);
      setFiles([]);
      
      // After successful upload, wait 2 seconds then redirect to chat
      setTimeout(() => {
        navigate('/chat');
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.error || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">
          Welcome to EmbedIQ
        </h1>
        <p className="home-subtitle">
          Upload PDFs and chat with an AI that answers based on your documents
        </p>
      </div>

      <div className="upload-card">
        <div className="upload-card-header">
          <h2 className="upload-title">
            Upload Your Documents
          </h2>
          <p className="upload-subtitle">
            Upload PDF documents (manuals, books, notes) and ask questions about them
          </p>
        </div>

        <div className={`dropzone ${error ? 'error' : ''}`}>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={uploading}
            style={{ display: 'none' }}
          />
          
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="dropzone-content">
              <FaCloudUploadAlt className="dropzone-icon" />
              <p className="dropzone-text">
                Drag and drop PDFs here, or click to browse
              </p>
              <p className="dropzone-subtext">
                (Only PDF files are accepted)
              </p>
            </div>
          </label>

          {error && (
            <p className="error-message">{error}</p>
          )}
        </div>

        {files.length > 0 && (
          <div className="file-list">
            <h3 className="file-list-header">Selected files:</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index} className="file-item">
                  <FaFileAlt className="file-icon" />
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="progress-text">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className={`upload-button ${files.length === 0 || uploading ? 'disabled' : 'primary'}`}
        >
          {uploading ? (
            <>
              <FaSpinner className="upload-button-icon spinner" />
              Uploading...
            </>
          ) : (
            'Upload and Process PDFs'
          )}
        </button>

        {uploadedFiles.length > 0 && (
          <div className="success-message">
            <p className="success-title">
              {uploadedFiles.length} file(s) uploaded successfully!
            </p>
            <p className="success-redirect">
              Redirecting to chat...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 