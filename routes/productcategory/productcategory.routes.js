const express = require("express");
const {
  addcategory,
  getcategory,
  deletecategory,
  getcategorywise,
  getcategorywise_app
} = require("./productcategory");
const { upload } = require("../../middleware/Uploadimage");
const auth = require('../../middleware/Auth/auth')
const productRouter = express.Router();

/////////////////productcategory////////////////////////////
productRouter.post("/addcategory", upload.single("image"), addcategory);
productRouter.get("/getcategory", getcategory);
productRouter.post("/deletecategory", deletecategory);
productRouter.get('/products',getcategorywise)
productRouter.get('/productsApp', auth ,getcategorywise_app)

module.exports = productRouter;
