# MCP Guide Generator

A clean, minimal MCP (Model Context Protocol) server that wraps guide-generator CLI commands.

## Features

- **Cache Management**: Manage guide-generator cache (status, list, clear)
- **Health Monitoring**: Built-in health checks
- **System Status**: Get system and configuration status
- **Real Commands**: Executes actual guide-generator CLI commands (no mocking)

## Installation

### Prerequisites

- Python 3.9 or higher
- guide-generator CLI installed and available in PATH

### Install Dependencies

```bash
pip install -r requirements.txt
```

## Usage

### Start MCP Server

```bash
python -m mcp_guide_generator.server
```

### Available Tools

1. **manage_cache**: Cache management operations
   - `action: "status"` - Show cache status and statistics  
   - `action: "list"` - List cached steps (optionally filtered by domain)
   - `action: "clear"` - Clear cache (optionally by domain/step)

2. **health_check**: Server health diagnostics

3. **get_status**: System status and configuration

### Testing

Run the test suite:

```bash
# Unit tests
python tests/test_cache_tool.py

# Integration tests
python tests/test_integration.py

# MCP protocol tests
python tests/test_mcp_protocol.py
```

## Architecture

```
src/mcp_guide_generator/
├── server.py          # Main MCP server
├── config.py          # Configuration management
└── tools/
    ├── base.py         # Base tool class
    ├── cache.py        # Cache management tool
    ├── health.py       # Health check tool
    └── status.py       # Status tool
```

All tools execute real guide-generator CLI commands - no mocking or fake responses.

## License

Licensed under the terms specified in LICENSE file.