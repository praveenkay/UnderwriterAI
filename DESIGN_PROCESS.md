# UnderwriterAI - Design Process & Architecture

## 🎯 System Overview

UnderwriterAI is a comprehensive AI-powered underwriting assistant with multi-agent architecture, real-time processing, and intelligent document management.

## 🏗️ End-to-End Architecture Flow

```
User Login → Authentication → Role-Based UI → Main Application
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN APPLICATION FLOW                       │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│  Dashboard  │ Chat System │ Documents   │     Analytics       │
│ • Actions   │ • Real-time │ • Bulk Ops  │ • Performance       │
│ • Metrics   │ • Multi-AI  │ • Upload    │ • Reports           │
│ • Activity  │ • Context   │ • Extract   │ • Trends            │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA PROCESSING LAYER                        │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│ Document AI │ Vector Store│ Rules Engine│ Analytics Engine    │
│ • Extract   │ • Embeddings│ • Matching  │ • Calculations      │
│ • Mining    │ • Search    │ • Confidence│ • Aggregation       │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STORAGE & PERSISTENCE                        │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│ SQLite DB   │ File Storage│ Vector Store│ Session Store       │
│ • Users     │ • Documents │ • Embeddings│ • Chat History      │
│ • Rules     │ • Uploads   │ • Metadata  │ • WebSocket State   │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
```

## 🔄 Key Process Flows

### Document Processing
```
Upload → Validation → AI Processing → Rule Extraction → Vector Storage → UI Update
```

### Chat System
```
Message → Context Retrieval → AI Provider → Response → Real-time Delivery
```

### Bulk Operations
```
Selection → Validation → Role Check → Batch Process → Status Update → UI Refresh
```

## 🧠 AI Integration

- **Multi-Provider**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Context Management**: Vector embeddings, chat history, rule context
- **Dynamic Selection**: Task-based AI provider routing

## 🔐 Security & Roles

- **Zurich Admin**: Full system access, immediate delete permissions
- **External Broker**: Limited access, delete request workflow
- **JWT Authentication**: Role-based UI adaptation and API access

## 📊 Key Features Implemented

1. **Bulk Document Operations**: Multi-select with role-based delete system
2. **Real-time Processing**: WebSocket updates with optimized polling
3. **Vector Search**: Semantic document search with embeddings
4. **Analytics Dashboard**: Performance metrics with export functionality
5. **Multi-AI Chat**: Provider switching with context awareness
6. **Rules Engine**: AI-powered rule extraction and validation

## 🚀 Performance Optimizations

- **Smart Polling**: Conditional API calls (5-second intervals when needed)
- **Caching Strategy**: 30-second stale time for reduced server load
- **Bulk Operations**: Efficient batch processing with transaction safety
- **Vector Storage**: Optimized embeddings for fast semantic search

This architecture enables scalable, intelligent underwriting operations with comprehensive document management and real-time AI assistance.
