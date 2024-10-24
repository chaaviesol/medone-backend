const express = require("express");
const {
  addUsers,
  userLogin,
  getusers,
  edituser,
  completeRegistration,
  csvupload,
} = require("./user.controller");

const auth = require("../../middleware/Auth/auth");
const { upload } = require("../../middleware/Uploadimage");
const UserRouter = express.Router();

UserRouter.route("/addusers").post(addUsers);
UserRouter.route("/userlogin").post(userLogin);
UserRouter.route("/getusers").get(getusers);
UserRouter.post("/edituser", auth, upload.single("image"), edituser);

UserRouter.post(
  "/completeRegistration",
  auth,
  upload.single("image"),
  completeRegistration
);

///testing/////////////
// UserRouter.post("/decrypt", decryptEmails);
// UserRouter.route("/emailencryption").post(emailencryption);
UserRouter.post("/csvupload", csvupload);

module.exports = UserRouter;
