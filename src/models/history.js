"use strict";
module.exports = (sequelize, DataTypes) => {
  const History = sequelize.define(
    "History",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      specificPicsId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      addressId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      paid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      cancel: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      feedbackId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  History.associate = (models) => {
    History.belongsTo(models.User, {
      foreignKey: "userId",
    });
    History.belongsTo(models.Storage, {
      foreignKey: "productId",
    });
    History.belongsTo(models.Address, {
      foreignKey: "addressId",
    });
    History.belongsTo(models.Comment, {
      foreignKey: "feedbackId",
    });
    History.belongsTo(models.StorageSpecificPics, {
      foreignKey: "specificPicsId",
    });
  };
  return History;
};
