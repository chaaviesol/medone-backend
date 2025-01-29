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
  assignassist,
  gethomecareassists,
  allassists,
  priceadd,
  getphysioassists
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
servicesRouter.post("/addphysiotherapy", addphysiotherapy);
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
servicesRouter.post("/assignassist",assignassist)
servicesRouter.post("/getphysioassists",getphysioassists)
servicesRouter.post("/gethomecareassists",gethomecareassists)
servicesRouter.post("/allassists",allassists)
servicesRouter.post("/priceadd",priceadd)
module.exports = servicesRouter;
