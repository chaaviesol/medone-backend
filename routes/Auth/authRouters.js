const express = require("express");
const router = express.Router();

const authController = require("./AuthController");
const refreshAuth = require("../../middleware/Auth/refreshTokenAuth");
const auth=require("../../middleware/Auth/auth")

router.route("/accesstoken").post(auth,authController.accessToken);
router.route("/refreshtoken").post(refreshAuth, authController.refreshToken);

module.exports = router;
