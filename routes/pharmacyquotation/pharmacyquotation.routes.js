const express = require("express");
const { assignpharmacy,getpackedorders } = require("./pharmacyquotation.controller");

const pharmacyquotationRouter = express.Router()
pharmacyquotationRouter.post("/assignpharmacy", assignpharmacy);
pharmacyquotationRouter.get("/getpackedorders",getpackedorders)

module.exports = pharmacyquotationRouter;