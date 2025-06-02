"use strict";

module.exports = (sequelize, DataTypes) => {
  const Seller = sequelize.define(
    "Seller",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      sellerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalMoney: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      ranking: {
        type: DataTypes.INTEGER,
      },
      permit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  Seller.associate = (models) => {
    Seller.belongsTo(models.User, {
      foreignKey: "sellerId",
    });
    Seller.hasMany(models.Staff, {
      foreignKey: "sellerId",
    });
  };
  return Seller;
};
