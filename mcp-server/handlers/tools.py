"""
Tool handlers for MCP Server
"""
import mcp.types as types
from services.file_service import FileService
from services.sql_service import SQLService
from services.healthcheck_service import HealthcheckService


def setup_tool_handlers(server):
    """Register tool handlers with the server"""
    
    @server.list_tools()
    async def handle_list_tools() -> list[types.Tool]:
        """List all available tools"""
        return [
            types.Tool(
                name="read_document",
                description="Read the full content of a specific document",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "document_name": {
                            "type": "string",
                            "description": "Name of the document to read",
                        }
                    },
                    "required": ["document_name"],
                },
            ),
            types.Tool(
                name="list_documents",
                description="List all available documents in the system or from a specific directory",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Optional subdirectory path relative to documents directory",
                        }
                    },
                    "required": [],
                },
            ),
            types.Tool(
                name="query_sql",
                description="Run an SQL SELECT query against the PostgreSQL database and return the results",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The SQL SELECT query to execute",
                        }
                    },
                    "required": ["query"],
                },
            ),
            types.Tool(
                name="health_check",
                description="Ping a host to check network connectivity and return the ping output",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "host": {
                            "type": "string",
                            "description": "The hostname or IP address to ping",
                        }
                    },
                    "required": ["host"],
                },
            ),
        ]
    
    @server.call_tool()
    async def handle_call_tool(
        name: str, arguments: dict | None
    ) -> list[types.TextContent]:
        """Handle tool execution"""
        try:
            if name == "query_sql":
                query = arguments.get("query", "") if arguments else ""
                try:
                    results = SQLService.query_sql(query)
                    
                    if not results:
                        return [types.TextContent(
                            type="text",
                            text="Query executed successfully but returned no results."
                        )]

                    # Format results as comma-separated values
                    columns = list(results[0].keys())
                    header = ",".join(columns)
                    rows = []
                    for row in results:
                        row_str = ",".join(str(row[col]) for col in columns)
                        rows.append(row_str)
                    
                    csv_output = f"{header}\n" + "\n".join(rows)
                    
                    return [types.TextContent(
                        type="text",
                        text=f"SQL Query Results:\n\n{csv_output}"
                    )]
                except ValueError as e:
                    return [types.TextContent(
                        type="text",
                        text=f"Error: {str(e)}"
                    )]
                except Exception as e:
                    return [types.TextContent(
                        type="text",
                        text=f"Error: {str(e)}"
                    )]
            elif name == "read_document":
                document_name = arguments.get("document_name", "") if arguments else ""
                try:
                    content = await FileService.read_document(document_name)
                    return [types.TextContent(
                        type="text",
                        text=f"Read operation results:\n\n{content}"
                    )]
                except FileNotFoundError as e:
                    return [types.TextContent(
                        type="text",
                        text=f"Error: {str(e)}"
                    )]
                except (ValueError, IOError) as e:
                    return [types.TextContent(
                        type="text",
                        text=f"Error: {str(e)}"
                    )]
            
            elif name == "list_documents":
                path = arguments.get("path", None) if arguments else None
                try:
                    documents = await FileService.list_documents(path)
                    
                    if not documents:
                        return [types.TextContent(
                            type="text",
                            text=f"No documents available" + (f" in path '{path}'" if path else "")
                        )]
                    
                    response = f"Available documents ({len(documents)}):\n\n"
                    for doc in documents:
                        doc_name = doc.name
                        doc_type = doc.type
                        doc_size = doc.size
                        
                        # Use different icon based on type
                        if doc_type == "directory":
                            response += f"📁 {doc_name}/\n"
                        else:
                            if doc_size == 0:
                                response += f"📄 {doc_name}\n"
                            else:
                                response += f"📄 {doc_name} ({doc_size} bytes)\n"
                    
                    return [types.TextContent(type="text", text=response)]
                except ValueError as e:
                    return [types.TextContent(
                        type="text",
                        text=f"Error: {str(e)}"
                    )]
            
            elif name == "health_check":
                host = arguments.get("host", "") if arguments else ""
                output = HealthcheckService.ping_host(host)
                
                return [types.TextContent(
                    type="text",
                    text=f"{output}"
                )]
            
            else:
                raise ValueError(f"Unknown tool: {name}")
        
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"Error executing tool: {str(e)}"
            )]