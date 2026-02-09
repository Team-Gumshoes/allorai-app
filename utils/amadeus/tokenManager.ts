import "dotenv/config";

interface AmadeusTokenResponse {
  type: string;
  username: string;
  application_name: string;
  client_id: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  state: string;
  scope: string;
}

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

const BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches an Amadeus API token using the provided credentials.
 *
 * @throws {Error} If any of the required Amadeus credentials (AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, and AMADEUS_GRANT_TYPE) are missing
 * @throws {Error} If the Amadeus token request fails
 * @returns A promise that resolves to an AmadeusTokenResponse object
 */
async function fetchAmadeusToken(): Promise<AmadeusTokenResponse> {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  const grantType = process.env.AMADEUS_GRANT_TYPE;

  if (!clientId || !clientSecret || !grantType) {
    throw new Error(
      "Missing Amadeus credentials: AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, and AMADEUS_GRANT_TYPE must be set in .env",
    );
  }

  const response = await fetch(
    "https://test.api.amadeus.com/v1/security/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: grantType,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Amadeus token request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<AmadeusTokenResponse>;
}

/**
 * Retrieves an Amadeus API token. If a valid token is already cached, it will be returned.
 * Otherwise, a new token will be fetched and cached for future use.
 * The token will be cached for 5 minutes less than its actual expiration time to avoid
 * any potential race conditions.
 *
 * @returns A promise that resolves to an Amadeus API token string
 */
export async function getAmadeusToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    console.log("Using cached Amadeus token");
    return cachedToken;
  }

  const tokenResponse = await fetchAmadeusToken();
  console.log("Generated new Amadeus token");

  cachedToken = tokenResponse.access_token;
  tokenExpiresAt = Date.now() + tokenResponse.expires_in * 1000 - BUFFER_MS;

  return cachedToken;
}
