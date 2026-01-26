# Python Agents Service

A Python-based AI agents service built with FastAPI and LangChain.

## Configuration

The service uses [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) for configuration management.

### Load Priority

Configuration values are loaded in the following order (highest to lowest priority):

1. **OS environment variables** - Always takes precedence
2. **`.env` file** - Used if OS variable is not set
3. **Default values** - Fallback if neither is set

This means you can:
- Use a `.env` file for local development
- Override with OS environment variables in production (Docker, Kubernetes, etc.)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_NAME` | Name of the service | `python-agents` |
| `SERVICE_PORT` | Port the service runs on | `3001` |
| `ENVIRONMENT` | Environment (development/production) | `development` |
| `OPENAI_API_KEY` | OpenAI API key | `None` |
| `TAVILY_API_KEY` | Tavily API key for search | `None` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `None` |
| `GOOGLE_API_KEY` | Google API key | `None` |
| `USE_MOCK_RESPONSES` | Enable mock responses for testing | `False` |
| `TYPESCRIPT_AGENTS_URL` | URL for TypeScript agents service | `http://typescript-agents:3002` |
| `HOTEL_API_URL` | Hotel API endpoint | `https://api.hotels.com` |
| `TRANSPORT_API_URL` | Transport API endpoint | `https://api.transport.com` |
| `MCP_SERVER_URL` | MCP server URL for food agent | `http://localhost:8001` |
| `LANGCHAIN_TRACING_V2` | Enable LangChain tracing | `False` |
| `LANGCHAIN_API_KEY` | LangChain API key | `None` |
| `LANGCHAIN_PROJECT` | LangChain project name | `allorai-python-agents` |
| `LANGSMITH_API_KEY` | LangSmith API key | `None` |
| `LANGSMITH_TRACING` | Enable LangSmith tracing | `False` |
| `LANGSMITH_PROJECT` | LangSmith project name | `None` |
| `LANGSMITH_ENDPOINT` | LangSmith API endpoint | `None` |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4-turbo-preview` |
| `TEMPERATURE` | Model temperature | `0.7` |

### Setup

#### Option 1: Using a `.env` file (Recommended for local development)

Create a `.env` file in the project root:

```env
# Required
OPENAI_API_KEY=sk-proj-xxxxx

# Optional
TAVILY_API_KEY=tvly-xxxxx
ENVIRONMENT=development
USE_MOCK_RESPONSES=false

# LangSmith (optional)
LANGSMITH_API_KEY=lsv2_xxxxx
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=my-project
```

#### Option 2: Using OS environment variables (Recommended for production)

**Windows (cmd.exe):**
```cmd
set OPENAI_API_KEY=sk-proj-xxxxx
set ENVIRONMENT=production
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY = "sk-proj-xxxxx"
$env:ENVIRONMENT = "production"
```

**Linux/Mac:**
```bash
export OPENAI_API_KEY=sk-proj-xxxxx
export ENVIRONMENT=production
```

#### Option 3: Docker / Docker Compose

```yaml
services:
  python-agents:
    build: .
    environment:
      - OPENAI_API_KEY=sk-proj-xxxxx
      - ENVIRONMENT=production
      - USE_MOCK_RESPONSES=false
```

## Running the Service

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload --port 3001
```

## Project Structure

```
python-agents/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env                    # Local environment variables (git-ignored)
├── agents/
│   ├── coordinator/        # Coordinator agent
│   ├── food/              # Food-related agent
│   │   ├── agent.py       # Food agent implementation
│   │   ├── routes.py      # API endpoints
│   │   └── evals.py       # Evaluation module
│   ├── hotel/             # Hotel booking agent
│   └── transport/         # Transport booking agent
└── shared/
    ├── config.py          # Configuration management
    ├── mcp_client.py      # MCP server client
    ├── http_client.py     # HTTP client utilities
    └── mock_data.py       # Mock data for testing
```

## Evaluations

The Food Agent includes a comprehensive evaluation framework using LangSmith.

### Running Evaluations

#### Via CLI

```bash
# Create the evaluation dataset
python -m agents.food.evals --create-dataset

# Run evaluation with custom evaluators
python -m agents.food.evals --run-eval

# Run evaluation with LLM judge
python -m agents.food.evals --run-llm-eval

# Custom dataset name
python -m agents.food.evals --run-eval --dataset-name my-dataset --experiment-prefix my-experiment
```

#### Via API

```bash
# Create dataset
POST /api/v1/food/evals/create-dataset?dataset_name=food-agent-eval

# Run evaluation
POST /api/v1/food/evals/run
{
    "dataset_name": "food-agent-eval",
    "experiment_prefix": "food-agent",
    "use_llm_judge": false
}
```

### Custom Evaluators

The evaluation module includes three custom evaluators:

| Evaluator | Description |
|-----------|-------------|
| `relevance_evaluator` | Checks if the response contains food-related content and addresses the query |
| `helpfulness_evaluator` | Measures actionable content and sufficient detail |
| `tone_evaluator` | Verifies friendly, enthusiastic foodie tone |

### LLM Judge

The LLM judge evaluation uses GPT-4o-mini to evaluate responses on:
- **Food Relevance**: Does the response provide relevant food recommendations?
- **Helpfulness**: Is the response actionable for someone looking for food?
- **Enthusiasm**: Does the response convey a friendly foodie tone?

### Viewing Results

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Navigate to your project (default: "AllorAI")
3. View experiments under "Datasets & Experiments"


