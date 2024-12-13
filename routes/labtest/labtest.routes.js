const express = require("express");

const {
  labtestadd,
  getlabtests,
  package_add,
} = require("./labtest.controller");
const LabtestRouter = express.Router();

LabtestRouter.post("/labtestadd", labtestadd);
LabtestRouter.get("/getlabtests", getlabtests);
LabtestRouter.post("/package_add", package_add);

module.exports = LabtestRouter;
