const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  console.log("accessToken apii :============================================")
  // const { accessToken } = req.cookies;
  const accessToken = req.headers.authorization.split(" ")[1];
  // console.log("accessToken :", accessToken)
  if (!accessToken) {
    return res.send("login pls");
  }
  //decode the accessToken and get id
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    // console.log({decoded})
    req.user = decoded;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error:true,
        message:"Invalid token"
      });
    } else {
      console.error(error);
      return res.status(500).send("Internal server error");
    }
  }
};

module.exports = auth;
