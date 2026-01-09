# Dev Productivity Suite - Chrome Extension + Next.js

A Chrome Extension (Manifest V3) with developer tools, learning utilities, productivity features, and an integrated GitHub RAG agent powered by Next.js.

## 🎉 New: Integrated GitHub Agent

The GitHub agent is now built into this Next.js application - no separate backend needed!

## 🏗️ Architecture

- **Next.js App**: Web interface and API routes (`pages/`)
- **GitHub Agent API**: Integrated API routes (`pages/api/github/`)
- **Chrome Extension**: Browser extension (`src/`, `manifest.json`)
- **Shared Services**: Core functionality (`lib/services/`)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` with your credentials:

```env
# Groq Configuration (for LLM)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

# Pinecone Configuration (for vector storage)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=github-client

# GitHub Token (optional - can also be set in UI)
GITHUB_TOKEN=your_github_token
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and go to **Settings** to configure your GitHub token in the UI.

### 4. Build Chrome Extension

```bash
npm run build:extension
```

Then load the `dist` folder in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## 📦 Features

### GitHub Agent (NEW!)
- ✅ **Semantic Code Search** - RAG-based code understanding
- ✅ **Issues Integration** - Query issues, assignees, and bugs
- ✅ **Smart Context** - Combines code + issues for better answers
- ✅ **Natural Language** - Ask questions in plain English

### Developer Tools
- ✅ **Clear Cache** - Background-only cache clearing
- ✅ **Edit Cookie** - Floating panel to view/edit/delete cookies
- ✅ **Check SEO** - Basic SEO analysis overlay
- ✅ **Font Finder** - Hover to see font details
- ✅ **Color Finder** - Click to copy color values
- ✅ **GitHub Agent** - Semantic code search and RAG-based Q&A

### Learning Tools
- ✅ **Ad Blocker** - Declarative Net Request API
- ✅ **Speed Improver** - Defer images, lightweight UI

### Productivity Tools
- ✅ **Focus Mode** - Hide distractions, dim page
- ✅ **Focus Detection** - Detect mobile phone usage via webcam
- ✅ **Nuclear Mode** - Block all sites except whitelisted ones
- ✅ **Passive Watching Detector** - Inactivity detection
- ✅ **Energy-Aware Scheduling** - Manual energy level selection

## 🔌 GitHub Agent API

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/github/health` | Health check |
| GET | `/api/github/stats` | System statistics |
| POST | `/api/github/ingest` | Ingest a repository |
| POST | `/api/github/query` | Query code and issues |
| GET | `/api/github/issues` | Get repository issues |
| GET | `/api/github/status/:jobId` | Check job status |
| DELETE | `/api/github/repo/:repoId` | Delete repository |

### Example Usage

**Ingest a Repository:**
```bash
curl -X POST http://localhost:3000/api/github/ingest \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/user/repo", "branch": "main"}'
```

**Query a Repository:**
```bash
curl -X POST http://localhost:3000/api/github/query \
  -H "Content-Type: application/json" \
  -d '{"repoId": "user/repo", "query": "How does authentication work?"}'
```

**Get Repository Issues:**
```bash
# List all open issues
curl "http://localhost:3000/api/github/issues?repoUrl=https://github.com/user/repo&state=open"

# Get specific issue with comments
curl "http://localhost:3000/api/github/issues?repoUrl=https://github.com/user/repo&issueNumber=42"

# Search issues
curl "http://localhost:3000/api/github/issues?repoUrl=https://github.com/user/repo&search=bug&assignee=username"
```

**Ask About Issues:**
```bash
curl -X POST http://localhost:3000/api/github/query \
  -H "Content-Type: application/json" \
  -d '{"repoId": "user/repo", "query": "What issues are assigned to john?"}'

curl -X POST http://localhost:3000/api/github/query \
  -H "Content-Type: application/json" \
  -d '{"repoId": "user/repo", "query": "What open bugs do we have?"}'
```

## 📁 Project Structure

```
├── pages/
│   ├── api/github/          # GitHub agent API routes
│   ├── index.tsx            # Home page
│   ├── _app.tsx
│   └── _document.tsx
├── lib/
│   ├── services/            # Core services (Git, RAG, Embeddings, etc.)
│   ├── config.ts
│   ├── types.ts
│   ├── logger.ts
│   └── validation.ts
├── src/
│   ├── popup/               # Chrome extension popup
│   ├── background/          # Service worker
│   └── content/             # Content scripts
├── manifest.json            # Extension manifest
├── vite.config.js           # Extension build config
└── next.config.js           # Next.js config
```

## 🛠️ Development

```bash
# Start Next.js dev server
npm run dev

# Build Chrome extension
npm run build:extension

# Build Next.js for production
npm run build

# Start production server
npm start
```

## 🚢 Deployment

### Vercel (Recommended)

The app is now **serverless-friendly** and uses GitHub API instead of cloning repos to disk.

**Important Notes:**
- No file system caching needed - uses GitHub API directly
- In-memory cache for job status (consider Redis for production)
- GitHub token recommended for better rate limits

```bash
# Deploy to Vercel
vercel deploy

# Set environment variables in Vercel dashboard:
# - GROQ_API_KEY
# - PINECONE_API_KEY
# - PINECONE_ENVIRONMENT
# - PINECONE_INDEX_NAME
# - GITHUB_TOKEN (optional but recommended)
```

### Environment Variables for Vercel

Required:
- `GROQ_API_KEY` - Groq API key for LLM
- `PINECONE_API_KEY` - Pinecone API key
- `PINECONE_ENVIRONMENT` - Pinecone environment (e.g., us-east-1)
- `PINECONE_INDEX_NAME` - Pinecone index name

Optional:
- `GITHUB_TOKEN` - For private repos and higher rate limits (5000 req/hr vs 60 req/hr)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - For persistent caching (recommended for production)

### Docker
```bash
docker build -t dev-productivity-suite .
docker run -p 3000:3000 dev-productivity-suite
```

## 📚 Documentation

- [Migration Guide](MIGRATION_GUIDE.md) - Details on the GitHub agent migration
- [Nuclear Mode Guide](NUCLEAR_MODE_GUIDE.md) - Focus mode documentation

## 🎯 Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Vector DB**: Pinecone
- **LLM**: Groq (Llama 3.1)
- **Embeddings**: Local (Xenova/transformers.js)
- **GitHub API**: Issues, Code, Search
- **Extension**: Chrome Manifest V3

## 💡 Example Queries

### Code Questions
```
"How does authentication work in this repo?"
"Show me the payment processing logic"
"What does the UserService class do?"
"Find all API endpoints"
```

### Issue Questions (NEW!)
```
"What issues are assigned to john?"
"Show me all open bugs"
"What's blocking the v2.0 release?"
"Who is working on the authentication feature?"
"What issues are labeled high-priority?"
```

### Combined Questions (NEW!)
```
"Show me the login code and any related bugs"
"What issues mention the PaymentService?"
"Are there security issues in the API code?"
```

## ✅ What's New

- ✅ **GitHub Issues Integration**: Ask about issues, assignees, and bugs
- ✅ **Serverless-ready**: Uses GitHub API instead of cloning repos (Vercel compatible!)
- ✅ GitHub agent integrated into Next.js (no separate backend!)
- ✅ Unified development experience
- ✅ Simplified deployment
- ✅ Better type safety with shared types
- ✅ Hot reload for both API and frontend
- ✅ No file system dependencies (works on read-only environments)
- ✅ No Redis or database required (uses GitHub API + Pinecone only)

## 🔧 Troubleshooting

### Port Already in Use
Change the port in `.env.local`:
```env
PORT=3001
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
npx tsc --noEmit
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the migration guide first to understand the new architecture.
#   E X p r o - n e x t j s 
 
 