const express = require("express");

const {
  labtestadd,
  getlabtests,
  package_add,
  getpackagetests,
  labadd,
  getlabs,
  lab_profile,
  testToCart,
  gettestCart,
  removeTestFromCart
} = require("./labtest.controller");
const LabtestRouter = express.Router();
console.log("labtestt")
const auth = require("../../middleware/Auth/auth");

LabtestRouter.post("/labtestadd", labtestadd);
LabtestRouter.get("/getlabtests", getlabtests);
LabtestRouter.post("/package_add", package_add);
LabtestRouter.get("/getpackagetests", getpackagetests);
LabtestRouter.post("/labadd",labadd)
LabtestRouter.get("/getlabs",getlabs)
LabtestRouter.post("/lab_profile",lab_profile)
LabtestRouter.post("/testToCart",auth,testToCart)
LabtestRouter.get("/gettestCart",auth,gettestCart)
LabtestRouter.post("/removeTestFromCart",auth,removeTestFromCart)

module.exports = LabtestRouter;
