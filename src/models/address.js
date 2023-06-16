"use strict";
module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    "Address",
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
      name: {
        type: DataTypes.STRING,
      },
      company: {
        type: DataTypes.STRING,
      },
      address1: {
        type: DataTypes.TEXT,
      },
      address2: {
        type: DataTypes.TEXT,
      },
      city: {
        type: DataTypes.STRING,
      },
      country: {
        type: DataTypes.STRING,
      },
      phoneNumber: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
    {
      timestamps: true,
    }
  );

  Address.associate = (models) => {
    Address.belongsTo(models.User, {
      foreignKey: "userId",
    });
    Address.hasMany(models.History, {
      foreignKey: "addressId",
    });
  };
  return Address;
};
