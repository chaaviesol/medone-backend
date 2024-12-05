const express = require("express");
const {
  getCurrentLocation,
  searchLocation,
} = require("./googlemap.controller");

const googleMapRouter = express.Router();

googleMapRouter.post("/getcurrentlocation", getCurrentLocation);
googleMapRouter.post("/searchlocation", searchLocation);

module.exports = googleMapRouter;
