#!/bin/bash
# Legacy wrapper - delegates to unified build script with push
exec $(dirname "$0")/build.sh all --push "$@"