const { generateChatResponse } = require('../services/ai.service');
const { queryVectorStore } = require('../services/embedding.service');

// In-memory chat history storage (for demo purposes)
// In a production app, this would be stored in a database
const chatHistory = {};

// Send a message to the AI and get a response
const sendMessage = async (req, res) => {
  try {
    const { message, sessionId, mode, files } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize chat history for this session if it doesn't exist
    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [];
    }

    // Get relevant document chunks from the vector store
    const relevantChunks = await queryVectorStore(message, files);

    if (!relevantChunks || relevantChunks.length === 0) {
      return res.status(404).json({ 
        error: 'No relevant information found in the uploaded documents' 
      });
    }

    // Generate AI response using relevant chunks and current mode
    const aiResponse = await generateChatResponse(message, relevantChunks, mode);
    
    // Save to chat history
    const chatItem = {
      user: message,
      bot: aiResponse,
      timestamp: new Date(),
      mode: mode || 'normal'
    };
    
    chatHistory[sessionId].push(chatItem);

    // Return the response
    return res.status(200).json({
      response: aiResponse,
      history: chatHistory[sessionId]
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
};

// Get chat history for a session
const getChatHistory = (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const history = chatHistory[sessionId] || [];

    return res.status(200).json({ history });
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return res.status(500).json({ error: 'Failed to retrieve chat history', details: error.message });
  }
};

module.exports = {
  sendMessage,
  getChatHistory
}; 