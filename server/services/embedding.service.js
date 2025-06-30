const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Document } = require("langchain/document");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// In-memory document storage (replace with ChromaDB in production)
const documents = {};

// In-memory vector store (replace with ChromaDB/FAISS in production)
let vectorStore = new MemoryVectorStore();

// Text chunking function
const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    // If we're not at the start, include overlap from previous chunk
    const start = i === 0 ? 0 : i - overlap;
    const end = Math.min(start + chunkSize, text.length);
    
    chunks.push({
      text: text.slice(start, end),
      index: chunks.length,
      start,
      end
    });
    
    i = end;
  }
  
  return chunks;
};

// Process document: chunk, embed, and store
const processDocument = async (documentId, text) => {
  try {
    // Store the full text for reference
    documents[documentId] = { fullText: text, chunks: [] };
    
    // Chunk the text
    const chunks = chunkText(text);
    
    // Create embeddings for each chunk and store in vector DB
    for (const chunk of chunks) {
      // Generate embedding using Gemini embeddings
      const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await embeddingModel.embedContent(chunk.text);
      const embedding = result.embedding.values;
      
      // Create a document with metadata
      const doc = new Document({
        pageContent: chunk.text,
        metadata: {
          documentId,
          chunkIndex: chunk.index,
          start: chunk.start,
          end: chunk.end
        }
      });
      
      // Store in vector store
      await vectorStore.addVectors([embedding], [doc]);
      
      // Store in document chunks (for reference)
      documents[documentId].chunks.push({
        ...chunk,
        embedding
      });
    }
    
    console.log(`Document ${documentId} processed: ${chunks.length} chunks created`);
    return documentId;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

// Query vector store for relevant chunks
const queryVectorStore = async (query, specificDocuments = []) => {
  try {
    // Generate query embedding
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding.values;
    
    // Search in vector store
    const searchResults = await vectorStore.similaritySearchVectorWithScore(
      queryEmbedding,
      5 // Top 5 results
    );
    
    // Filter by specific documents if requested
    let filteredResults = searchResults;
    if (specificDocuments && specificDocuments.length > 0) {
      filteredResults = searchResults.filter(([doc, _]) => 
        specificDocuments.includes(doc.metadata.documentId)
      );
    }
    
    // Format results
    const relevantChunks = filteredResults.map(([doc, score]) => ({
      content: doc.pageContent,
      documentId: doc.metadata.documentId,
      score,
      metadata: doc.metadata
    }));
    
    return relevantChunks;
  } catch (error) {
    console.error('Error querying vector store:', error);
    throw error;
  }
};

module.exports = {
  processDocument,
  queryVectorStore,
  documents
}; 