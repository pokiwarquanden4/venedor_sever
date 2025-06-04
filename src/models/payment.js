"use strict";
module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define(
        "Payment",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            gateway: {
                type: DataTypes.STRING, // Brand name của ngân hàng
                allowNull: false,
            },
            transactionDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            accountNumber: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            content: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            transferType: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            transferAmount: {
                type: DataTypes.BIGINT,
                allowNull: false,
            },
            accumulated: {
                type: DataTypes.BIGINT,
                allowNull: true,
            },
            subAccount: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            referenceCode: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            historyId: {
                type: DataTypes.INTEGER,
                references: {
                    model: "Histories",
                    key: "id",
                },
            },
        },
        {
            timestamps: true,
        }
    );

    Payment.associate = (models) => {
        Payment.belongsTo(models.History, {
            foreignKey: "historyId",
        });
    };

    return Payment;
};