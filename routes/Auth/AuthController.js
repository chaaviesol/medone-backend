const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
//validate access token
const accessToken = async (req, res) => {
  const user = req.user;
  console.log("user_id", user);

  res.status(200).json({
    success: true,
    userId: user.userId,
    userType: user.userType,
  });
};

const refreshToken = (req, res) => {
  
  const user = req.user;
  console.log("refresh api triggered",user)

  const accessTokenPayload = {
    id: user.id,
    userType: user.userType,
  };
  const accessTokenOptions = {
    expiresIn: "10m",
  };
  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.ACCESS_TOKEN_SECRET,
    accessTokenOptions
  );
  res
    .status(201)
    .json({
      accessToken,
      userId: user?.id || user.userId,
      userType: user.userType,
      isUserAuthenticated: true,
    });
};

module.exports = {
  accessToken,
  refreshToken,
};
