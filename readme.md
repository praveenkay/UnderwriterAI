# UnderwriterAI - Intelligent Underwriting Assistant

## Overview

UnderwriterAI is a comprehensive AI-powered underwriting assistant designed for Zurich Insurance's SME (Small Medium Enterprise) business insurance operations. The system provides real-time broker interactions, automated underwriting decisions, intelligent document processing, and advanced analytics to streamline policy management, renewals, and coverage amendments.

## 🚀 Key Features

### 1. **Multi-Role Authentication System**
- **Zurich Admin Users**: Full system access with administrative privileges
- **External Brokers**: Limited access to chat and broker-specific features
- **Role-based UI**: Dynamic interface adaptation based on user permissions
- **Secure Authentication**: JWT-based authentication with role validation

### 2. **Intelligent Chat Interface**
- **Real-time AI Conversations**: WebSocket-powered chat with multiple AI providers
- **Multi-AI Provider Support**: Anthropic Claude, OpenAI GPT-4, Google Gemini with dynamic switching
- **Context-Aware Responses**: AI leverages policy data, chat history, and document context
- **File Attachment Support**: Upload and analyze documents directly in chat
- **Message Types**: Support for text, decisions, escalations, and system notifications
- **Chat History Management**: Persistent conversation storage with session tracking

### 3. **Advanced Document Management**
- **Bulk Document Operations**: Select all/individual documents with bulk delete functionality
- **Role-Based Delete Permissions**: Admins can delete immediately, users submit delete requests
- **Multi-Format Support**: PDF, TXT, Excel files with intelligent content extraction
- **Real-time Processing Status**: Live progress tracking with detailed status indicators
- **Document Library**: Comprehensive file management with download and preview capabilities
- **Rule Extraction**: AI-powered extraction of underwriting rules from documents
- **Vector Search Integration**: Semantic document search with embedding-based retrieval

### 4. **Comprehensive Analytics Dashboard**
- **Performance Metrics**: Broker performance tracking with time-based analytics
- **Interactive Charts**: Dynamic visualizations with 7/30/90-day period selection
- **Activity Monitoring**: Real-time activity feed with detailed event tracking
- **Export Functionality**: PDF report generation for performance and document libraries
- **Escalation Tracking**: Monitor and analyze escalation patterns and resolution times

### 5. **Rules Management System**
- **Dynamic Rule Engine**: Configurable business rules with confidence scoring
- **Rule Types**: Support for discounts, amendments, coverage changes, and custom rules
- **AI-Powered Rule Extraction**: Automatic rule discovery from uploaded documents
- **Rule Validation**: Confidence scoring and manual review capabilities
- **Rule Application**: Automated decision-making based on configured rules

### 6. **Vector-Powered Search**
- **Semantic Search**: OpenAI embedding-based document search
- **Real-time Results**: Instant search with relevance scoring
- **Document Context**: Search across all uploaded documents and extracted content
- **Keyword Fallback**: Traditional keyword search when semantic search is unavailable
- **Source Tracking**: Clear attribution of search results to source documents

### 7. **User Profile Management**
- **Broker Credentials**: Comprehensive profile information and contact details
- **AI Chat Settings**: Customizable AI behavior and response preferences
- **Privacy Controls**: User-configurable privacy and data handling settings
- **Notification Preferences**: Customizable alert and notification settings

### 8. **Notification System**
- **Real-time Alerts**: WebSocket-powered instant notifications
- **Status Tracking**: Document processing, chat updates, and system alerts
- **Categorized Notifications**: Different types for documents, chats, escalations, and system events
- **Notification History**: Persistent notification storage with read/unread status

### 9. **Quick Actions Panel**
- **Export Functions**: Generate reports for chat histories and performance data
- **Escalation Management**: Quick escalation creation and tracking
- **Report Generation**: Automated PDF generation for various data types
- **Bulk Operations**: Streamlined workflows for common administrative tasks

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
- **Database**: SQLite with better-sqlite3 driver for local persistence (converted from PostgreSQL)
- **ORM**: Drizzle ORM with SQLite dialect
- **Schema Location**: `shared/schema.ts` for comprehensive type sharing
- **Migration Strategy**: Manual table creation with automated seeding via init-sqlite.ts
- **Data Structure**: Broker-centric design with proper naming conventions and relationships
- **Storage**: DatabaseStorage class with SQLite-compatible data handling for timestamps and JSON fields

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

## 🏗️ Design Process Map

### End-to-End Architecture Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Login    │───▶│ Authentication  │───▶│ Role-Based UI   │
│                 │    │   & JWT Token   │    │   Rendering     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAIN APPLICATION FLOW                            │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│   Dashboard     │   Chat System   │   Documents     │    Analytics        │
│                 │                 │                 │                     │
│ • Quick Actions │ • Real-time AI  │ • Bulk Select   │ • Performance       │
│ • Metrics Cards │ • Multi-Provider│ • Upload/Process│ • Time-based Views  │
│ • Activity Feed │ • File Attach   │ • Rule Extract  │ • Export Reports    │
│ • Notifications │ • Context-Aware │ • Vector Search │ • Escalation Track  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA PROCESSING LAYER                             │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│   Document AI   │   Vector Store  │   Rules Engine  │   Analytics Engine  │
│                 │                 │                 │                     │
│ • PDF Extract   │ • Embeddings    │ • Rule Matching │ • Performance Calc  │
│ • Rule Mining   │ • Semantic      │ • Confidence    │ • Trend Analysis    │
│ • Status Track  │ • Search        │ • Auto-Apply   │ • Report Generation │
│ • Bulk Ops      │ • Context Ret   │ • Validation    │ • Data Aggregation  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STORAGE & PERSISTENCE                            │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│   SQLite DB     │   File Storage  │   Vector Store  │   Session Store     │
│                 │                 │                 │                     │
│ • User Data     │ • Documents     │ • Embeddings    │ • Chat History      │
│ • Chat History  │ • Uploads       │ • Chunks        │ • WebSocket State   │
│ • Rules         │ • Reports       │ • Metadata      │ • User Sessions     │
│ • Analytics     │ • Exports       │ • Search Index  │ • Notifications     │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────┘
```

### Component Interaction Flow

```
User Action ──▶ Frontend Component ──▶ API Route ──▶ Service Layer ──▶ Database
     │                   │                 │              │              │
     │                   │                 │              │              │
     ▼                   ▼                 ▼              ▼              ▼
WebSocket ──▶ Real-time Updates ──▶ Event Handler ──▶ State Update ──▶ UI Refresh
     │                   │                 │              │              │
     │                   │                 │              │              │
     ▼                   ▼                 ▼              ▼              ▼
AI Provider ──▶ Context Retrieval ──▶ Vector Search ──▶ Response Gen ──▶ Chat UI
```

### Data Flow Architecture

1. **Input Layer**: User interactions, file uploads, chat messages
2. **Processing Layer**: AI analysis, rule extraction, vector embedding
3. **Storage Layer**: SQLite database, file system, vector store
4. **Output Layer**: UI updates, notifications, reports, real-time responses

### Key Integration Points

- **Authentication Flow**: JWT → Role Check → UI Adaptation
- **Document Pipeline**: Upload → AI Processing → Rule Extraction → Vector Storage
- **Chat System**: Message → Context Retrieval → AI Response → Real-time Delivery
- **Analytics Engine**: Data Collection → Processing → Visualization → Export
- **Bulk Operations**: Selection → Validation → Batch Processing → Status Updates

## Changelog

## Recent Changes

- **July 13, 2025**: Advanced Document Management with Bulk Operations
  - Implemented comprehensive bulk select functionality for document library
  - Added individual and "select all" checkbox controls with dynamic selection counting
  - Created role-based bulk delete system (admin immediate delete vs user delete requests)
  - Implemented bulk actions toolbar that appears/disappears based on selection state
  - Added bulk delete confirmation dialogs with proper error handling
  - Optimized API polling to reduce server load (5-second intervals, conditional polling)
  - Enhanced document library with improved performance and user experience
  - Fixed excessive API polling issue that was causing terminal spam
  - Added proper caching (30-second stale time) to reduce redundant requests
  - Implemented smart polling that only occurs when processing documents exist

- **June 25, 2025**: Complete Database Migration from PostgreSQL to SQLite
  - Successfully converted all database schemas from PostgreSQL to SQLite syntax
  - Updated database driver from @neondatabase/serverless to better-sqlite3
  - Created manual table initialization script (init-sqlite.ts) to work around locked drizzle config
  - Modified DatabaseStorage class to handle SQLite data types (timestamps as integers, JSON as text)
  - Implemented proper data transformation for Date objects and JSON serialization
  - Local SQLite database (data.db) now fully functional with sample data
  - All features working: chat system, document ingestion, analytics, and underwriting rules
  - Database is now portable and doesn't require external database services

- **June 24, 2025**: Comprehensive Document Ingestion Interface with Enhanced Processing
  - Renamed "Data Ingestion" to "Document Ingestion" and consolidated with existing documents functionality
  - Created tabbed interface combining upload, processing status, and document library management
  - Removed document upload section from dashboard to centralize all document operations
  - Enhanced document library with download capabilities, rule viewing, and comprehensive file management
  - Implemented real-time processing status monitoring with progress indicators and error reporting
  - Added aggressive chunking strategy for extremely large documents (1.3M+ tokens) with enhanced TokenManager
  - Integrated Excel file processing support and fallback processing for data exports and spreadsheets
  - System now provides complete document lifecycle management from upload to analysis completion

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
