import express from "express";
import initWebRoutes from "./route/web";
import cors from "cors";
import connectDB from "./config/connectDB";
import db from "./models";
require("dotenv").config();

let app = express();
let port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
initWebRoutes(app);

db.sequelize.sync().then((req) => {
  app.listen(port, () => {
    console.log("Running on port: " + port);
  });
});
