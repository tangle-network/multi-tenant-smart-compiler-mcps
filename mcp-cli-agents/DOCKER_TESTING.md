# Docker Testing Environment

This document describes how to use the Docker-based testing environment that guarantees all CLI tools (OpenAI CLI, Google AI CLI) and Claude SDK are properly installed and available for integration testing.

## 🐳 **Quick Start**

### **Build the Test Environment**

```bash
# Build the Docker image with all CLI tools installed
pnpm docker:build
```

### **Run All Tests**

```bash
# Run all tests in Docker environment
# Make sure to set your API keys first:
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export OPENAI_API_KEY="your-openai-api-key"
export GOOGLE_API_KEY="your-google-api-key"

pnpm docker:test
```

### **Run Integration Tests Only**

```bash
# Run only the real CLI integration tests
pnpm docker:test:integration

# Run with detailed verbose output and file analysis
pnpm docker:test:detailed
```

### **Interactive Shell**

```bash
# Get a bash shell inside the container for debugging
pnpm docker:shell
```

## 🏗️ **What's Installed**

The Docker environment includes:

### **System Tools**

- Node.js 20 with npm/pnpm
- Git, curl, build tools

### **AI Agent Tools**

- **Claude SDK** (via `@anthropic-ai/claude-code` package) - for Claude agent via SDK
- **OpenAI Codex CLI** (via `npx @openai/codex@latest`) - for Codex agent
- **Google Gemini CLI** (via `npx @google/gemini-cli@latest`) - for Gemini CLI agent (skipped if `GOOGLE_GENERATIVE_AI_API_KEY` not set)

### **Environment Setup**

- CLI tools installed via npx, Claude SDK via npm package (no system packages needed)
- Proper PATH configuration for Node.js tools
- Test environment variables with placeholder API keys

## 📋 **Test Categories**

### **1. Unit Tests (Simulation)**

```bash
# These run CLI agent logic with mock/echo commands
pnpm test:cli-agents
```

### **2. Streaming Integration**

```bash
# Tests Claude SDK streaming and session management
pnpm test:claude-integration
```

### **3. Real CLI Integration**

```bash
# Tests actual CLI tool execution (requires Docker environment)
pnpm docker:test:integration
```

## 🔧 **AI Agent Commands Used**

### **Claude SDK**

```
Uses @anthropic-ai/claude-code package via SDK (no CLI)
```

### **OpenAI Codex CLI**

```bash
npx --yes @openai/codex@latest exec "prompt"
```

### **Google Gemini CLI**

```bash
npx --yes @google/gemini-cli@latest --yolo --prompt "prompt"
```

## 🚨 **Important Notes**

### **API Keys Required**

Real integration tests require valid API keys:

- `ANTHROPIC_API_KEY` - for Claude SDK
- `OPENAI_API_KEY` - for OpenAI/Codex CLI
- `GOOGLE_GENERATIVE_AI_API_KEY` - for Google Gemini CLI

### **Test Expectations**

Unlike local development tests, Docker tests **EXPECT** CLI tools to work:

- ❌ Tests **FAIL** if CLI tools are not available
- ❌ Tests **FAIL** if CLI execution fails
- ✅ Tests **PASS** only when CLI tools execute successfully

### **Project Structure**

Tests create real projects in `/workspace/packages/mcp-cli-agents/debug/`:

- `library-claude-nodejs-api/` - Node.js API with Express (via Claude SDK)
- `library-codex-utility/` - Utility library with functions (via OpenAI Codex CLI)
- `library-gemini-documentation-suite/` - Documentation suite (via Gemini CLI, only if `GOOGLE_API_KEY` provided)

## 🐛 **Troubleshooting**

### **Build Failures**

```bash
# Clean build
docker system prune -f
pnpm docker:build
```

### **API Errors**

```bash
# Check API keys are set
echo $ANTHROPIC_API_KEY
echo $OPENAI_API_KEY
echo $GOOGLE_GENERATIVE_AI_API_KEY

# Test in interactive shell
pnpm docker:shell
# Then inside container:
npx --version
echo "✅ npx CLI tools ready"
```

### **Permission Errors**

```bash
# Make sure Docker daemon is running
docker info

# Check file permissions
ls -la Dockerfile.test
```

## 🎯 **Development Workflow**

### **Local Development**

```bash
# Fast feedback loop with simulated CLI
pnpm test:cli-agents
pnpm test:claude-integration
```

### **Pre-commit Verification**

```bash
# Full integration testing before committing
pnpm docker:build
pnpm docker:test
```

### **CI/CD Integration**

The Docker environment is designed for CI/CD systems:

```yaml
# Example GitHub Actions
- name: Build test environment
  run: pnpm docker:build

- name: Run integration tests
  run: pnpm docker:test:integration
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
```

## 📊 **Expected Results**

### **Successful Test Run**

```
✅ Claude SDK streaming tests: 7/7 passed
✅ CLI agent simulation tests: 11/11 passed
✅ Real CLI integration tests: 8/8 passed
✅ All projects created with files
✅ Bolt conversion working
```

### **Test Output Structure**

```
debug/
├── library-claude-nodejs-api/
│   ├── package.json (with dependencies analysis)
│   ├── server.js (Express.js server)
│   ├── app.js (Application logic)
│   ├── routes/ (API endpoints)
│   ├── controllers/ (Business logic)
│   ├── models/ (Data models)
│   ├── middleware/ (Custom middleware)
│   ├── tests/ (Test files)
│   ├── .env.example (Environment template)
│   ├── README.md (Setup instructions)
│   └── bolt-extracted/ (Bolt artifact conversion)
├── codex-utility-library/
│   ├── src/
│   │   └── index.js (Extended utility functions)
│   ├── tests/ (Jest test files)
│   ├── package.json (Dependencies)
│   ├── README.md (Usage examples)
│   ├── index.d.ts (TypeScript definitions)
│   └── (additional generated files)
├── gemini-documentation-suite/ (only if GOOGLE_API_KEY provided)
│   ├── README.md (Project overview)
│   ├── CONTRIBUTING.md (Contribution guidelines)
│   ├── API.md (API documentation)
│   ├── CHANGELOG.md (Version history)
│   ├── SECURITY.md (Security policy)
│   ├── LICENSE (MIT license)
│   ├── .github/
│   │   ├── ISSUE_TEMPLATE.md
│   │   └── PULL_REQUEST_TEMPLATE.md
│   └── docs/
│       ├── getting-started.md
│       └── advanced-usage.md
└── (detailed file analysis and metrics)
```

### **Comprehensive Analysis Features**

#### **File Verification**

- ✅ File count and size analysis
- ✅ Content length verification
- ✅ Directory structure validation
- ✅ Expected file presence checking
- ✅ Dependency analysis (package.json)

#### **Project Metrics**

- 📊 Total files created per project
- 📏 File sizes and content analysis
- 📋 Function/component counting
- 📝 Documentation word count
- 🔧 Code structure analysis

#### **Bolt Conversion Testing**

- 🔄 Real CLI output → Bolt artifacts
- 📄 File extraction and validation
- 💾 Artifact size and content verification

This Docker environment ensures **100% reproducible** testing with guaranteed CLI tool availability! 🚀
