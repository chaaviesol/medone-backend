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
  removeTestFromCart,
  labtestupdate,
  package_update,
  getalltests,
  getallpackages,
  packagedetail,
  testdetail,
  getnearestlabs,
  assignlab,
  myorders,
  checkout,
  alltestlistorders,
  getlaboratories,
  gettestswithauth,
  getpackageswithauth,
  packagedetailwithauth,
  testdetailwithauth,
} = require("./labtest.controller");
const LabtestRouter = express.Router();
const auth = require("../../middleware/Auth/auth");

LabtestRouter.post("/labtestadd", labtestadd);
LabtestRouter.get("/getlabtests", getlabtests);
LabtestRouter.post("/package_add", package_add);
LabtestRouter.get("/getpackagetests", getpackagetests);
LabtestRouter.post("/labadd", labadd);
LabtestRouter.get("/getlabs", getlabs);
LabtestRouter.post("/lab_profile", lab_profile);
LabtestRouter.post("/testToCart", auth, testToCart);
LabtestRouter.get("/gettestCart", auth, gettestCart);
LabtestRouter.post("/removeTestFromCart", auth, removeTestFromCart);
LabtestRouter.post("/labtestupdate", labtestupdate);
LabtestRouter.post("/package_update", package_update);
LabtestRouter.post("/getalltests", getalltests);
LabtestRouter.post("/getallpackages", getallpackages); ////get all packages with test length
LabtestRouter.post("/packagedetail", packagedetail); ///get a package with their test details
LabtestRouter.post("/testdetail", testdetail); ////details of a lab test
LabtestRouter.post("/getnearestlabs", getnearestlabs); ///////get nearest labs
LabtestRouter.post("/assignlab", assignlab);
LabtestRouter.get("/myorders", auth, myorders);
LabtestRouter.post("/checkout", checkout);
LabtestRouter.get("/alltestlistorders", alltestlistorders);
LabtestRouter.post("/getlaboratories", getlaboratories); //get labs for assigning (based on tests and user pincode)
LabtestRouter.post("/gettestswithauth", auth, gettestswithauth);
LabtestRouter.post("/getpackageswithauth", auth, getpackageswithauth);
LabtestRouter.post("/packagedetailwithauth", auth, packagedetailwithauth);
LabtestRouter.post("/testdetailwithauth", auth, testdetailwithauth);
module.exports = LabtestRouter;
