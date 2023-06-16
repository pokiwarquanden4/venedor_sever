"use strict";
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "Customer",
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
      money: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
    },
    {
      timestamps: true,
    }
  );

  Customer.associate = (models) => {
    Customer.belongsTo(models.User, {
      foreignKey: "userId",
    });
  };
  return Customer;
};
