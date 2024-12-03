const express = require("express");
const {
  updatedchat,
  productadd,
  getproducts,
  addToCart,
  getCart,
  removeFromCart,
  salesorder,
  getasalesorder,
  updatesalesorder,
  presciptionsaleorders,
  allsalelistorders,
  pharmacyadd,
  getpharmacy,
  filterpharmacy,
  checkaddress,
  disableproduct,
  medicineadd,
  createinvoice,
  getainvoice,
  prescriptioninvoice,
  myorders,
  getinvsalesorder
} = require("./pharmacy.controller");
const PharmacyRouter = express.Router();
const { upload } = require("../../middleware/Uploadimage");
const auth = require("../../middleware/Auth/auth");

PharmacyRouter.post("/pharmacyadd", pharmacyadd);
PharmacyRouter.get("/getpharmacy", getpharmacy);
PharmacyRouter.post("/filterpharmacy", filterpharmacy);

PharmacyRouter.post("/productadd", upload.array("images"), productadd);
PharmacyRouter.post("/disableproduct", disableproduct);
PharmacyRouter.get("/getproducts", getproducts);
PharmacyRouter.post("/addToCart", auth, addToCart);
PharmacyRouter.post("/removeFromCart", auth, removeFromCart);
PharmacyRouter.get("/getCart", auth, getCart);
PharmacyRouter.post("/updatedchat", updatedchat);

////salesorder//////////////////////////
PharmacyRouter.post("/salesorder", upload.array("images"), auth, salesorder);
PharmacyRouter.post("/getasalesorder", getasalesorder);
PharmacyRouter.post("/updatesalesorder", updatesalesorder);
PharmacyRouter.get("/prescriptionlist", presciptionsaleorders);
PharmacyRouter.get("/allsalelist", allsalelistorders);
PharmacyRouter.post("/checkaddress", auth, checkaddress);
PharmacyRouter.post("/medicineadd", medicineadd);
PharmacyRouter.get("/myorders", auth, myorders);
///////////////invoice///////////////////////////
PharmacyRouter.post("/createinvoice", createinvoice);
PharmacyRouter.post("/prescriptioninvoice", prescriptioninvoice);
PharmacyRouter.post("/getainvoice", getainvoice);
PharmacyRouter.post("/getinvsalesorder",getinvsalesorder)//get a sales order`

module.exports = PharmacyRouter;
