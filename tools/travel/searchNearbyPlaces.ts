import type { HotelResults } from "../../types/hotel/hotels.js";
import type { RestaurantResults } from "../../types/restaurant/restaurants.js";
import type { Activities } from "../../types/activities/activities.js";
import type { Nature } from "../../types/nature/nature.js";
import type { SelfieSpots } from "../../types/selfie/selfieSpots.js";

const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchNearby";
const RADIUS_METERS = 10000.0;
const MAX_RESULTS = 10;
const FETCH_PHOTO_CATEGORY = process.env.FETCH_PLACES_PHOTOS;

type PlacesType = "hotel" | "restaurant" | "activities" | "nature" | "selfie";

/** Configuration for each place type.
 * includedTypes: Array of place types to search for.
 * fieldMask: Field mask for the Google Place API of what types of data to return.
 */

const typeConfig: Record<
  PlacesType,
  { includedTypes: string[]; fieldMask: string }
> = {
  hotel: {
    includedTypes: ["hotel"],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.rating,places.location,places.websiteUri,places.photos",
  },
  restaurant: {
    includedTypes: ["restaurant", "fast_food_restaurant", "cafe", "food_court"],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.primaryTypeDisplayName,places.websiteUri,places.photos",
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
      "places.id,places.displayName,places.formattedAddress,places.editorialSummary,places.websiteUri,places.photos",
  },
  nature: {
    includedTypes: ["park", "national_park", "campground", "hiking_area"],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.editorialSummary,places.websiteUri,places.photos",
  },
  selfie: {
    includedTypes: ["tourist_attraction", "museum", "art_gallery", "zoo"],
    fieldMask:
      "places.id,places.displayName,places.formattedAddress,places.editorialSummary,places.websiteUri,places.photos",
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
  photos?: { name: string }[];
}

/**
 * Takes a Google Place and an image URL and returns a reshaped HotelResults object
 * @param {GooglePlace} place - Google Place API result
 * @param {string} imageUrl - URL of the hotel's photo
 * @returns {HotelResults} - Reshaped hotel result object
 */
function reshapeHotel(place: GooglePlace, imageUrl: string): HotelResults {
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
    imageUrl: imageUrl,
  };
}

/**
 * Takes a Google Place and an image URL and returns a reshaped RestaurantResults object
 * @param {GooglePlace} place - Google Place API result
 * @param {string} imageUrl - URL of the restaurant's photo
 * @returns {RestaurantResults} - Reshaped restaurant result object
 */
function reshapeRestaurant(
  place: GooglePlace,
  imageUrl: string,
): RestaurantResults {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
    imageUrl: imageUrl,
  };
}

/**
 * Takes a Google Place and an image URL and returns a reshaped Activities object
 * @param {GooglePlace} place - Google Place API result
 * @param {string} imageUrl - URL of the activity spot's photo
 * @returns {Activities} - Reshaped activity spot object
 */
function reshapeActivity(place: GooglePlace, imageUrl: string): Activities {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
    imageUrl: imageUrl,
  };
}

/**
 * Takes a Google Place and an image URL and returns a reshaped Nature object
 * @param {GooglePlace} place - Google Place API result
 * @param {string} imageUrl - URL of the nature spot's photo
 * @returns {Nature} - Reshaped nature spot object
 */
function reshapeNature(place: GooglePlace, imageUrl: string): Nature {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
    imageUrl: imageUrl,
  };
}

/**
 * Takes a Google Place and an image URL and returns a reshaped SelfieSpots object
 * @param {GooglePlace} place - Google Place API result
 * @param {string} imageUrl - URL of the selfie spot's photo
 * @returns {SelfieSpots} - Reshaped selfie spot object
 */
function reshapeSelfie(place: GooglePlace, imageUrl: string): SelfieSpots {
  return {
    id: place.id,
    name: place.displayName?.text ?? "",
    location: place.formattedAddress ?? "",
    description: place.editorialSummary?.text ?? "",
    website: place.websiteUri ?? "",
    imageUrl: imageUrl,
  };
}

/**
 * Fetches a photo URL from the Google Places API
 * @param {string} photoName - Photo name from a Google Places API result
 * @returns {Promise<string>} - URL of the photo or an empty string if the request fails
 */
async function fetchPhotoUrl(photoName: string): Promise<string> {
  const googleUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400`;
  const response = await fetch(googleUrl, {
    headers: {
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
    },
    redirect: "manual",
  });
  return response.headers.get("Location") ?? "";
}

/**
 * Searches Google Places API for nearby places of a given type
 * @param {PlacesType} type - Type of places to search for (hotel, restaurant, activities, nature, selfie)
 * @param {number} latitude - Latitude of the search location
 * @param {number} longitude - Longitude of the search location
 * @returns {Promise<HotelResults[] | RestaurantResults[] | Activities[] | Nature[] | SelfieSpots[]>}
 *   - Promise resolving to an array of reshaped places objects
 */
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

  if (type === "hotel") {
    return Promise.all(
      places.map(async (place) => {
        const photoName = place.photos?.[0]?.name;
        const imageUrl =
          (FETCH_PHOTO_CATEGORY === "hotel" ||
            FETCH_PHOTO_CATEGORY === "all") &&
          photoName
            ? await fetchPhotoUrl(photoName)
            : "";
        return reshapeHotel(place, imageUrl);
      }),
    );
  }

  if (type === "restaurant") {
    return Promise.all(
      places.map(async (place) => {
        const photoName = place.photos?.[0]?.name;
        const imageUrl =
          (FETCH_PHOTO_CATEGORY === "restaurant" ||
            FETCH_PHOTO_CATEGORY === "all") &&
          photoName
            ? await fetchPhotoUrl(photoName)
            : "";
        return reshapeRestaurant(place, imageUrl);
      }),
    );
  }

  if (type === "activities") {
    return Promise.all(
      places.map(async (place) => {
        const photoName = place.photos?.[0]?.name;
        const imageUrl =
          (FETCH_PHOTO_CATEGORY === "activity" ||
            FETCH_PHOTO_CATEGORY === "all") &&
          photoName
            ? await fetchPhotoUrl(photoName)
            : "";
        return reshapeActivity(place, imageUrl);
      }),
    );
  }

  if (type === "nature") {
    return Promise.all(
      places.map(async (place) => {
        const photoName = place.photos?.[0]?.name;
        const imageUrl =
          (FETCH_PHOTO_CATEGORY === "nature" ||
            FETCH_PHOTO_CATEGORY === "all") &&
          photoName
            ? await fetchPhotoUrl(photoName)
            : "";
        return reshapeNature(place, imageUrl);
      }),
    );
  }

  // Returns Selfie Data
  return Promise.all(
    places.map(async (place) => {
      const photoName = place.photos?.[0]?.name;
      const imageUrl =
        (FETCH_PHOTO_CATEGORY === "selfie" || FETCH_PHOTO_CATEGORY === "all") &&
        photoName
          ? await fetchPhotoUrl(photoName)
          : "";
      return reshapeSelfie(place, imageUrl);
    }),
  );
}
