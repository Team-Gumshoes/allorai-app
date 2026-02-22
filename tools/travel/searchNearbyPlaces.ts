import type { HotelResults } from "../../types/hotel/hotels.js";
import type { RestaurantResults } from "../../types/restaurant/restaurants.js";
import type { Activities } from "../../types/activities/activities.js";
import type { Nature } from "../../types/nature/nature.js";
import type { SelfieSpots } from "../../types/selfie/selfieSpots.js";

const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchNearby";
const RADIUS_METERS = 10000.0;
const MAX_RESULTS = 10;

type PlacesType = "hotel" | "restaurant" | "activities" | "nature" | "selfie";

const typeConfig: Record<
  PlacesType,
  { includedTypes: string[]; fieldMask: string }
> = {
  hotel: {
    includedTypes: ["hotel"],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.rating,places.location,places.websiteUri",
  },
  restaurant: {
    includedTypes: ["restaurant", "fast_food_restaurant", "cafe", "food_court"],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.websiteUri",
  },
  activities: {
    includedTypes: [
      "tourist_attraction",
      "amusement_park",
      "museum",
      "art_gallery",
      "zoo",
    ],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.editorialSummary,places.websiteUri",
  },
  nature: {
    includedTypes: ["park", "national_park", "campground", "hiking_area"],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.editorialSummary,places.websiteUri",
  },
  selfie: {
    includedTypes: ["tourist_attraction", "museum", "art_gallery", "zoo"],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.editorialSummary,places.websiteUri",
  },
};

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  location?: { latitude: number; longitude: number };
  editorialSummary?: { text: string };
  primaryTypeDisplayName?: { text: string };
  websiteUri?: string;
}

function reshapeHotel(place: GooglePlace): HotelResults {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    ...(place.rating !== undefined && { rating: place.rating }),
    ...(place.location?.latitude !== undefined && {
      latitude: place.location.latitude,
    }),
    ...(place.location?.longitude !== undefined && {
      longitude: place.location.longitude,
    }),
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
  };
}

function reshapeRestaurant(place: GooglePlace): RestaurantResults {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
  };
}

function reshapeActivity(place: GooglePlace): Activities {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
  };
}

function reshapeNature(place: GooglePlace): Nature {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
  };
}

function reshapeSelfie(place: GooglePlace): SelfieSpots {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
  };
}

export async function searchNearbyPlaces(params: {
  type: PlacesType;
  latitude: number;
  longitude: number;
}): Promise<
  HotelResults[] | RestaurantResults[] | Activities[] | Nature[] | SelfieSpots[]
> {
  const { type, latitude, longitude } = params;
  const config = typeConfig[type];

  const body = {
    includedTypes: config.includedTypes,
    maxResultCount: MAX_RESULTS,
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius: RADIUS_METERS,
      },
    },
  };

  const response = await fetch(PLACES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
      "X-Goog-FieldMask": config.fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();
  const places: GooglePlace[] = data.places ?? [];

  if (type === "hotel") return places.map(reshapeHotel);
  if (type === "restaurant") return places.map(reshapeRestaurant);
  if (type === "activities") return places.map(reshapeActivity);
  if (type === "nature") return places.map(reshapeNature);
  return places.map(reshapeSelfie);
}
