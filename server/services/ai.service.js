const { GoogleGenerativeAI } = require("@google/generative-ai");
const { documents } = require("./embedding.service");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Generate chat response using Gemini
const generateChatResponse = async (query, relevantChunks, mode = 'normal') => {
  try {
    // Prepare context from relevant chunks
    const context = relevantChunks
      .map(chunk => chunk.content)
      .join('\n\n');

    let systemPrompt;
    
    // Adjust prompt based on the mode
    switch (mode) {
      case 'eli5':
        systemPrompt = `You are EmbedIQ, an AI assistant that answers questions based ONLY on the provided context. 
        The user is asking about content from their uploaded PDFs. 
        Explain your answer as if you're explaining to a 5-year-old, using simple language and concepts.
        If the context doesn't contain the answer, say you don't know based on the available information.
        
        Context from uploaded documents:
        ${context}
        
        Remember to keep your explanation very simple, as if for a young child.`;
        break;
        
      case 'compare':
        // For compare mode, we need to group chunks by document
        const documentGroups = {};
        relevantChunks.forEach(chunk => {
          const id = chunk.documentId;
          if (!documentGroups[id]) {
            documentGroups[id] = [];
          }
          documentGroups[id].push(chunk.content);
        });
        
        // Format context with document identifiers
        let compareContext = '';
        for (const [docId, chunks] of Object.entries(documentGroups)) {
          compareContext += `DOCUMENT: ${docId}\n${chunks.join('\n')}\n\n`;
        }
        
        systemPrompt = `You are EmbedIQ, an AI assistant that compares information from multiple documents.
        The user is asking you to compare content from their uploaded PDFs.
        Answer ONLY based on the provided context and highlight similarities and differences between documents.
        If a specific comparison can't be made from the context, say so clearly.
        
        Context from uploaded documents:
        ${compareContext}`;
        break;
        
      default: // normal mode
        systemPrompt = `You are EmbedIQ, an AI assistant that answers questions based ONLY on the provided context.
        The user is asking about content from their uploaded PDFs.
        Answer the question using ONLY information from the provided context.
        If the context doesn't contain the answer, say you don't know based on the available information.
        Don't make up information or use external knowledge.
        
        Context from uploaded documents:
        ${context}`;
    }
    
    // Create chat and get response
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hi, I'm looking for information from my documents." }],
        },
        {
          role: "model",
          parts: [{ text: "Hello! I'm EmbedIQ, and I can help you find information from your uploaded documents. What would you like to know?" }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    
    // Send message with system prompt and user query
    const result = await chat.sendMessage(`${systemPrompt}\n\nUser question: ${query}`);
    return result.response.text();
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
};

module.exports = {
  generateChatResponse
}; 