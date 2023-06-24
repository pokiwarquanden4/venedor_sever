"use strict";
module.exports = (sequelize, DataTypes) => {
  const RoomChat = sequelize.define(
    "RoomChat",
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
      sellerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  RoomChat.associate = (models) => {
    RoomChat.belongsTo(models.User, {
      foreignKey: "userId",
    });
    RoomChat.belongsTo(models.User, {
      foreignKey: "sellerId",
    });
    RoomChat.hasMany(models.Message, {
      foreignKey: "roomId",
    });
  };
  return RoomChat;
};
