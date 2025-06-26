import logging
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional


class StructuredFormatter(logging.Formatter):
    """Custom formatter to output structured JSON logs"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add extra fields if they exist
        if hasattr(record, 'extra') and record.extra:
            log_entry.update(record.extra)
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry, default=str)


class CloudLensLogger:
    """Enhanced logger for CloudLens application"""
    
    def __init__(self, name: str = "cloudlens", level: str = "INFO"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.upper()))
        
        # Prevent duplicate handlers
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup log handlers"""
        # Console handler with structured formatting
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        
        # Use structured formatter for JSON logs
        structured_formatter = StructuredFormatter()
        console_handler.setFormatter(structured_formatter)
        
        self.logger.addHandler(console_handler)
        
        # Prevent propagation to root logger
        self.logger.propagate = False
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log info message with optional extra fields"""
        self.logger.info(message, extra=extra or {})
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log warning message with optional extra fields"""
        self.logger.warning(message, extra=extra or {})
    
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log error message with optional extra fields"""
        self.logger.error(message, extra=extra or {})
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log debug message with optional extra fields"""
        self.logger.debug(message, extra=extra or {})
    
    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log critical message with optional extra fields"""
        self.logger.critical(message, extra=extra or {})


# Create global logger instance
logger = CloudLensLogger()

# For backward compatibility, also expose the raw logger
raw_logger = logging.getLogger("cloudlens")

