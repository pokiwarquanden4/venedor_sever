"use strict";
module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define(
    "Staff",
    {
      id: {
        allowNull: false,
        autoIncrement: true, // Thêm dòng này để tự động tăng
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      sellerId: {
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      salary: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      account: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  Staff.associate = (models) => {
    Staff.belongsTo(models.Seller, {
      foreignKey: "sellerId",
    });
  };
  return Staff;
};
