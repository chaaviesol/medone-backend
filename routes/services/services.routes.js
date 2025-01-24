const express = require("express");
const {
  addhospitalassistenquiry,
  addhospitalassist,
  gethospitalassistantreqs,
  physiotherapyenquiry,
  addphysiotherapy,
  getphysiotherapyreqs,
} = require("./services.controller");
const { upload } = require("../../middleware/Uploadimage");
const auth = require("../../middleware/Auth/auth");

const servicesRouter = express.Router();

servicesRouter.post("/addhospitalassistenquiry", addhospitalassistenquiry);
servicesRouter.post(
  "/addhospitalassist",
  upload.array("images"),
  addhospitalassist
);
servicesRouter.get("/gethospitalassistantreqs", gethospitalassistantreqs);
servicesRouter.post("/physiotherapyenquiry", physiotherapyenquiry);

servicesRouter.post(
  "/addphysiotherapy",
  upload.array("images"),
  addphysiotherapy
);
servicesRouter.get("/getphysiotherapyreqs", getphysiotherapyreqs);

module.exports = servicesRouter;
