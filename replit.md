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

- **June 24, 2025**: Complete Application Implementation with Full Functionality
  - Successfully deployed comprehensive AI underwriting application with PostgreSQL database
  - Implemented working document ingestion system with AI-powered rule extraction for multiple file types
  - Created functional chat interface with real-time WebSocket communication and file attachments
  - Built complete user settings page with profile management and preferences configuration
  - Added detailed activity tracking with filtering, search, and PDF report generation capabilities
  - Implemented full document manager with upload, processing status tracking, and download features
  - Enhanced chat history management with downloadable session exports in readable formats
  - Created comprehensive report generation system for activity logs and performance metrics
  - All navigation links and Quick Actions now connect to fully functional dedicated pages
  - Integrated real-time database persistence for all user interactions and system activities
  - Fixed WebSocket connection issues and frontend-backend communication for seamless operation

- **June 24, 2025**: Complete Database Implementation with Broker-Specific Data Storage
  - Implemented SQLite database with comprehensive schema for persistent data storage
  - Added broker-specific data tracking across all entities (chat messages, documents, decisions)
  - Enhanced analytics system with real-time event tracking and broker performance metrics
  - Implemented proper naming conventions for broker data identification and retrieval
  - Added analytics events table for tracking user interactions and system performance
  - Created broker metrics table for daily performance summaries and KPI tracking
  - Enhanced document management with metadata tracking (file size, hash, upload tracking)
  - Added comprehensive data relationships linking brokers to all their activities

## Changelog

- June 24, 2025: Initial setup and hackathon enhancements