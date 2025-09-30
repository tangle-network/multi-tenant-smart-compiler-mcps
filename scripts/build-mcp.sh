#!/bin/bash
# Legacy wrapper - delegates to unified build script
exec $(dirname "$0")/build.sh mcp "$@"