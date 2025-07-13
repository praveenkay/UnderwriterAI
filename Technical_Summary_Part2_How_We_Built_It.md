# Technical Summary Document - Part 2: How We Built It

**Project/Team Name:** UnderwriterAI - Intelligent Underwriting Assistant

---

## How did you build it?

### Agent Interaction Architecture

**Orchestration Model**: The system employs a **hybrid orchestration approach** combining centralized coordination with autonomous agent capabilities.

#### Central Orchestrator
- **AIService Class**: Manages provider selection and task routing
- **Dynamic Load Balancing**: Intelligent provider switching based on task complexity and token requirements
- **Fallback Mechanisms**: Automatic failover between AI providers for high availability

#### Agent Interaction Patterns
1. **Sequential Processing**: Document ingestion flows through multiple specialized agents
   ```
   Upload → Content Extraction → AI Analysis → Rule Extraction → Vector Embedding → Storage
   ```

2. **Parallel Execution**: Multiple chat sessions run simultaneously with different AI providers
3. **Collaborative Processing**: Agents work together for complex workflows
4. **Context Sharing**: All agents access shared vector database and rule repository

### Data Sources & Knowledge Base

#### Primary Data Sources
**Proprietary Insurance Documents:**
- Underwriting guidelines and policy templates
- Claims procedures and risk assessment criteria
- Regulatory compliance documents
- Historical policy data and precedent decisions

**Real-time Operational Data:**
- Broker chat interactions and decision requests
- Document upload and processing status
- Performance metrics and escalation patterns

#### Knowledge Base Architecture
**SQLite Database (15+ interconnected tables):**
- Users, brokers, policies, claims history
- Chat messages, decisions, escalations
- Rules, documents, analytics events

**Vector Store (Custom Implementation):**
- OpenAI text-embedding-3-small model for embeddings
- Document chunking with 1000-character segments and 200-character overlap
- Cosine similarity search with 0.1 minimum threshold

### Technologies & Frameworks Used

#### Frontend Stack
**React 18 + TypeScript:**
- Component-based architecture with strict type safety
- Functional components with hooks for state management

**UI Framework:**
- **shadcn/ui + Radix UI**: Accessible component library
- **Tailwind CSS**: Utility-first styling with custom theming
- **Framer Motion**: Smooth animations and transitions

**State Management:**
- **TanStack Query**: Server state management with caching
- **React Context**: Global state for authentication
- **Local Storage**: Persistent user settings

#### Backend Infrastructure
**Node.js + Express:**
- RESTful API server with TypeScript
- Middleware for authentication, logging, and error handling

**Database Layer:**
- **SQLite + better-sqlite3**: High-performance local database
- **Drizzle ORM**: Type-safe database operations
- **Migration System**: Version-controlled schema changes

**Real-time Communication:**
- **WebSocket Server**: Custom implementation using 'ws' library
- **Session Management**: Persistent connections with user context

#### AI Integration & Processing
**Multi-Provider AI Architecture:**
- **Anthropic Claude Sonnet 4**: Primary conversational AI
- **OpenAI GPT-4**: Document processing with structured outputs
- **Google Gemini 2.5**: Analytics and pattern recognition
- **OpenRouter**: Backup provider for high availability

**Token Management:**
- **Dynamic Model Selection**: Automatic model switching based on content size
- **Chunking Strategy**: Intelligent content segmentation for large documents
- **Cost Optimization**: Provider selection based on task requirements

#### Vector Database Implementation
**Custom Vector Store Service:**
- Built from scratch for insurance domain requirements
- OpenAI embeddings with semantic similarity search
- Metadata filtering and source attribution
- Fallback keyword search when embeddings unavailable

---

**Next:** Part 3 will cover "How do you control and evaluate it?" including monitoring, limitations, and risk management.
