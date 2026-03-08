"""
Configuration for MCP Server
"""
import os
from pathlib import Path
# Base paths
BASE_DIR = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"

# Server configuration
SERVER_CONFIG = {
    "name": "mcp-chatbot-server",
    "version": "1.0.0",
    "description": "MCP server providing tools and resources for chatbot",
}

# Paths
DOCUMENTS_DIR = DATA_DIR / "documents"

# Security
ALLOWED_FILE_EXTENSIONS = [".txt", ".md", ".json", ".csv"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

IS_VULNERABLE = os.environ.get('VULNERABILITY_MODE', 'true').lower() == 'true'