const express = require("express");
const {
  addUsers,
  userLogin,
  getusers,
  edituser,
  forgotPwd,
  completeRegistration,
  userdisable,
  getprofile,
  profilecompleted,
  UserforgotPwd,
  userresetpassword,
  userotpLogin,
  csvupload,
} = require("./user.controller");

const auth = require("../../middleware/Auth/auth");
const { upload } = require("../../middleware/Uploadimage");
const UserRouter = express.Router();

UserRouter.route("/addusers").post(addUsers);
UserRouter.route("/userlogin").post(userLogin);
UserRouter.route("/getusers").get(getusers);
UserRouter.post("/edituser", auth, upload.array("images"), edituser);

UserRouter.post(
  "/completeRegistration",
  auth,
  upload.single("image"),
  completeRegistration
);

UserRouter.post("/forgotpwd", forgotPwd); //forgot password api for lab,hospital& doctor
UserRouter.post("/userforgotpwd", UserforgotPwd);
UserRouter.post("/userresetpassword", userresetpassword);
UserRouter.post("/userotpLogin", userotpLogin);



UserRouter.route("/userdisable").post(userdisable);


UserRouter.post("/getprofile", auth, getprofile);
UserRouter.post("/profilecompleted", auth, profilecompleted); //to check if the user has completed their profile or not


///testing/////////////
// UserRouter.post("/decrypt", decryptEmails);
// UserRouter.route("/emailencryption").post(emailencryption);
UserRouter.post("/csvupload", csvupload);

module.exports = UserRouter;
