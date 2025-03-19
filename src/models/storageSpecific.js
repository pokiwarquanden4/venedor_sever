"use strict";
module.exports = (sequelize, DataTypes) => {
    const StorageSpecific = sequelize.define(
        "StorageSpecific",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            specificName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            storageId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            specific: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            timestamps: true,
        }
    );

    StorageSpecific.associate = (models) => {
        StorageSpecific.belongsTo(models.Storage, {
            foreignKey: "storageId",
        });
    };

    return StorageSpecific;
};
