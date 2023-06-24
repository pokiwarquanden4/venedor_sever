"use strict";
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isSeller: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.RoomChat, {
      foreignKey: "roomId",
    });
  };
  return Message;
};
