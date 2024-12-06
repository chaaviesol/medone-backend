const express = require("express");
const { assignpharmacy,getpackedorders,getpharmacies,getproductspharmacy,getorderdetails,
    getorderdetailsss
 } = require("./pharmacyquotation.controller");

const pharmacyquotationRouter = express.Router()
pharmacyquotationRouter.post("/assignpharmacy", assignpharmacy);
pharmacyquotationRouter.get("/getpackedorders",getpackedorders)
pharmacyquotationRouter.post("/getpharmacies",getpharmacies)
pharmacyquotationRouter.post("/getproductsph",getproductspharmacy)
pharmacyquotationRouter.post("/getorderdetails",getorderdetails)//////////working
pharmacyquotationRouter.post("/gettest",getorderdetailsss)//////////first
module.exports = pharmacyquotationRouter;