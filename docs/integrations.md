# Third-Party Integrations

AllorAI pulls real-world data from three external sources. All integrations have LLM-based fallbacks and are controlled by feature flags.

---

## Amadeus — Flight Search

**Files:** `tools/travel/searchFlights.ts`, `utils/amadeus/tokenManager.ts`

Used by the Flight agent to search for real round-trip flight offers.

- Authenticates via **OAuth2** (`client_credentials` grant). Tokens are cached and refreshed automatically by `tokenManager.ts`.
- Calls the Amadeus Shopping API (`/v2/shopping/flight-offers`), returning up to 5 offers.
- Results include price, airline name, departure/arrival times, and leg durations.
- The `validateAirport` tool checks IATA codes against a local `data/airports/airports.json` lookup and returns airport coordinates, which populate `trip.destinationCoords`.

**Enable/disable:** `USE_FLIGHT_API=true|false`

**Required env vars:** `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `AMADEUS_GRANT_TYPE`

---

## Google Places API — Venue Search

**File:** `tools/travel/searchNearbyPlaces.ts`

Used by the Hotel, Restaurant, Activities, Nature, and Selfie agents to find real venues within 10 km of a coordinate.

Each agent type maps to a set of Google place types:

| Type         | Google `includedTypes`                                       |
| ------------ | ------------------------------------------------------------ |
| `hotel`      | hotel                                                        |
| `restaurant` | restaurant, fast_food_restaurant, cafe, food_court           |
| `activities` | tourist_attraction, amusement_park, museum, art_gallery, zoo |
| `nature`     | park, national_park, campground, hiking_area                 |
| `selfie`     | tourist_attraction, museum, art_gallery, zoo                 |

Place photos can optionally be fetched and included in results.

**Enable/disable:** `USE_PLACES_API=true|false`

**Required env var:** `GOOGLE_PLACES_API_KEY`

**Photo fetching:** `FETCH_PLACES_PHOTOS=all|none|hotel|restaurant|activity|nature|selfie`

---

## Wikipedia — Location Context

**File:** `tools/travel/searchWikipedia.ts`

Used in two places:

1. **Flight agent** — fetches geographic coordinates for a destination city by searching its Wikipedia article. Supplements the IATA airport coordinates with city-centre coordinates.

2. **Tips agent** — fetches the Wikipedia article for the destination, classifies its table-of-contents sections into three categories (`transportation`, `safety`, `whenToVisit`) using an LLM, then retrieves those sections. The content is passed to the LLM to generate the final tips. If Wikipedia is unavailable, the generator falls back to pure LLM generation.

No API key is required — Wikipedia's public REST API is used directly.

---

## Feature Flags Summary

| Variable              | Effect                                                    |
| --------------------- | --------------------------------------------------------- |
| `USE_FLIGHT_API`      | `true` = Amadeus real data; `false` = LLM generator       |
| `USE_PLACES_API`      | `true` = Google Places real data; `false` = LLM generator |
| `GENERATE_SUMMARIES`  | `true` = agents produce a conversational text summary     |
| `FETCH_PLACES_PHOTOS` | Controls which agent types fetch venue photos             |
