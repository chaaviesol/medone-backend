const express = require("express");
const {
  getCurrentLocation,
  searchLocation,
  fetchPlaceDetails
} = require("./googlemap.controller");

const googleMapRouter = express.Router();

googleMapRouter.post("/getcurrentlocation", getCurrentLocation);
googleMapRouter.post("/searchlocation", searchLocation);
googleMapRouter.post('/fetchplacedata',fetchPlaceDetails)

module.exports = googleMapRouter;
