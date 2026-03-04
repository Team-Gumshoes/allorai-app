# Models

Model selection is driven entirely by environment variables via `utils/agents/loadModel.ts`. No code changes are needed to switch LLM providers or models.

## Model Tiers

Three tiers map to different tasks:

| Tier | Used by | Env vars |
|------|---------|----------|
| `fast` | Intent classification (router) | `FAST_MODEL_COMPANY`, `FAST_MODEL_NAME` |
| `standard` | Arithmetic agent, flight summarization | `STANDARD_MODEL_COMPANY`, `STANDARD_MODEL_NAME` |
| `smart` | All travel agents, generator utility | `SMART_MODEL_COMPANY`, `SMART_MODEL_NAME` |

## Supported Providers

Set `[TIER]_MODEL_COMPANY` to one of:

| Value | Provider | Notes |
|-------|----------|-------|
| `OpenAI` | OpenAI GPT | `temperature: 1`, `maxRetries: 2` |
| `GoogleGemini` | Google Gemini | `temperature: 0` |
| `Ollama` | Local Ollama instance | `temperature: 0` |

## Example Configuration

```bash
# Lightweight local model for fast routing
FAST_MODEL_COMPANY=Ollama
FAST_MODEL_NAME=qwen2.5:3b

# Mid-tier model for standard reasoning
STANDARD_MODEL_COMPANY=OpenAI
STANDARD_MODEL_NAME=gpt-4o-mini

# High-quality model for generation tasks
SMART_MODEL_COMPANY=OpenAI
SMART_MODEL_NAME=gpt-4o
```

Any combination of providers across tiers is supported — e.g., Ollama for `fast`, OpenAI for `smart`.
