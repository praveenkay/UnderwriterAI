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
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing
- **Migration Strategy**: Push-based migrations via `drizzle-kit`

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

1. **Broker Interaction**: Brokers initiate conversations through the chat interface
2. **Context Gathering**: System retrieves relevant policy data and chat history
3. **Decision Processing**: Rules engine evaluates requests using business rules and AI
4. **Response Generation**: AI generates contextualized responses with decision rationale
5. **Persistence**: All interactions, decisions, and outcomes are stored for audit trail
6. **Escalation**: Complex cases are flagged for human underwriter review

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

- **June 24, 2025**: Hackathon enhancement for Agentic AI Hyper Challenge
  - Enhanced document ingestion with advanced rule extraction
  - Implemented Swiss design inspired UI with clean typography and spacing
  - Added comprehensive sample data for chat logs and underwriting guidelines
  - Enhanced broker chat interface with quick action suggestions
  - Improved metrics dashboard with real-time performance indicators
  - WebSocket optimization for reduced latency broker interactions
  - Advanced rule engine with confidence scoring and escalation logic

## Changelog

- June 24, 2025: Initial setup and hackathon enhancements