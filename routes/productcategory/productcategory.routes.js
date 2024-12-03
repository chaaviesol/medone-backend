const express = require("express");
const {
  addcategory,
  getcategory,
  deletecategory,
  getcategorywise
} = require("./productcategory");
const { upload } = require("../../middleware/Uploadimage");

const productRouter = express.Router();

/////////////////productcategory////////////////////////////
productRouter.post("/addcategory", upload.single("image"), addcategory);
productRouter.get("/getcategory", getcategory);
productRouter.post("/deletecategory", deletecategory);
productRouter.get('/products',getcategorywise)

module.exports = productRouter;
