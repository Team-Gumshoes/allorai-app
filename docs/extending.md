# Adding New Agents

## Tool-Based Agent (with external API)

Use this pattern when the agent needs to call an external API as a LangChain tool (like the Flight agent).

**1. Add the intent type** — `types/intents.ts`:
```typescript
export type Intent = "arithmetic" | "flights" | /* ... */ | "myNew";
```

**2. Update the classifier prompt** — `graph/nodes/supervisor/utils/classifyIntent.ts`:
Add a description and example of when to classify as the new intent.

**3. Add routing case** — `graph/nodes/supervisor/router.ts`:
```typescript
case "myNew":
  return "myNewAgent";
```

**4. Create the tool** — `tools/myDomain/myTool.ts`:
```typescript
import { tool } from "@langchain/core/tools";
import * as z from "zod";

export const myTool = tool(
  async ({ param }) => { /* call external API */ },
  {
    name: "myTool",
    description: "What this tool does",
    schema: z.object({ param: z.string() }),
  }
);
```

**5. Create the agent node** — `graph/nodes/myNew/myNewNode.ts`:
```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { loadModel } from "../../../utils/agents/loadModel.js";
import { myTools } from "./tools.js";

const agent = createReactAgent({
  llm: loadModel("smart"),
  tools: myTools,
  messageModifier: new SystemMessage("Your system prompt here"),
});

export async function myNewNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const result = await agent.invoke({ messages: state.messages });
  return { messages: result.messages };
}
```

**6. Add the response type** — `types/api.ts` (`ResponseData` union).

**7. Wire into the graph** — `graph/index.ts`:
```typescript
.addNode("myNewAgent", myNewNode)
.addEdge("myNewAgent", END)
```

---

## Generator-Based Agent (no tools)

Use this pattern when the agent uses Google Places or the LLM generator instead of a tool. The Activities agent (`graph/nodes/activities/activityNode.ts`) is the reference implementation.

Key differences from tool-based:
- No `createReactAgent` — use `model.invoke()` for conversational responses
- Check for required trip fields first; ask the user if missing
- Call `searchNearbyPlaces()` when `USE_PLACES_API=true` and coordinates exist
- Otherwise build a null-field template array and pass to `generator()`
- Optionally call the model again to produce a summary

Follow the same steps 1–3 and 6–7 above, then implement the node body directly.
