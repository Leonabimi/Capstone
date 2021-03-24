const express = require("express");
const listEndpoints = require("express-list-endpoints");
const cors = require("cors");
const mongoose = require("mongoose");
const services = require("./services");
const passport = require("passport");
const cookieParser = require("cookie-parser");

const {
  notFoundHandler,
  forbiddenHandler,
  badRequestHandler,
  genericErrorHandler,
} = require("./errorHandlers");

const server = express();
const port = process.env.PORT || 3001;

const whitelist = ["http://localhost:3000"];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== 1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

server.use(cors(corsOptions));
server.use(express.json());
server.use(cookieParser());
server.use(passport.initialize());

server.use("/api", services);

server.use(badRequestHandler);
server.use(forbiddenHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

console.log(listEndpoints(server));

mongoose
  .connect(process.env.MONGO_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(
    server.listen(port, () => {
      console.log("Server is running on port: ", port);
    })
  );
