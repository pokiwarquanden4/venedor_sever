"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const WishList = sequelize.define(
    "WishList",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  WishList.associate = (models) => {
    WishList.belongsTo(models.User, {
      foreignKey: "userId",
    });
    WishList.belongsTo(models.Storage, {
      foreignKey: "productId",
    });
  };

  return WishList;
};
