# AgentVerse - AI Underwriting Assistant

## Overview

AgentVerse is an AI-powered underwriting assistant designed for Zurich Insurance's SME (Small Medium Enterprise) business insurance operations. The system enables real-time broker interactions, automated underwriting decisions, and document processing to streamline policy management, renewals, and coverage amendments.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for bundling
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live chat

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket Server for chat functionality
- **File Processing**: Multer for document uploads
- **AI Integration**: OpenAI API for intelligent decision making

### Database Design
- **Database**: SQLite with better-sqlite3 driver for local persistence
- **ORM**: Drizzle ORM with SQLite dialect
- **Schema Location**: `shared/schema.ts` for comprehensive type sharing
- **Migration Strategy**: Manual table creation with automated seeding
- **Data Structure**: Broker-centric design with proper naming conventions and relationships

## Key Components

### Chat Interface System
- Real-time broker-AI conversations via WebSocket
- Message persistence with session tracking
- Context-aware responses using policy and chat history
- Support for text, decision, and escalation message types

### Underwriting Rules Engine
- Configurable business rules stored in database
- Rule-based decision logic with AI fallback
- Confidence scoring for decision validation
- Support for multiple rule types (discount, amendment, coverage_change)

### Document Processing Pipeline
- Multi-format document support (chat logs, guidelines, policies)
- Automated rule extraction from uploaded documents
- Status tracking (pending, processing, completed, failed)
- Integration with rules engine for automated rule creation

### Policy Management
- Comprehensive policy data model with claims history
- Risk profile assessment and tracking
- Renewal date management and notifications
- Active/inactive status management

## Data Flow

1. **Broker Identification**: Each interaction is tagged with broker ID and name for proper attribution
2. **Activity Tracking**: All user actions are logged in analytics events table with timestamps and metadata
3. **Chat History Storage**: Complete conversation history stored with broker context and policy associations
4. **Document Management**: Files uploaded by brokers are tracked with original metadata and processing status
5. **Decision Recording**: All underwriting decisions linked to specific brokers with session context
6. **Performance Metrics**: Daily broker performance calculated and stored for analytics dashboard
7. **Audit Trail**: Complete data lineage maintained for compliance and performance analysis

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI component primitives
- **openai**: AI decision processing and chat responses
- **ws**: WebSocket server for real-time communication

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server code
- **vite**: Frontend development and bundling
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

- **Platform**: Replit with autoscale deployment target
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Environment**: Node.js 20 with PostgreSQL 16
- **Port Configuration**: Internal port 5000, external port 80
- **Development**: Hot reload with Vite middleware integration

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

## Recent Changes

- **June 24, 2025**: Intelligent Token Management with Automatic Model Switching
  - Implemented TokenManager service with tiktoken for accurate token counting
  - Added automatic model selection based on content size (gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo)
  - Created chunking strategy for large documents exceeding model token limits
  - Enhanced all OpenAI API calls with intelligent model switching and fallback handling
  - Fixed token limit errors (784,461 tokens -> automatic chunking with appropriate model)
  - System now automatically switches to higher-capacity models for large document processing
  - All AI providers now use optimal models based on token constraints and automatically revert to default

- **June 24, 2025**: Custom Vector Database Implementation with OpenRouter Support
  - Added OpenRouter as fourth AI provider option alongside Anthropic, OpenAI, and Gemini
  - Implemented custom vector database service replacing Langchain for better compatibility
  - Created vector store service with semantic document search and content retrieval
  - Fixed document processing pipeline to properly extract content from PDFs and text files
  - Added dedicated vector search page with real-time semantic search capabilities
  - Enhanced chat responses with vector-based context retrieval from uploaded documents
  - Implemented proper document chunking with OpenAI embeddings for semantic similarity
  - Added vector store statistics and monitoring with document source tracking
  - All document uploads now process successfully with rule extraction and vector storage
  - Chat AI now has access to full document context through vector similarity search
  - Vector search supports both semantic (with embeddings) and keyword fallback search

- **June 24, 2025**: Complete AI-Powered Feature Implementation
  - Implemented multi-AI provider support (Anthropic Claude, OpenAI GPT, Google Gemini) with dynamic switching
  - Added comprehensive file upload system with AI-powered document processing and rule extraction
  - Created functional PDF report generation for chat histories, broker performance, and document libraries
  - Implemented working navigation links connecting all dashboard components to dedicated pages
  - Added user profile management with AI chat settings and preferences storage
  - Enhanced chat interface with file attachment support and AI document analysis
  - Created document library with upload, processing status tracking, and downloadable reports
  - Added activity details page with comprehensive performance metrics and export functionality
  - Integrated PostgreSQL database with proper schema migration and data persistence
  - All features now fully functional with real data storage, AI processing, and interactive workflows

- **June 24, 2025**: Interactive Features Implementation
  - Added comprehensive notification system with real-time alerts and status tracking
  - Implemented detailed user profile panel with broker credentials and contact information
  - Created chat history management with session tracking and export functionality
  - Added chat settings panel with AI behavior configuration and privacy controls
  - Enhanced Quick Actions with functional export, escalation, and report generation
  - Implemented dynamic performance analytics with time period selection (7/30/90 days)
  - Added interactive document upload with file management and status tracking
  - Enhanced attachment functionality in chat interface with file selection
  - All interactive elements now properly linked with navigation and functional handlers

## Changelog

- June 24, 2025: Initial setup and hackathon enhancements