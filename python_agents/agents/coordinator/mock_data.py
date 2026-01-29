"""
Mock data for coordinator agent endpoints.
Used for testing and development when MCP server is not available.
"""

MOCK_NEARBY_PLACES = [
    {
        "name": "Eiffel Tower",
        "address": "Av. Gustave Eiffel, 75007 Paris, France",
        "rating": 4.7,
        "total_ratings": 478051,
        "place_id": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
        "types": [
            "historical_landmark",
            "monument",
            "historical_place",
            "tourist_attraction",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "historical_landmark",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.858370099999995,
            "longitude": 2.2944812999999997
        },
        "editorial_summary": "Gustave Eiffel's iconic, wrought-iron 1889 tower, with steps and elevators to observation decks.",
        "website": "https://www.toureiffel.paris/fr",
        "google_maps_url": "https://maps.google.com/?cid=10222232094831998944",
        "photos": [
            "places/ChIJLU7jZClu5kcR4PcOOO6p3I0/photos/photo1",
            "places/ChIJLU7jZClu5kcR4PcOOO6p3I0/photos/photo2",
            "places/ChIJLU7jZClu5kcR4PcOOO6p3I0/photos/photo3"
        ]
    },
    {
        "name": "Louvre Museum",
        "address": "75001 Paris, France",
        "rating": 4.7,
        "total_ratings": 360747,
        "place_id": "ChIJD3uTd9hx5kcR1IQvGfr8dbk",
        "types": [
            "tourist_attraction",
            "museum",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "museum",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.8606111,
            "longitude": 2.337644
        },
        "editorial_summary": "Former historic palace housing huge art collection, from Roman sculptures to da Vinci's \"Mona Lisa.\"",
        "website": "https://www.louvre.fr/",
        "google_maps_url": "https://maps.google.com/?cid=13363865620386383060",
        "photos": [
            "places/ChIJD3uTd9hx5kcR1IQvGfr8dbk/photos/photo1",
            "places/ChIJD3uTd9hx5kcR1IQvGfr8dbk/photos/photo2",
            "places/ChIJD3uTd9hx5kcR1IQvGfr8dbk/photos/photo3"
        ]
    },
    {
        "name": "Arc de Triomphe",
        "address": "Pl. Charles de Gaulle, 75008 Paris, France",
        "rating": 4.7,
        "total_ratings": 283916,
        "place_id": "ChIJjx37cOxv5kcRPWQuEW5ntdk",
        "types": [
            "monument",
            "cultural_landmark",
            "tourist_attraction",
            "museum",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "monument",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.8737917,
            "longitude": 2.2950274999999998
        },
        "editorial_summary": "Iconic triumphal arch built to commemorate Napoleon's victories, with an observation deck.",
        "website": "https://www.paris-arc-de-triomphe.fr/",
        "google_maps_url": "https://maps.google.com/?cid=15687558599447307325",
        "photos": [
            "places/ChIJjx37cOxv5kcRPWQuEW5ntdk/photos/photo1",
            "places/ChIJjx37cOxv5kcRPWQuEW5ntdk/photos/photo2",
            "places/ChIJjx37cOxv5kcRPWQuEW5ntdk/photos/photo3"
        ]
    },
    {
        "name": "Musée d'Orsay",
        "address": "Esplanade Valéry Giscard d'Estaing, 75007 Paris, France",
        "rating": 4.8,
        "total_ratings": 110396,
        "place_id": "ChIJG5Qwtitu5kcR2CNEsYy9cdA",
        "types": [
            "tourist_attraction",
            "museum",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "museum",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.859961399999996,
            "longitude": 2.3265614
        },
        "editorial_summary": "Major 19th- & 20th-century European art collections housed in a monumental, former railway station.",
        "website": "https://www.musee-orsay.fr/fr",
        "google_maps_url": "https://maps.google.com/?cid=15019994644224418776",
        "photos": [
            "places/ChIJG5Qwtitu5kcR2CNEsYy9cdA/photos/photo1",
            "places/ChIJG5Qwtitu5kcR2CNEsYy9cdA/photos/photo2",
            "places/ChIJG5Qwtitu5kcR2CNEsYy9cdA/photos/photo3"
        ]
    },
    {
        "name": "Tuileries Garden",
        "address": "75001 Paris, France",
        "rating": 4.6,
        "total_ratings": 116420,
        "place_id": "ChIJAQAAMCxu5kcRx--_4QnbGcI",
        "types": [
            "garden",
            "tourist_attraction",
            "park",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "garden",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.863491599999996,
            "longitude": 2.3274942999999997
        },
        "editorial_summary": "Expansive, 17th-century formal garden dotted with statues, including 18 bronzes by Maillol.",
        "website": "https://parisjetaime.com/culture/jardin-des-tuileries-p3545",
        "google_maps_url": "https://maps.google.com/?cid=13986450953264426951",
        "photos": [
            "places/ChIJAQAAMCxu5kcRx--_4QnbGcI/photos/photo1",
            "places/ChIJAQAAMCxu5kcRx--_4QnbGcI/photos/photo2",
            "places/ChIJAQAAMCxu5kcRx--_4QnbGcI/photos/photo3"
        ]
    },
    {
        "name": "Café de Flore",
        "address": "172 Bd Saint-Germain, 75006 Paris, France",
        "rating": 3.9,
        "total_ratings": 13636,
        "place_id": "ChIJq537gddx5kcR_3PhRd2muxg",
        "types": [
            "coffee_shop",
            "food_store",
            "cafe",
            "point_of_interest",
            "food",
            "store",
            "establishment"
        ],
        "primary_type": "coffee_shop",
        "is_open": True,
        "price_level": "PRICE_LEVEL_EXPENSIVE",
        "location": {
            "latitude": 48.8541588,
            "longitude": 2.3326046
        },
        "editorial_summary": "Long-running coffeehouse & celebrity haunt serving familiar French fare in a charming corner locale.",
        "website": "https://cafedeflore.fr/",
        "google_maps_url": "https://maps.google.com/?cid=1782201546845549567",
        "photos": [
            "places/ChIJq537gddx5kcR_3PhRd2muxg/photos/photo1",
            "places/ChIJq537gddx5kcR_3PhRd2muxg/photos/photo2",
            "places/ChIJq537gddx5kcR_3PhRd2muxg/photos/photo3"
        ]
    },
    {
        "name": "Carette",
        "address": "4 Pl. du Trocadéro et du 11 Novembre, 75016 Paris, France",
        "rating": 3.9,
        "total_ratings": 9765,
        "place_id": "ChIJXQvlQftv5kcROZUkVMlEAdo",
        "types": [
            "coffee_shop",
            "tea_house",
            "food_store",
            "cafe",
            "point_of_interest",
            "food",
            "store",
            "establishment"
        ],
        "primary_type": "coffee_shop",
        "is_open": False,
        "price_level": "PRICE_LEVEL_EXPENSIVE",
        "location": {
            "latitude": 48.863707299999994,
            "longitude": 2.2872082
        },
        "editorial_summary": "Elegant, long-standing cafe known for its sandwiches, creative macarons & classic French pastries.",
        "website": "https://paris-carette.fr/a-propos/",
        "google_maps_url": "https://maps.google.com/?cid=15708912606735799609",
        "photos": [
            "places/ChIJXQvlQftv5kcROZUkVMlEAdo/photos/photo1",
            "places/ChIJXQvlQftv5kcROZUkVMlEAdo/photos/photo2",
            "places/ChIJXQvlQftv5kcROZUkVMlEAdo/photos/photo3"
        ]
    },
    {
        "name": "Champ de Mars",
        "address": "75007 Paris, France",
        "rating": 4.6,
        "total_ratings": 218380,
        "place_id": "ChIJB0gcnCBw5kcRHoIAPcTEApc",
        "types": [
            "park",
            "tourist_attraction",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "park",
        "is_open": True,
        "price_level": None,
        "location": {
            "latitude": 48.85580470000001,
            "longitude": 2.2983766
        },
        "editorial_summary": None,
        "website": "https://www.paris.fr/lieux/parc-du-champ-de-mars-1807#acces",
        "google_maps_url": "https://maps.google.com/?cid=10881475996796617246",
        "photos": [
            "places/ChIJB0gcnCBw5kcRHoIAPcTEApc/photos/photo1",
            "places/ChIJB0gcnCBw5kcRHoIAPcTEApc/photos/photo2",
            "places/ChIJB0gcnCBw5kcRHoIAPcTEApc/photos/photo3"
        ]
    },
    {
        "name": "Parc Monceau",
        "address": "75008 Paris, France",
        "rating": 4.6,
        "total_ratings": 22751,
        "place_id": "ChIJwxT3mL5v5kcRAsTd3v0lJOY",
        "types": [
            "park",
            "tourist_attraction",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "park",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.8796835,
            "longitude": 2.308955
        },
        "editorial_summary": "Public park with trees, tarmac trails & statues plus 18th-century colonnade & pyramid follies.",
        "website": "https://www.paris.fr/lieux/parc-monceau-1804",
        "google_maps_url": "https://maps.google.com/?cid=16583421500181038082",
        "photos": [
            "places/ChIJwxT3mL5v5kcRAsTd3v0lJOY/photos/photo1",
            "places/ChIJwxT3mL5v5kcRAsTd3v0lJOY/photos/photo2",
            "places/ChIJwxT3mL5v5kcRAsTd3v0lJOY/photos/photo3"
        ]
    },
    {
        "name": "Musée Rodin",
        "address": "77 Rue de Varenne, 75007 Paris, France",
        "rating": 4.7,
        "total_ratings": 19764,
        "place_id": "ChIJQ9vMHipw5kcRWHC2ESjYaGQ",
        "types": [
            "tourist_attraction",
            "museum",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "museum",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.8553072,
            "longitude": 2.3158354
        },
        "editorial_summary": "18th-century mansion & sculpture garden displaying Rodin's influential works, such as The Thinker.",
        "website": "https://www.musee-rodin.fr/",
        "google_maps_url": "https://maps.google.com/?cid=7235270467978162264",
        "photos": [
            "places/ChIJQ9vMHipw5kcRWHC2ESjYaGQ/photos/photo1",
            "places/ChIJQ9vMHipw5kcRWHC2ESjYaGQ/photos/photo2",
            "places/ChIJQ9vMHipw5kcRWHC2ESjYaGQ/photos/photo3"
        ]
    },
    {
        "name": "Printemps Haussmann",
        "address": "64 Bd Haussmann, 75009 Paris, France",
        "rating": 4.7,
        "total_ratings": 35400,
        "place_id": "ChIJKwI_HgVv5kcRA-FR6d7yQ_Q",
        "types": [
            "department_store",
            "brunch_restaurant",
            "shoe_store",
            "clothing_store",
            "restaurant",
            "point_of_interest",
            "store",
            "establishment"
        ],
        "primary_type": "department_store",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.8737795,
            "longitude": 2.3281392
        },
        "editorial_summary": "Elegant department store in an iconic building with 10 domes selling fashion, beauty & luxury items.",
        "website": "https://www.printemps.com/fr/fr/printemps-paris-haussmann",
        "google_maps_url": "https://maps.google.com/?cid=17601178807905149187",
        "photos": [
            "places/ChIJKwI_HgVv5kcRA-FR6d7yQ_Q/photos/photo1",
            "places/ChIJKwI_HgVv5kcRA-FR6d7yQ_Q/photos/photo2",
            "places/ChIJKwI_HgVv5kcRA-FR6d7yQ_Q/photos/photo3"
        ]
    },
    {
        "name": "Grand Palais",
        "address": "75008 Paris, France",
        "rating": 4.5,
        "total_ratings": 27492,
        "place_id": "ChIJ0dzuSNBv5kcRa6BHUVdFm0k",
        "types": [
            "museum",
            "art_gallery",
            "monument",
            "tourist_attraction",
            "point_of_interest",
            "establishment"
        ],
        "primary_type": "museum",
        "is_open": False,
        "price_level": None,
        "location": {
            "latitude": 48.866109099999996,
            "longitude": 2.3124544
        },
        "editorial_summary": "Art nouveau hall with domed glass roof, built in 1900, hosting exhibitions and cultural events.",
        "website": "https://www.grandpalais.fr/",
        "google_maps_url": "https://maps.google.com/?cid=5303909227487010923",
        "photos": [
            "places/ChIJ0dzuSNBv5kcRa6BHUVdFm0k/photos/photo1",
            "places/ChIJ0dzuSNBv5kcRa6BHUVdFm0k/photos/photo2",
            "places/ChIJ0dzuSNBv5kcRa6BHUVdFm0k/photos/photo3"
        ]
    }
]


def get_mock_nearby_places_response(
    latitude: float,
    longitude: float,
    place_types: list[str],
    radius_miles: float
) -> dict:
    """
    Get a mock response for the nearby places endpoint.

    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        place_types: List of place types requested
        radius_miles: Search radius in miles

    Returns:
        Mock response dictionary
    """
    return {
        "success": True,
        "latitude": latitude,
        "longitude": longitude,
        "included_types": place_types,
        "radius_miles": radius_miles,
        "places": MOCK_NEARBY_PLACES,
        "error": None,
        "agent": "coordinator"
    }
