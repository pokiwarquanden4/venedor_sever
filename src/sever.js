import express from "express";
import initWebRoutes from "./route/web";
import cors from "cors";
import db from "./models";
import { Server } from "socket.io";
import http from "http";
import socketConnection from "./service/socket/socketMessage";
require("dotenv").config();

let app = express();
let port = process.env.PORT || 8080;

//Socket IO
var server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.URL_REACT } });

// //IO handle
// socketConnection(io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
initWebRoutes(app);

db.sequelize.sync().then((req) => {
  server.listen(port, () => {
    console.log("Running on port: " + port);
  });
});
