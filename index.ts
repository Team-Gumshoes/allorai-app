import "dotenv/config";
import express from "express";
import { graph } from "./graph/index.js";
import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import type { ChatRequest, ChatResponse, Message } from "./types/api.js";
import { createEmptyTrip } from "./types/trip.js";

type Request = express.Request;
type Response = express.Response;
type NextFunction = express.NextFunction;

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] --> ${req.method} ${req.path}`);

  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", req.body);
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] <-- ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

function toMessages(messages: BaseMessage[]): Message[] {
  return messages
    .map((m) => ({
      type: m.getType() as "human" | "ai",
      content:
        typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }))
    .filter((m): m is Message => m.type === "human" || m.type === "ai");
}

function filterForClient(messages: Message[]): Message[] {
  return messages.filter((m) => {
    if (m.type === "ai" && (!m.content || m.content.trim() === ""))
      return false;
    return true;
  });
}

app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages: inputMessages, trip, data } = req.body as ChatRequest;

    if (!inputMessages || !Array.isArray(inputMessages)) {
      res.status(400).json({
        error: "Invalid request. Expected { messages: Array, trip: Trip }",
      });
      return;
    }

    // Convert frontend messages to LangChain messages
    const conversation: BaseMessage[] = inputMessages.map((m) => {
      if (m.type === "human") {
        return new HumanMessage(m.content);
      }
      return new AIMessage(m.content);
    });

    // Invoke graph with trip context
    const result = await graph.invoke({
      messages: conversation,
      trip: trip || createEmptyTrip(),
      data: data || null,
    });

    // Convert all messages to response format (filters out tool messages)
    const allMessages = toMessages(result.messages);

    // Filter messages for client (remove tool messages and empty AI messages)
    const filteredMessages = filterForClient(allMessages);

    const response: ChatResponse = {
      messages: filteredMessages,
      data: result.data || null,
      trip: result.trip || trip || createEmptyTrip(),
    };

    res.json(response);
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop\n`);
});
