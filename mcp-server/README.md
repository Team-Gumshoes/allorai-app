# MCP Server

This is the MCP Server application, which provides various tools and APIs for managing and searching nearby places using the Google Maps Places API.

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Python 3.10 or later**
2. **pip** (Python package manager)
3. **Google API Key**: You need a valid Google API key with access to the Google Maps Places API. Set it as an environment variable named `GOOGLE_API_KEY`.

## Installation

1. Clone the repository:
   ```cmd
   git clone <repository-url>
   cd allorai-app\apps\mcp-server
   ```

2. Create a virtual environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install dependencies using `uv`:
   ```cmd
   uv --install
   ```

   Alternatively, you can install dependencies using `pip`:
   ```cmd
   pip install -r requirements.txt
   ```

## Configuration

1. Set the `GOOGLE_API_KEY` environment variable:
   ```cmd
   set GOOGLE_API_KEY=your_google_api_key_here
   ```

2. (Optional) Configure additional settings in the `pyproject.toml` file if needed.

## Running the Application

1. Start the server:
   ```cmd
   python server.py
   ```

2. The server will start on `http://127.0.0.1:8001` by default. You can access the endpoints using tools like `curl`, Postman, or any HTTP client.

## Example Usage

### Search Nearby Places

You can use the `search_nearby_places` tool to search for nearby places. Example request:

```json
POST http://127.0.0.1:8001/mcp
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "included_types": ["restaurant", "cafe", "lodging"],
  "radius_miles": 2.0,
  "max_results": 10
}
```

### Response Example

```json
{
  "status": "success",
  "count": 3,
  "searched_types": ["restaurant", "cafe", "lodging"],
  "places": [
    {
      "name": "Cafe XYZ",
      "address": "123 Main St, San Francisco, CA",
      "rating": 4.5,
      "total_ratings": 120,
      "place_id": "abc123",
      "types": ["cafe", "restaurant"],
      "primary_type": "cafe",
      "is_open": true,
      "price_level": 2,
      "location": {"latitude": 37.7749, "longitude": -122.4194},
      "editorial_summary": "A cozy cafe with great coffee and pastries.",
      "website": "http://cafexyz.com",
      "google_maps_url": "https://maps.google.com/?q=place_id:abc123",
      "photos": ["photo1_url", "photo2_url"]
    }
  ]
}
```

## Testing

To test the application, you can use the provided `client_test.py` script:

1. Run the test script:
   ```cmd
   python client_test.py
   ```

2. Verify the output to ensure the application is working as expected.

## Notes

- Ensure your Google API key has the necessary permissions for the Places API.
- The maximum radius for the Places API is 50,000 meters (approximately 31 miles).
- The maximum number of results per request is 20.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
