const express = require("express");
const {
  addhospitalassistenquiry,
  addhospitalassist,
  gethospitalassistantreqs,
  physiotherapyenquiry,
  addphysiotherapy,
  getphysiotherapyreqs,
  addhomeServiceenquiry,
  addhomeservice
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
servicesRouter.post('/addhomeServiceenquiry',addhomeServiceenquiry)
servicesRouter.post('/addhomeservice',upload.array("images"),addhomeservice)

module.exports = servicesRouter;
