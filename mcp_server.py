#!/usr/bin/env python3
"""Job Tracker MCP Server entrypoint."""
import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.mcp_server import main

if __name__ == "__main__":
    main()
