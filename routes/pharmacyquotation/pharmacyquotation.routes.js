const express = require("express");
const {
  assignpharmacy,
  getpackedorders,
  getpharmacies,
  getproductspharmacy,
  getorderdetails,
  getorderdetailsss,
  myorderstatus,
  assigndeliverypartner,
  viewDeliveryPartners,
  adddeliverypartner,
  getdeliverypartners,
} = require("./pharmacyquotation.controller");

const pharmacyquotationRouter = express.Router();
pharmacyquotationRouter.post("/assignpharmacy", assignpharmacy);
pharmacyquotationRouter.get("/getpackedorders", getpackedorders);
pharmacyquotationRouter.post("/getpharmacies", getpharmacies);
pharmacyquotationRouter.post("/getproductsph", getproductspharmacy);
pharmacyquotationRouter.post("/getorderdetails", getorderdetails); //////////working
pharmacyquotationRouter.post("/gettest", getorderdetailsss); //////////first
pharmacyquotationRouter.post("/myorderstatus", myorderstatus);
pharmacyquotationRouter.post("/assigndeliverypartner", assigndeliverypartner);
pharmacyquotationRouter.post("/viewdeliverypartners", viewDeliveryPartners);
pharmacyquotationRouter.post("/adddeliverypartner", adddeliverypartner);
pharmacyquotationRouter.get("/getdeliverypartners", getdeliverypartners);
module.exports = pharmacyquotationRouter;
