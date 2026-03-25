#!/usr/bin/env python3
import sys

import uvicorn

from server import app


if __name__ == "__main__":
    try:
        uvicorn.run(app, host="0.0.0.0", port=5002, reload=False, log_level="error")
    except KeyboardInterrupt:
        print("\nChef IA backend stopped")
        sys.exit(0)
