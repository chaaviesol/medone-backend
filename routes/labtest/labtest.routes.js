const express = require("express");

const {
  labtestadd,
  getlabtests,
  package_add,
  getpackagetests
} = require("./labtest.controller");
const LabtestRouter = express.Router();

LabtestRouter.post("/labtestadd", labtestadd);
LabtestRouter.get("/getlabtests", getlabtests);
LabtestRouter.post("/package_add", package_add);
LabtestRouter.get("/getpackagetests", getpackagetests);

module.exports = LabtestRouter;
