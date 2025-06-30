const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { processDocument } = require('../services/embedding.service');

// Upload files, extract text and create embeddings
const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      // Read the PDF and extract text
      const pdfPath = file.path;
      const dataBuffer = fs.readFileSync(pdfPath);
      
      try {
        const pdfData = await pdfParse(dataBuffer);
        const text = pdfData.text;
        
        // Process document - create embeddings and store in vector DB
        const documentId = await processDocument(file.filename, text);
        
        uploadedFiles.push({
          id: documentId,
          filename: file.originalname,
          storedFilename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          extractedTextLength: text.length,
          uploadDate: new Date()
        });
      } catch (pdfError) {
        console.error(`Error processing PDF ${file.originalname}:`, pdfError);
        return res.status(422).json({ 
          error: `Failed to process PDF: ${file.originalname}`, 
          details: pdfError.message 
        });
      }
    }

    // Return success with file details
    return res.status(200).json({
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'File upload failed', details: error.message });
  }
};

// Get list of all uploaded files
const getFiles = (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.endsWith('.pdf'))
      .map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          filename: file,
          path: `/uploads/${file}`,
          size: stats.size,
          uploadDate: stats.mtime
        };
      });

    res.status(200).json({ files });
  } catch (error) {
    console.error('Error getting file list:', error);
    return res.status(500).json({ error: 'Failed to retrieve files', details: error.message });
  }
};

// Delete a file
const deleteFile = (req, res) => {
  try {
    const { fileId } = req.params;
    const filePath = path.join(__dirname, '../uploads', fileId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    
    // TODO: Also remove from vector database

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
};

module.exports = {
  uploadFiles,
  getFiles,
  deleteFile
}; 