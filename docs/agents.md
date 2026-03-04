# Agents

All agents except Tips are nodes in the LangGraph workflow, reached via intent classification. See [architecture.md](architecture.md) for the routing logic.

## Agent Summary

| Agent | Intent | Pattern | Primary Data Source |
|-------|--------|---------|---------------------|
| Supervisor/Router | — | LLM classification | — |
| Flight | `flights` | Tool-based | Amadeus API |
| Hotel | `hotel` | Places API + Generator | Google Places |
| Restaurant | `restaurant` | Places API + Generator | Google Places |
| Activities | `activities` | Places API + Generator | Google Places |
| Nature | `nature` | Places API + Generator | Google Places |
| Selfie | `selfie` | Places API + Generator | Google Places |
| Tips | — (standalone) | Generator + Wikipedia | Wikipedia / LLM |
| Arithmetic | `arithmetic` | Tool-based | Math tools |
| Unsupported | — | None | — |

---

## Supervisor / Router

**Location:** `graph/nodes/supervisor/`

Reads the last 6 messages, calls `classifyIntent` with the `fast` model tier, sets `state.intent`, and routes to the appropriate agent node. Handles follow-up messages without re-classifying mid-conversation.

---

## Flight Agent

**Location:** `graph/nodes/flight/`

Uses `createReactAgent` with two tools: `searchFlights` (Amadeus API) and `validateAirport` (IATA code lookup + coordinates). Builds a dynamic system prompt highlighting which required fields are still missing (origin, destination, departure date, return date) and asks for them one at a time.

After fetching results, `summarizeFlights()` makes a second LLM call to produce a human-readable summary. When `USE_FLIGHT_API=false`, the generator fallback is used instead.

---

## Hotel Agent

**Location:** `graph/nodes/hotel/`

Checks `trip.destination` (asks the user if missing). If `USE_PLACES_API=true` and `trip.destinationCoords` are set, fetches real hotels from Google Places. Otherwise, passes 5 null-field `HotelResults` templates to `generator()`. Optionally generates a conversational summary.

---

## Restaurant Agent

**Location:** `graph/nodes/restaurant/`

Same pattern as Hotel. Uses `trip.hotelCoords` for Places API proximity search (searches: restaurant, fast food, cafe, food court). Falls back to 3 LLM-generated results.

---

## Activities Agent

**Location:** `graph/nodes/activities/`

Same pattern. Searches for tourist attractions, amusement parks, museums, art galleries, and zoos. Returns 10 results (more than other place types).

---

## Nature Agent

**Location:** `graph/nodes/nature/`

Same pattern. Searches for parks, national parks, campgrounds, and hiking areas. Returns 5 results.

---

## Selfie Agent

**Location:** `graph/nodes/selfie/`

Same pattern. Searches tourist attractions, museums, art galleries, and zoos for photogenic spots. Returns 5 results.

---

## Tips Agent

**Location:** `graph/nodes/tips/`

Not part of the LangGraph workflow — called directly by the `POST /tips` endpoint. Fetches the Wikipedia article for the destination city, classifies sections into `transportation`, `safety`, and `whenToVisit` categories using an LLM, then fetches those sections and generates 3 tip fields (2–4 sentences each). Falls back to pure generator if Wikipedia is unavailable.

Tip fields:
- `transportTips` — getting around the destination city
- `whenToVisitTips` — best times, crowds, local festivals
- `safetyTips` — areas to avoid, staying safe

---

## Arithmetic Agent

**Location:** `graph/nodes/arithmetic/`

Uses `createReactAgent` with add/subtract/multiply/divide tools. Handles basic math between exactly two numbers. Does not support exponents, roots, or expressions with 3+ operands.

---

## Unsupported Node

**Location:** `graph/nodes/unsupportedNode.ts`

Returns a friendly message when no intent matches.
