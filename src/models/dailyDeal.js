"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const DailyDeal = sequelize.define(
    "DailyDeal",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      productId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      timestamps: true,
    }
  );

  DailyDeal.associate = (models) => {
    DailyDeal.belongsTo(models.Storage, {
      foreignKey: "productId",
    });
  };
  return DailyDeal;
};
