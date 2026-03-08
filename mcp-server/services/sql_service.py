"""
SQL Query service
"""
import psycopg2
from typing import List, Dict, Any
from config import IS_VULNERABLE 
import re

# Dangerous SQL keywords and patterns (for detecting injections)
dangerous_keywords_pattern = re.compile(
    r"(?ix)"
    r"\b(?:union|insert|update|delete|drop|truncate|alter|create|exec|execute|declare|grant|revoke)\b"
)

# SQL comment patterns
comment_pattern = re.compile(r"(?:--|/\*|\*/|#)")

# Semicolon pattern (batch execution)
batch_pattern = re.compile(r";")

class SQLService:
    """Handle SQL Query operations"""
    
    @staticmethod
    def is_safe_query(query: str) -> bool:
        """
        Validate that a query is a simple SELECT statement with safe patterns.
        Allow-list approach: only SELECT ... FROM users WHERE column = 'value'
        
        Args:
            query: The SQL query to validate
        
        Returns:
            True if query passes safety checks, False if injection suspected
        """
        # Remove leading/trailing whitespace
        query_trimmed = query.strip()
        
        # Check 1: Query must START with SELECT (case-insensitive)
        if not re.match(r"^\s*select\b", query_trimmed, re.IGNORECASE):
            return False
        
        # Check 2: Reject SQL comments
        if comment_pattern.search(query):
            return False
        
        # Check 3: Reject semicolons (batch execution)
        if batch_pattern.search(query):
            return False
        
        # Check 4: Reject dangerous keywords
        if dangerous_keywords_pattern.search(query):
            return False
        
        # Check 5: Reject multiple OR/AND conditions (simple heuristic)
        # Allow max 1 WHERE clause with simple column = value comparison
        or_and_count = len(re.findall(r"\b(or|and)\b", query, re.IGNORECASE))
        if or_and_count > 1:
            return False
        
        # Check 6: If there's an OR or AND, ensure it's not bare (require quotes around values)
        if re.search(r"\b(?:or|and)\b", query, re.IGNORECASE):
            # Must have proper quoting pattern: column = 'value' or column = "value"
            if not re.search(r"(?:=\s*['\"][^'\"]*['\"])", query):
                return False
        
        return True

    @staticmethod
    def likely_sql_injection(s: str) -> bool:
        return not SQLService.is_safe_query(s)

    @staticmethod
    def get_connection():
        """Get PostgreSQL database connection"""
        connection = psycopg2.connect(
            host="postgres",
            port=5432,
            database="vulnmcp",
            user="team",
            password="team.123"
        )
        return connection

    @staticmethod
    def query_sql(query: str) -> List[Dict[str, Any]]:
        """Execute SQL SELECT query directly and return results
        
        Args:
            query: The SQL query to execute
            
        Returns:
            List of dictionaries representing query results
            
        Raises:
            ValueError: If SQL injection is detected in safe mode
            psycopg2.Error: If database query fails
        """
        connection = None
        print(f"[DEBUG] IS_VULNERABLE={IS_VULNERABLE}", flush=True)
        print(f"[DEBUG] Query: {query}", flush=True)

        if IS_VULNERABLE:
            print(f"[DEBUG] Running in VULNERABLE mode - no checks", flush=True)
            try:
                connection = SQLService.get_connection()
                cursor = connection.cursor()
                cursor.execute(query)
                columns = [desc[0] for desc in cursor.description]
                results = cursor.fetchall()
                return [dict(zip(columns, row)) for row in results]
            except psycopg2.Error as e:
                raise psycopg2.Error(f"Database error: {str(e)}") from e
            finally:
                if connection:
                    connection.close()
        else:
            print(f"[DEBUG] Running in SAFE mode - checking for injection patterns", flush=True)
            is_injection = SQLService.likely_sql_injection(query)
            print(f"[DEBUG] Injection detected: {is_injection}", flush=True)
            if is_injection:
                print(f"[WARNING] Potential SQL injection pattern detected in query: {query}", flush=True)
                raise ValueError("Query rejected due to potential SQL injection patterns")
            try:
                connection = SQLService.get_connection()
                cursor = connection.cursor()
                cursor.execute(query)
                columns = [desc[0] for desc in cursor.description]
                results = cursor.fetchall()
                return [dict(zip(columns, row)) for row in results]
            except psycopg2.Error as e:
                raise psycopg2.Error(f"Database error: {str(e)}") from e
            finally:
                if connection:
                    connection.close()