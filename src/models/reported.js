"use strict";
module.exports = (sequelize, DataTypes) => {
    const Reported = sequelize.define(
        "Reported",
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
            reason: {
                type: DataTypes.STRING,
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
            }
        },
        {
            timestamps: true,
        }
    );

    Reported.associate = (models) => {
        Reported.belongsTo(models.User, {
            foreignKey: "userId",
        });
        Reported.belongsTo(models.Storage, {
            foreignKey: "productId",
        });
    };
    return Reported;
};
