import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import type { Intent } from "../types/intents.js";

/**
 * AgentState extends MessagesAnnotation to include routing information.
 * - messages: conversation history (from MessagesAnnotation)
 * - intent: classified intent used for routing
 */
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  intent: Annotation<Intent | null>({
    default: () => null,
    reducer: (_, y) => y, // Last value wins
  }),
});

export type AgentStateType = typeof AgentState.State;
