# Technical Summary Document - Part 4: Process Design Map

**Project/Team Name:** UnderwriterAI - Intelligent Underwriting Assistant

---

## Process Design Map

### High-Level System Architecture

```
User Login → Authentication → Role-Based Dashboard → Core Features
                                                           │
                                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE APPLICATION MODULES                    │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│  Dashboard  │ Chat System │ Documents   │     Analytics       │
│ • Actions   │ • Real-time │ • Bulk Ops  │ • Performance       │
│ • Metrics   │ • Multi-AI  │ • Upload    │ • Reports           │
│ • Activity  │ • Context   │ • Extract   │ • Trends            │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI PROCESSING LAYER                          │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│ Document AI │ Vector Store│ Rules Engine│ Analytics Engine    │
│ • Extract   │ • Embeddings│ • Matching  │ • Calculations      │
│ • Mining    │ • Search    │ • Confidence│ • Aggregation       │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA PERSISTENCE LAYER                       │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│ SQLite DB   │ File Storage│ Vector Store│ Session Management  │
│ • Users     │ • Documents │ • Embeddings│ • Chat History      │
│ • Rules     │ • Uploads   │ • Metadata  │ • WebSocket State   │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
```

### Multi-Agent AI Orchestration

**AI Provider Architecture:**
- **Anthropic Claude Sonnet 4**: Primary conversational AI for complex reasoning
- **OpenAI GPT-4**: Document processing and structured rule extraction
- **Google Gemini 2.5**: Analytics processing and pattern recognition
- **OpenRouter**: Backup provider for high availability

**Orchestration Flow:**
```
Task Request → AIService Controller → Provider Selection → Processing → Response
                     │                       │
                     ▼                       ▼
              Load Balancer            Fallback Logic
              Cost Optimizer           Error Recovery
```

### Document Processing Workflow

```
File Upload → Content Extraction → AI Analysis → Rule Mining → Vector Storage
     │              │                   │            │            │
     ▼              ▼                   ▼            ▼            ▼
Validation    PDF/Text Parse    Structured JSON   Confidence   Embeddings
Metadata      Excel Process     Rule Format       Scoring      Search Index
```

### Real-time Chat System

```
User Message → Context Retrieval → AI Provider → Response Generation → WebSocket Delivery
      │              │                  │              │                    │
      ▼              ▼                  ▼              ▼                    ▼
Chat History   Vector Search      Multi-Provider   Context-Aware      Real-time UI
Session Data   Policy Context     Load Balance     Decision Support    Notifications
```

### Decision Engine Flow

```
Underwriting Request → Rule Evaluation → Confidence Check → Decision Output
         │                    │               │                │
         ▼                    ▼               ▼                ▼
Policy Context        Business Rules    >80% = Auto      Audit Trail
Broker History        Pattern Match     <80% = AI        Compliance Log
Risk Profile          Precedent Data    High Risk = Human  Performance Track
```

### Key Integration Points

1. **Authentication Flow**: JWT → Role Check → UI Adaptation
2. **Document Pipeline**: Upload → AI Processing → Rule Extraction → Vector Storage
3. **Chat System**: Message → Context Retrieval → AI Response → Real-time Delivery
4. **Analytics Engine**: Data Collection → Processing → Visualization → Export
5. **Bulk Operations**: Selection → Validation → Batch Processing → Status Updates

### LLM Usage by Component

- **Document Processing**: OpenAI GPT-4 with structured JSON output
- **Chat Interface**: Anthropic Claude Sonnet 4 for conversational AI
- **Analytics**: Google Gemini 2.5 for pattern recognition
- **Vector Embeddings**: OpenAI text-embedding-3-small
- **Backup Operations**: OpenRouter for failover scenarios

This architecture enables scalable, intelligent underwriting operations with comprehensive document management and real-time AI assistance.
