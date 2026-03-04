# Roadmap

## Full Chat Integration

The agent state already stores a `messages: BaseMessage[]` array that accumulates across a conversation. The infrastructure for multi-turn chat is in place — messages are passed to the graph on every request and returned in the response — but the app currently operates closer to a **stateless request/response model**: each call produces structured data based on the current trip context, without the agent actively updating trip fields from conversational input.

**Planned improvement:** Enable the agents (particularly the supervisor or a dedicated update agent) to parse natural-language messages and modify the `Trip` context directly. For example:

- "Change my travel dates to the first week of July" → agent updates `departureDate` and `returnDate`
- "Add vegetarian to my dietary constraints" → agent appends to `trip.constraints`
- "Switch my hotel to the one near Shibuya" → agent updates `hotel` and `hotelCoords`

This would make the system truly conversational and allow users to refine their trip plan through dialogue rather than through form inputs.
