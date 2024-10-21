const jwt = require("jsonwebtoken");

const refreshAuth = (req, res, next) => {
  const refreshToken = req.headers.authorization.split(" ")[1];
  // console.log("authorization =>",refreshToken);
  if (!refreshToken) {
    return res.send("login pls");
  }
  try {
    const refreshDecoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (refreshDecoded) {
      req.user = refreshDecoded;
    }
    return next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).send("Invalid token");
    } else {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
  }
};

module.exports = refreshAuth;
