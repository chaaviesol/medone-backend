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
  getorderdetails,
  getallpktests,
  labupdate,
  assignflebo,
  getphelboassists,
  prescriptionupload,
  prescriptionorder,
  getprods,
} = require("./labtest.controller");
const LabtestRouter = express.Router();
const auth = require("../../middleware/Auth/auth");
const { upload } = require("../../middleware/Uploadimage");

LabtestRouter.post("/labtestadd", labtestadd);
LabtestRouter.get("/getlabtests", getlabtests);
LabtestRouter.post("/package_add", package_add);
LabtestRouter.get("/getpackagetests", getpackagetests);
LabtestRouter.post("/labadd", labadd);
LabtestRouter.get("/getlabs", getlabs);
LabtestRouter.post("/lab_profile", lab_profile);
LabtestRouter.post("/testToCart", testToCart);
LabtestRouter.post("/gettestCart", gettestCart);
LabtestRouter.post("/removeTestFromCart", removeTestFromCart);
LabtestRouter.post("/labtestupdate", labtestupdate);
LabtestRouter.post("/package_update", package_update);
LabtestRouter.post("/getalltests", getalltests);
LabtestRouter.post("/getallpackages", getallpackages); ////get all packages with test length
LabtestRouter.post("/packagedetail", packagedetail); ///get a package with their test details
LabtestRouter.post("/testdetail", testdetail); ////details of a lab test
LabtestRouter.post("/getnearestlabs", getnearestlabs); ///////get nearest labs
LabtestRouter.post("/assignlab", assignlab);
LabtestRouter.post("/myorders", myorders);
LabtestRouter.post("/checkout", checkout);
LabtestRouter.get("/alltestlistorders", alltestlistorders); //////all normal orders not prescription
LabtestRouter.post("/getlaboratories", getlaboratories); ////get labs for assigning (based on tests and user pincode)
LabtestRouter.post("/gettestswithauth", auth, gettestswithauth);
LabtestRouter.post("/getpackageswithauth", auth, getpackageswithauth);
LabtestRouter.post("/packagedetailwithauth", auth, packagedetailwithauth);
LabtestRouter.post("/testdetailwithauth", auth, testdetailwithauth);
LabtestRouter.post("/getorderdetails", getorderdetails);
LabtestRouter.get("/getallpktests", getallpktests);
LabtestRouter.post("/labupdate", labupdate);
LabtestRouter.post("/assignflebo", assignflebo);
LabtestRouter.post("/getphelboassists", getphelboassists);
LabtestRouter.post(
  "/prescriptionupload",
  upload.array("images"),
  prescriptionupload
);
LabtestRouter.post("/prescriptionorder", prescriptionorder);
LabtestRouter.get("/getprods", getprods);

module.exports = LabtestRouter;
