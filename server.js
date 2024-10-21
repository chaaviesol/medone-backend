const express = require("express");
require("dotenv").config();

const bodyParser = require("body-parser");
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const server = express();
const cors = require("cors");
const authRouter = require("./routes/Auth/authRouters");
const HospitalRouter = require("./routes/hospital/hospital.routes");
const UserRouter = require("./routes/user/user.routes");
const medoneRouter = require("./routes/medOne/medone.routes");
server.use(
  cors({
    origin: "*",
    allowedHeaders: "X-Requested-With,Content-Type,auth-token,Authorization",
    credentials: true,
  })
);
server.use(bodyParser.json());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use("/auth", authRouter);
server.use("/hospital", HospitalRouter);
server.use("/user", UserRouter);
server.use("/medone",medoneRouter)

if (process.env.NODE_ENV === "development") {
  server.listen(PORT, () => {
    console.log(`server started at ${HOST}:${PORT}`);
  });
}
