"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const Storage = sequelize.define(
    "Storage",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      sellerId: {
        type: DataTypes.INTEGER,
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      shipping: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      sold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      rate: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      detailDescription: {
        type: DataTypes.TEXT,
      },
      number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      saleOff: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0,
        },
      },
      imgURL: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      listImgURL: {
        type: DataTypes.TEXT,
      },
      category: {
        type: DataTypes.STRING,
      },
      disable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  Storage.associate = (models) => {
    Storage.belongsTo(models.User, {
      foreignKey: "sellerId",
    });
    Storage.hasMany(models.History, {
      foreignKey: "productId",
    });
    Storage.hasMany(models.Cart, {
      foreignKey: "productId",
    });
    Storage.hasOne(models.DailyDeal, {
      foreignKey: "productId",
    });
    Storage.hasMany(models.WishList, {
      foreignKey: "productId",
    });
  };

  return Storage;
};
