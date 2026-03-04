# API Reference

## Endpoints

| Method | Path      | Description                                    |
|--------|-----------|------------------------------------------------|
| POST   | `/chat`   | Send a message; routed to the appropriate agent |
| POST   | `/tips`   | Generate travel tips for a destination         |
| GET    | `/health` | Health check — returns `{ "status": "ok" }`   |

---

## POST /chat

The main endpoint. Passes messages and trip context through the LangGraph workflow. The router classifies intent and delegates to the right agent.

**Request:**

```json
{
  "messages": [
    { "type": "human", "content": "Find me some restaurants in Tokyo" }
  ],
  "trip": {
    "origin": "New York",
    "destination": "Tokyo",
    "city": "Tokyo",
    "departureDate": "2026-06-01",
    "returnDate": "2026-06-10",
    "budget": 4000,
    "hotel": "Park Hyatt Tokyo",
    "interests": ["food", "culture"],
    "constraints": [],
    "destinationCoords": { "latitude": 35.6762, "longitude": 139.6503 },
    "hotelCoords": { "latitude": 35.6892, "longitude": 139.6922 }
  }
}
```

**Response:**

```json
{
  "messages": [
    { "type": "human", "content": "Find me some restaurants in Tokyo" },
    { "type": "ai", "content": "Here are some great restaurants near your hotel..." }
  ],
  "data": {
    "type": "restaurant",
    "summary": "Here are some great restaurants near your hotel...",
    "options": [
      {
        "id": "abc123",
        "name": "Sushi Masada",
        "location": "Shinjuku, Tokyo",
        "description": "Intimate omakase sushi bar...",
        "website": "https://example.com",
        "rating": 4.8
      }
    ]
  },
  "trip": { "...": "updated trip context" }
}
```

**Notes:**
- Tool messages are filtered out before returning — only `human` and `ai` messages are included.
- Empty AI messages are also removed.
- The `messages` array is passed back on every response and should be sent again on the next request to maintain context. The app currently uses this primarily as a state machine (the agent reads recent messages for context), but it is not yet used as a full conversational chat history. See [roadmap.md](roadmap.md).

---

## POST /tips

Standalone endpoint that generates travel tips for a destination. Bypasses the graph and calls the Tips agent directly.

**Request:**

```json
{
  "trip": {
    "origin": "New York",
    "destination": "Tokyo",
    "city": "Tokyo",
    "departureDate": "2026-06-01",
    "returnDate": "2026-06-10",
    "budget": 4000,
    "hotel": "Park Hyatt Tokyo",
    "interests": ["food", "culture"],
    "constraints": []
  }
}
```

**Response:**

```json
{
  "data": {
    "type": "tips",
    "options": [
      {
        "id": "xyz789",
        "transportTips": "Tokyo's train network is extensive and punctual...",
        "whenToVisitTips": "Spring (March–May) is ideal for cherry blossoms...",
        "safetyTips": "Tokyo is one of the safest major cities in the world..."
      }
    ]
  },
  "trip": { "...": "trip as provided" }
}
```

**Validation:** Returns `400` if `trip.destination` is missing or empty.
