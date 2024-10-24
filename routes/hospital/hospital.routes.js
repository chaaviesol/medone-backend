const express = require("express");
const {
  hospital_registration,
  hospital_login,
  get_hospital,
  edit_hospital,
  delete_hospital,
  add_doctor,
  consultation_data,
  filter_byName,
  hospital_filter,
  getHospitalAddress,
  get_hospitalBypin,
  doctor_consultationList,
  edit_consultation,
  delete_availability,
  getDoctorList,
  get_hospitalDetails,
  hospital_feedback,
  hospital_searchdata,
  hospital_doctordetails,
  getahospitalfeedback,
  feedbackapproval,
  get_feedback,
  get_searchdata,
  editbyadmin,
  hospital_disable,
  getunapprovehsptl,
  approvehospital,
  completeedit,
  hospital_doctors
} = require("./hospital.controller");
const { upload } = require("../../middleware/Uploadimage");
const HospitalRouter = express.Router();
const auth = require("../../middleware/Auth/auth");

HospitalRouter.post(
  "/registration",
  upload.array("image"),
  hospital_registration
);
HospitalRouter.post("/login", hospital_login);
HospitalRouter.get("/list", get_hospital);
HospitalRouter.post("/edit",auth, edit_hospital);
HospitalRouter.post("/delete",auth, delete_hospital);
HospitalRouter.post("/add_doctor", upload.single("image"),auth, add_doctor);
HospitalRouter.post("/consultation_details",auth, consultation_data); //adding the time of hospital
HospitalRouter.post("/by_name", filter_byName);
HospitalRouter.post("/filter", hospital_filter);
HospitalRouter.post("/getaddress", getHospitalAddress);
HospitalRouter.post("/pincode_result", get_hospitalBypin);
HospitalRouter.post("/consultationdata", doctor_consultationList);
HospitalRouter.post("/edit_consultation",auth, edit_consultation);
HospitalRouter.post("/delete_availability",auth, delete_availability);
HospitalRouter.post("/getdoctorlist", getDoctorList);
HospitalRouter.post("/hospitaldetails", get_hospitalDetails);
HospitalRouter.post("/hospital_feedback",auth, hospital_feedback);//add feedback
HospitalRouter.post("/hospital_searchdata",auth, hospital_searchdata);
HospitalRouter.post("/hospitaldoctordetails", hospital_doctordetails);
HospitalRouter.post("/getahospitalfeedback", getahospitalfeedback); //feedback of a single hospital
HospitalRouter.post("/feedbackapproval",auth, feedbackapproval);
HospitalRouter.get("/get_feedback", get_feedback); //all feedbacks
HospitalRouter.get("/get_searchdata",auth, get_searchdata); //all searchdata
HospitalRouter.post("/editbyadmin", auth,completeedit);
HospitalRouter.post("/hospitaldisable",auth, hospital_disable);
HospitalRouter.get("/getunapprovehsptl",auth, getunapprovehsptl);
HospitalRouter.post("/approvehospital",auth, approvehospital);
HospitalRouter.post('/hospital_doctors',hospital_doctors)

module.exports = HospitalRouter;
