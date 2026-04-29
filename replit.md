# UnderwriterAI - Intelligent Underwriting Assistant

## Overview

UnderwriterAI is a comprehensive multi-agent AI system designed for Small Medium Enterprise (SME) business insurance operations. This system automates underwriting processes, provides real-time broker support, and centralizes knowledge management through intelligent document processing and decision-making capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React 18 with TypeScript, Vite for bundling
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, React Context for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live chat functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: SQLite with Drizzle ORM for data persistence
- **Authentication**: JWT-based with role-based access control
- **File Processing**: Multer for uploads with support for PDF, Excel, and text files

### Multi-Agent AI System
- **Primary Providers**: 
  - Anthropic Claude Sonnet 4 (conversational agent)
  - OpenAI GPT-4 (document processing specialist)
  - Google Gemini 2.5 (analytics and pattern recognition)
  - OpenRouter (backup provider)
- **Orchestration**: Hybrid approach with centralized coordination and autonomous capabilities
- **Failover**: Automatic provider switching for high availability

## Key Components

### 1. Authentication & Authorization
- **Multi-role system**: Admin users, Standard users, external brokers
- **Role-based UI**: Dynamic interface adaptation based on user permissions
- **Security**: JWT tokens with session management

### 2. Document Management System
- **Bulk Operations**: Multi-select functionality with role-based permissions
- **AI Processing**: Automatic rule extraction from various file formats
- **Vector Storage**: Custom implementation using OpenAI embeddings for semantic search
- **Status Tracking**: Real-time processing status with error recovery

### 3. Chat System
- **Real-time Communication**: WebSocket-powered chat with AI agents
- **Context Awareness**: AI leverages policy data and document context
- **Multi-provider Support**: Intelligent routing between AI providers
- **File Attachments**: Upload and analyze documents within chat

### 4. Rules Engine
- **Hybrid Decision Logic**: Rule-based processing with AI fallback
- **Confidence Scoring**: Automatic escalation when confidence < 80%
- **Rule Extraction**: AI-powered mining of underwriting rules from documents
- **Dynamic Routing**: Task-based provider selection

### 5. Analytics & Reporting
- **Performance Dashboards**: Broker performance tracking with time-based views
- **Decision Metrics**: Automation rates, response times, confidence scores
- **PDF Generation**: Exportable reports for chat history and analytics
- **Real-time Monitoring**: Live activity feeds and system health metrics

## Data Flow

### Document Processing Flow
```
Upload → Validation → AI Processing → Rule Extraction → Vector Storage → Database Update
```

### Chat System Flow
```
User Message → Context Retrieval → AI Provider Selection → Response Generation → Real-time Delivery
```

### Decision Engine Flow
```
Request → Rule Evaluation → Confidence Check → AI Fallback (if needed) → Decision → Audit Trail
```

## External Dependencies

### AI Services
- **Anthropic Claude**: Primary conversational AI
- **OpenAI GPT-4**: Document processing and embeddings
- **Google Gemini**: Analytics processing
- **OpenRouter**: Backup AI provider

### Core Dependencies
- **Database**: SQLite with Drizzle ORM
- **File Processing**: ExcelJS for spreadsheet processing
- **PDF Generation**: PDFKit for report generation
- **WebSocket**: Native WebSocket for real-time communication
- **Authentication**: JWT for session management

### Development Tools
- **Build System**: Vite for frontend bundling
- **Type Safety**: TypeScript across the entire stack
- **Code Quality**: ESLint and Prettier integration
- **Package Management**: npm with lock file for reproducible builds

## Deployment Strategy

### Database Strategy
- **Primary**: SQLite for development and small-scale deployment
- **Migration Ready**: Drizzle ORM supports migration to PostgreSQL for production scaling
- **Schema Management**: Versioned migrations with rollback capabilities

### Environment Configuration
- **Development**: Local SQLite with hot reloading
- **Production**: Configurable database URL with environment variables
- **Scaling**: Architecture supports horizontal scaling with external database

### File Storage
- **Current**: Local file system for document uploads
- **Future**: Configurable for cloud storage (S3, Azure Blob, etc.)
- **Processing**: Chunked processing for large files with progress tracking

### Performance Considerations
- **Token Management**: Intelligent chunking and model selection for cost optimization
- **Caching**: Query caching with React Query for improved response times
- **Vector Search**: Optimized embedding storage and retrieval
- **Connection Pooling**: Database connection management for concurrent requests

The system is designed to handle 75% of routine underwriting decisions automatically while providing intelligent assistance for complex cases, with comprehensive audit trails and performance monitoring throughout.