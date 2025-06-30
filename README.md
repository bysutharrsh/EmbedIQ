# EmbedIQ – Personalized AI from Uploaded PDFs

EmbedIQ is a web application that allows users to upload PDF documents and chat with an AI that answers questions based solely on the content of those documents.

## Features

- 📤 **File Upload**: Upload one or more PDF files for the AI to learn from
- 🧠 **Smart AI Chat**: Ask questions about your documents using Gemini Pro AI
- 💬 **Interactive Chat**: Clean and intuitive chat interface
- 🎛️ **Different Modes**: Normal mode, ELI5 (Explain Like I'm 5), and Compare mode
- 🧩 **Multi-File Support**: Ask questions across multiple documents

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React, Tailwind CSS
- **PDF Processing**: pdf-parse
- **AI**: Google Gemini Pro via @google/generative-ai
- **Vector Database**: In-memory vector store (can be replaced with Chroma/FAISS)

## Getting Started

### Prerequisites

- Node.js (v16+)
- Google Gemini API key

### Installation

1. Clone the repository
```
git clone <repository-url>
cd EmbedIQ
```

2. Install backend dependencies
```
cd server
npm install
```

3. Create a .env file in the server directory
```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

4. Install frontend dependencies
```
cd ../client
npm install
```

### Running the Application

1. Start the backend server
```
cd server
npm run dev
```

2. In a new terminal, start the frontend
```
cd client
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. On the home page, upload one or more PDF files
2. After upload, you will be redirected to the chat page
3. Ask questions about the content in your PDFs
4. Toggle between different modes:
   - **Normal**: Standard answers
   - **ELI5**: Simplified explanations
   - **Compare**: Compare information across documents

## Notes

- For production use, you should replace the in-memory vector store with a persistent option like ChromaDB or FAISS
- Consider adding user authentication for a multi-user environment
- The Gemini API key should be kept confidential and not committed to version control 