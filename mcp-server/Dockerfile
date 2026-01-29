# mcp_server/Dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY . .

# For HTTP-based MCP
CMD ["python", "server.py"]
#please make it 8001 port
# For stdio-based MCP (spawned by FastAPI)
# CMD ["python", "-m", "mcp_server.server"]