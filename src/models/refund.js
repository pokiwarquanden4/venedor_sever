"use strict";
module.exports = (sequelize, DataTypes) => {
    const Refund = sequelize.define(
        "Refund",
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
            historyId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            reason: {
                type: DataTypes.STRING,
            },
            evidenceURL: {
                type: DataTypes.STRING,
            },
            refundBankURL: {
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

    Refund.associate = (models) => {
        Refund.belongsTo(models.User, {
            foreignKey: "userId",
        });
        Refund.belongsTo(models.Storage, {
            foreignKey: "productId",
        });
        Refund.belongsTo(models.History, {
            foreignKey: "historyId",
        });
    };
    return Refund;
};
