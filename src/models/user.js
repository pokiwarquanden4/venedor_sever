"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      otp: {
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: true,
    }
  );

  User.associate = (models) => {
    User.hasOne(models.Customer, {
      foreignKey: "userId",
    });
    User.hasMany(models.Storage, {
      foreignKey: "sellerId",
    });
    User.hasMany(models.Comment, {
      foreignKey: "userId",
    });
    User.hasMany(models.History, {
      foreignKey: "userId",
    });
    User.hasMany(models.Cart, {
      foreignKey: "userId",
    });
    User.hasOne(models.Seller, {
      foreignKey: "sellerId",
    });
    User.hasMany(models.Address, {
      foreignKey: "userId",
    });
    User.hasMany(models.WishList, {
      foreignKey: "userId",
    });
    User.hasMany(models.RoomChat, {
      foreignKey: "userId",
    });
    User.hasMany(models.RoomChat, {
      foreignKey: "sellerId",
    });
  };
  return User;
};
