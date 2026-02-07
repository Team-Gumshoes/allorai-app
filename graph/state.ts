import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import type { Intent } from "../types/intents.js";
import type { Trip } from "../types/trip.js";
import type { ResponseData } from "../types/api.js";
import { createEmptyTrip } from "../types/trip.js";

/**
 * AgentState extends MessagesAnnotation to include routing and trip planning information.
 * - messages: conversation history (from MessagesAnnotation)
 * - intent: classified intent used for routing
 * - trip: current trip planning state from frontend
 * - data: extracted data from tool calls (flight options, summaries, etc.)
 */
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  intent: Annotation<Intent | null>({
    default: () => null,
    reducer: (_, y) => y,
  }),
  trip: Annotation<Trip>({
    default: () => createEmptyTrip(),
    reducer: (_, y) => y,
  }),
  data: Annotation<ResponseData | null>({
    default: () => null,
    reducer: (_, y) => y,
  }),
});

export type AgentStateType = typeof AgentState.State;
