#!/usr/bin/env python3
"""
MCP Chatbot Server - Main entry point
Provides tools and resources to the LLM through Model Context Protocol
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio

from handlers.tools import setup_tool_handlers
from config import SERVER_CONFIG, IS_VULNERABLE

# Create server instance
server = Server(SERVER_CONFIG["name"])

def setup_handlers():
    """Register all handlers"""
    print("[INFO] Setting up tool handlers...", flush=True)
    setup_tool_handlers(server)
    print("[INFO] All handlers registered successfully", flush=True)

async def main():
    """Run the MCP server"""
    print(f"[INFO] Starting {SERVER_CONFIG['name']} v{SERVER_CONFIG['version']}", flush=True)
    print(f"[INFO] Vulnerability Mode: {'Vulnerable' if IS_VULNERABLE else 'Safe'}", flush=True)
    setup_handlers()
    
    print("[INFO] Initializing stdio server...", flush=True)
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        print("[INFO] Server is now running and listening for connections...", flush=True)
        print("[INFO] Waiting for client connection on stdio...", flush=True)
        print("[✓] Ready to accept client connections. Server is blocking and waiting...", flush=True)
        try:
            await server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name=SERVER_CONFIG["name"],
                    server_version=SERVER_CONFIG["version"],
                    capabilities=server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )
            print("[INFO] Client disconnected. Shutting down...", flush=True)
        except Exception as e:
            print(f"[ERROR] Connection error: {e}", flush=True)
            raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        try:
            print("[INFO] Server shutdown by user", flush=True)
        except (ValueError, OSError):
            pass
        sys.exit(0)
    except Exception as e:
        try:
            print(f"[ERROR] Server error: {e}", flush=True)
        except (ValueError, OSError):
            pass
        sys.exit(1)