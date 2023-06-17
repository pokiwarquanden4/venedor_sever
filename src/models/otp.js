"use strict";
module.exports = (sequelize, DataTypes) => {
  const Otp = sequelize.define(
    "Otp",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expired: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );
  return Otp;
};
