"""
Healthcheck service for network diagnostics
"""
import subprocess
import re
from config import IS_VULNERABLE

class HealthcheckService:
    """Handle healthcheck operations like ping"""
    
    # Regex to validate hostname or IP address (IPv4 and IPv6)
    HOSTNAME_IP_PATTERN = re.compile(
        r"^(?:"
        r"(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?"  # hostname
        r"|(?:[0-9]{1,3}\.){3}[0-9]{1,3}"  # IPv4
        r"|(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}"  # IPv6
        r")$"
    )

    @staticmethod
    def is_command_injection(host: str) -> bool:
        """
        Detect command injection patterns in host parameter
        
        Args:
            host: The hostname or IP address to check
        
        Returns:
            True if command injection pattern detected, False otherwise
        """
        pattern = re.compile(
            r"(?ix)"
            r"(?:"
            r"[;&|`$(){}[\]<>]"             
            r"|;\s*\w+"                   
            r"|&&|'\|\|"                 
            r"|`.*`|\$\(.*\)"               
            r"|\$\{.*\}"                  
            r")"
        )
        return bool(pattern.search(host))
    
    @staticmethod
    def is_valid_host(host: str) -> bool:
        """
        Validate that host is a valid hostname or IP address
        Prevents option injection by rejecting hosts starting with - or other invalid characters
        
        Args:
            host: The hostname or IP address to validate
        
        Returns:
            True if valid hostname/IP, False otherwise
        """
        if not host or host.startswith('-'):
            return False
        return bool(HealthcheckService.HOSTNAME_IP_PATTERN.match(host))

    @staticmethod
    def ping_host(host: str) -> str:
        """
        Ping a host once and return the ping command output
        
        Args:
            host: The hostname or IP address to ping
        
        Returns:
            The raw output from the ping command
        """
        if IS_VULNERABLE:
            try:
                # Vulnerable: uses shell=True which allows command injection
                result = subprocess.run(
                    f"ping -c 1 {host}",
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                return result.stdout + result.stderr
            
            except subprocess.TimeoutExpired:
                return f"Error: Ping to {host} timed out"
            except FileNotFoundError:
                return "Error: ping command not found"
            except Exception as e:
                return f"Error: {str(e)}"
        else:
            if HealthcheckService.is_command_injection(host):
                return f"Error: Command injection pattern detected in host parameter"
            
            if not HealthcheckService.is_valid_host(host):
                return f"Error: Invalid hostname or IP address format"
            
            try:
                result = subprocess.run(
                    ["ping", "-c", "1", "--", host],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                # Return the output exactly as the ping command outputs it
                return result.stdout + result.stderr
            
            except subprocess.TimeoutExpired:
                return f"Error: Ping to {host} timed out"
            except FileNotFoundError:
                return "Error: ping command not found"
            except Exception as e:
                return f"Error: {str(e)}"
