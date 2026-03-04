# Data Model

## Trip

**Location:** `types/trip.ts`

Passed with every `/chat` and `/tips` request. Flows through the graph and is updated as agents gather information.

| Field | Type | Description |
|-------|------|-------------|
| `origin` | `string \| null` | Trip origin city or airport code |
| `destination` | `string \| null` | Trip destination city or airport code |
| `city` | `string \| null` | City name used for Wikipedia lookups |
| `departureFlight` | `string \| null` | Selected departure flight ID |
| `returnFlight` | `string \| null` | Selected return flight ID |
| `departureDate` | `string \| null` | YYYY-MM-DD |
| `returnDate` | `string \| null` | YYYY-MM-DD |
| `budget` | `number \| null` | Budget in USD |
| `hotel` | `string \| null` | Name of the selected hotel |
| `interests` | `string[]` | User interests for personalized results |
| `constraints` | `string[]` | Dietary, accessibility, or other constraints |
| `destinationCoords` | `{ latitude, longitude } \| null` | Populated by the Flight agent via `validateAirport`; used for hotel proximity search |
| `hotelCoords` | `{ latitude, longitude } \| null` | Set by the client after hotel selection; used for restaurant/activities/nature/selfie proximity search |

---

## Intent

**Location:** `types/intents.ts`

```typescript
type Intent =
  | "activities"
  | "arithmetic"
  | "flights"
  | "hotel"
  | "nature"
  | "restaurant"
  | "selfie"
  | "unsupported";
```

---

## Message

**Location:** `types/api.ts`

```typescript
interface Message {
  type: "human" | "ai";
  content: string;
}
```

---

## ResponseData

**Location:** `types/api.ts`

A discriminated union — each agent returns a different shape, distinguished by `type`:

```typescript
type ResponseData =
  | ArithmeticResponseData   // type: "arithmetic"
  | FlightResponseData        // type: "flights"
  | HotelResponseData         // type: "hotel"
  | RestaurantResponseData    // type: "restaurant"
  | ActivitiesResponseData    // type: "activities"
  | NatureResponseData        // type: "nature"
  | SelfieResponseData        // type: "selfie"
  | TipsResponseData;         // type: "tips"
```

All travel-planning response types share this shape:

```typescript
interface [Domain]ResponseData {
  type: string;
  summary?: string;     // conversational text (if GENERATE_SUMMARIES=true)
  options?: [Domain][]; // array of results
}
```

---

## Chat Request / Response

```typescript
interface ChatRequest {
  messages: Message[];
  trip: Trip;
  data?: ResponseData | null;
}

interface ChatResponse {
  messages: Message[];
  data: ResponseData | null;
  trip: Trip;
}
```
