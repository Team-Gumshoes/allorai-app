"""
Mock data generators for testing without external API calls.
Used when USE_MOCK_RESPONSES environment variable is set to true.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta
import random


def generate_mock_hotels(
    location: str,
    check_in: str,
    check_out: str,
    guests: int = 2
) -> List[Dict[str, Any]]:
    """
    Generate mock hotel search results.

    Args:
        location: Hotel location
        check_in: Check-in date
        check_out: Check-out date
        guests: Number of guests

    Returns:
        List of mock hotel results
    """
    hotels = [
        {
            "id": "hotel_001",
            "name": f"Grand {location} Hotel",
            "location": location,
            "rating": 4.5,
            "price_per_night": 150.00,
            "total_price": 300.00,
            "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
            "available_rooms": 5,
            "check_in": check_in,
            "check_out": check_out
        },
        {
            "id": "hotel_002",
            "name": f"{location} Plaza Inn",
            "location": location,
            "rating": 4.2,
            "price_per_night": 120.00,
            "total_price": 240.00,
            "amenities": ["WiFi", "Breakfast", "Parking"],
            "available_rooms": 3,
            "check_in": check_in,
            "check_out": check_out
        },
        {
            "id": "hotel_003",
            "name": f"Budget Stay {location}",
            "location": location,
            "rating": 3.8,
            "price_per_night": 80.00,
            "total_price": 160.00,
            "amenities": ["WiFi", "Air Conditioning"],
            "available_rooms": 10,
            "check_in": check_in,
            "check_out": check_out
        }
    ]

    return hotels


def generate_mock_hotel_details(hotel_id: str) -> Dict[str, Any]:
    """
    Generate mock hotel details for a specific hotel.

    Args:
        hotel_id: Hotel identifier

    Returns:
        Mock hotel details
    """
    return {
        "id": hotel_id,
        "name": "Grand Hotel",
        "location": "Downtown",
        "rating": 4.5,
        "reviews": 1250,
        "description": "Luxury hotel in the heart of the city with stunning views.",
        "amenities": ["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Bar", "Room Service"],
        "room_types": [
            {
                "type": "Standard Room",
                "price": 150.00,
                "capacity": 2,
                "available": 5
            },
            {
                "type": "Deluxe Suite",
                "price": 250.00,
                "capacity": 4,
                "available": 2
            }
        ],
        "images": [
            "https://example.com/hotel1.jpg",
            "https://example.com/hotel2.jpg"
        ],
        "policies": {
            "check_in": "3:00 PM",
            "check_out": "11:00 AM",
            "cancellation": "Free cancellation up to 24 hours before check-in"
        }
    }


def generate_mock_car_rentals(
    location: str,
    pickup_date: str,
    return_date: str
) -> List[Dict[str, Any]]:
    """
    Generate mock car rental results.

    Args:
        location: Pickup location
        pickup_date: Pickup date
        return_date: Return date

    Returns:
        List of mock car rental results
    """
    car_types = ["Economy", "Compact", "Midsize", "SUV", "Luxury"]
    rentals = []

    for i, car_type in enumerate(car_types):
        rentals.append({
            "id": f"car_{i:03d}",
            "type": car_type,
            "model": f"{car_type} Car Model",
            "location": location,
            "price_per_day": 30 + (i * 20),
            "total_price": (30 + (i * 20)) * 2,  # Assuming 2 days
            "capacity": 4 + i,
            "transmission": "Automatic" if i % 2 == 0 else "Manual",
            "pickup_date": pickup_date,
            "return_date": return_date,
            "available": True
        })

    return rentals


def generate_mock_trains(
    origin: str,
    destination: str,
    travel_date: str
) -> List[Dict[str, Any]]:
    """
    Generate mock train search results.

    Args:
        origin: Origin station
        destination: Destination station
        travel_date: Travel date

    Returns:
        List of mock train results
    """
    trains = []
    base_time = datetime.strptime("08:00", "%H:%M")

    for i in range(5):
        departure_time = (base_time + timedelta(hours=i * 2)).strftime("%H:%M")
        arrival_time = (base_time + timedelta(hours=i * 2 + 3)).strftime("%H:%M")

        trains.append({
            "id": f"train_{i:03d}",
            "train_number": f"TR{1000 + i}",
            "origin": origin,
            "destination": destination,
            "departure_time": f"{travel_date} {departure_time}",
            "arrival_time": f"{travel_date} {arrival_time}",
            "duration": "3h 00m",
            "price": 50 + (i * 10),
            "class": "Economy" if i < 3 else "Business",
            "available_seats": random.randint(5, 50)
        })

    return trains


def generate_mock_local_transport(
    location: str,
    transport_type: str = "all"
) -> List[Dict[str, Any]]:
    """
    Generate mock local transport options.

    Args:
        location: Location for local transport
        transport_type: Type of transport (bus, metro, taxi, all)

    Returns:
        List of mock local transport options
    """
    transports = []

    if transport_type in ["bus", "all"]:
        transports.append({
            "type": "bus",
            "name": f"{location} City Bus",
            "coverage": "Entire city",
            "price": 2.50,
            "frequency": "Every 15 minutes",
            "operating_hours": "05:00 - 23:00"
        })

    if transport_type in ["metro", "all"]:
        transports.append({
            "type": "metro",
            "name": f"{location} Metro",
            "coverage": "Major routes",
            "price": 3.00,
            "frequency": "Every 5-10 minutes",
            "operating_hours": "05:30 - 00:30"
        })

    if transport_type in ["taxi", "all"]:
        transports.append({
            "type": "taxi",
            "name": "Local Taxi Service",
            "base_fare": 5.00,
            "per_km": 2.00,
            "availability": "24/7",
            "booking_methods": ["App", "Phone", "Street"]
        })

    return transports
