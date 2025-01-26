const express = require("express");
const {
  addhospitalassistenquiry,
  addhospitalassist,
  gethospitalassistantreqs,
  physiotherapyenquiry,
  addphysiotherapy,
  getphysiotherapyreqs,
  addhomeServiceenquiry,
  addhomeservice,
  gethomeservicereqs,
  assistadd,
  getassists,
  getorderdetails,
  updatehomeservice,
  updatephysiotherapy,
  updatehospitalassistservice,
} = require("./services.controller");
const { upload } = require("../../middleware/Uploadimage");

const servicesRouter = express.Router();

servicesRouter.post("/addhospitalassistenquiry", addhospitalassistenquiry);
servicesRouter.post(
  "/addhospitalassist",
  upload.array("images"),
  addhospitalassist
);
servicesRouter.post("/physiotherapyenquiry", physiotherapyenquiry);
servicesRouter.post(
  "/addphysiotherapy",
  upload.array("images"),
  addphysiotherapy
);
servicesRouter.post("/addhomeServiceenquiry", addhomeServiceenquiry);
servicesRouter.post("/addhomeservice", upload.array("images"), addhomeservice);

////////////service-admin apis///////////
servicesRouter.post("/assistadd", assistadd);
servicesRouter.post("/getassists", getassists);
servicesRouter.post("/getorderdetails", getorderdetails);
servicesRouter.get("/gethospitalassistantreqs", gethospitalassistantreqs);
servicesRouter.get("/getphysiotherapyreqs", getphysiotherapyreqs);
servicesRouter.get("/gethomeservicereqs", gethomeservicereqs);
servicesRouter.post("/updatehomeservice", updatehomeservice);
servicesRouter.post("/updatephysiotherapy", updatephysiotherapy);
servicesRouter.post(
  "/updatehospitalassistservice",
  updatehospitalassistservice
);

module.exports = servicesRouter;
