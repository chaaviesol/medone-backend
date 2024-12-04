const express = require("express");
const { assignpharmacy,getpackedorders,getpharmacies,getproductspharmacy } = require("./pharmacyquotation.controller");

const pharmacyquotationRouter = express.Router()
pharmacyquotationRouter.post("/assignpharmacy", assignpharmacy);
pharmacyquotationRouter.get("/getpackedorders",getpackedorders)
pharmacyquotationRouter.post("/getpharmacies",getpharmacies)
pharmacyquotationRouter.post("/getproductsph",getproductspharmacy)
module.exports = pharmacyquotationRouter;