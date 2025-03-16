const { Sequelize } = require("sequelize");

export const sequelize = new Sequelize("venedor", "root", null, {
  host: "localhost",
  dialect: "mysql",
  logging: (msg) => {
    if (msg.includes("ERROR")) {
      console.error(msg);
    }
  },
});

let connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export default connectDB;
