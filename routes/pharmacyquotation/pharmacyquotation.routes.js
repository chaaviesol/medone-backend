const express = require("express");
const { assignpharmacy,getpackedorders,getpharmacies,getproductspharmacy,getorderdetails } = require("./pharmacyquotation.controller");

const pharmacyquotationRouter = express.Router()
pharmacyquotationRouter.post("/assignpharmacy", assignpharmacy);
pharmacyquotationRouter.get("/getpackedorders",getpackedorders)
pharmacyquotationRouter.post("/getpharmacies",getpharmacies)
pharmacyquotationRouter.post("/getproductsph",getproductspharmacy)
pharmacyquotationRouter.post("/getorderdetails",getorderdetails)
module.exports = pharmacyquotationRouter;