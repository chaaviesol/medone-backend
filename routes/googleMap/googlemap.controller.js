const axios = require("axios");
const { logger } = require("../../utils");
const PLACES_API_URL =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";
require("dotenv").config();

const getCurrentLocation = async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({
      error: true,
      message: "Latitude and Longitude are required",
    });
  }
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await axios.get(geocodeUrl);

    if (response.data.status === "OK") {
      const addressComponents = response.data.results[0].address_components;

      const formattedAddress = response.data.results[0].formatted_address;
      const location = response.data.results[0].geometry.location;
      const districts = [
        "Alappuzha",
        "Ernakulam",
        "Idukki",
        "Kannur",
        "Kasaragod",
        "Kollam",
        "Kottayam",
        "Kozhikode",
        "Malappuram",
        "Palakkad",
        "Pathanamthitta",
        "Thiruvananthapuram",
        "Thrissur",
        "Wayanad",
      ];
      let district = null;

      for (let component of addressComponents) {
        const { long_name } = component;
        if (districts.includes(long_name)) {
          district = long_name;
          break;
        }
      }

      let country,
        state,
        city,
        streetAddress,
        sublocalityLevel_1,
        sublocalityLevel_2,
        postalCode;

      for (let component of addressComponents) {
        if (component.types.includes("country")) {
          country = component.long_name;
        }
        if (component.types.includes("administrative_area_level_1")) {
          state = component.long_name;
        }
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("sublocality_level_1")) {
          sublocalityLevel_1 = component.long_name;
        }
        if (component.types.includes("sublocality_level_2")) {
          sublocalityLevel_2 = component.long_name;
        }
        if (component.types.includes("route")) {
          streetAddress = component.long_name;
        }
        if (component.types.includes("postal_code")) {
          postalCode = component.long_name;
        }
      }

      return res.status(200).json({
        streetAddress,
        sublocalityLevel_1,
        sublocalityLevel_2,
        city,
        postalCode,
        state,
        country,
        formattedAddress,
        district,
        location,
      });
      // return res.status(200).json({
      //   data: response.data.results,
      // });
    } else {
      logger.error(`Geocoding failed in google map  API`);
      return res
        .status(400)
        .json({ error: `Geocoding failed: ${response.data.status}` });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in google map  API`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const searchLocation = async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({
      error: true,
      message: "search query  required",
    });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const AUTOCOMPLETE_API_URL =
      "https://maps.googleapis.com/maps/api/place/autocomplete/json";
    const response = await axios.get(AUTOCOMPLETE_API_URL, {
      params: {
        input: query,
        key: apiKey,
      },
    });
    res.status(200).json({
      data: response.data.predictions,
    });
  } catch (error) {
    logger.error("Error fetching autocomplete suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
};



const fetchPlaceDetails = async (req, res) => {
  const placeId = req.body.placeId;
  console.log(placeId);
  if (!placeId) {
    return res.status(400).json({
      error: true,
      message: "placeId  required",
    });
  }
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`
    );
    console.log(response);
    const placeDetails = response.data.result;

    const lat = placeDetails.geometry.location.lat;
    const lng = placeDetails.geometry.location.lng;
    res.status(200).json({
      lat,
      lng,
    });
  } catch (error) {
    logger.error("Error fetching place details:", error);
    res.status(500).json({ error: "Failed to fetch place details" });
  }
};



module.exports = {
  getCurrentLocation,
  searchLocation,
  fetchPlaceDetails
};
