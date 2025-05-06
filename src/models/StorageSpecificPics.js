"use strict";
module.exports = (sequelize, DataTypes) => {
    const StorageSpecificPics = sequelize.define(
        "StorageSpecificPics",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                type: DataTypes.INTEGER,
            },
            option1: {
                type: DataTypes.STRING,
            },
            option2: {
                type: DataTypes.STRING,
            },
            storageId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            price: {
                type: DataTypes.BIGINT,
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            number: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                },
            },
            saleOff: {
                type: DataTypes.INTEGER,
            },
            imgURL: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            listImgURL: {
                type: DataTypes.TEXT,
            },
        },
        {
            timestamps: true,
        }
    );

    StorageSpecificPics.associate = (models) => {
        StorageSpecificPics.belongsTo(models.Storage, {
            foreignKey: "storageId",
        });
        StorageSpecificPics.hasMany(models.Cart, {
            foreignKey: "specificPicsId",
        });
        StorageSpecificPics.hasMany(models.History, {
            foreignKey: "specificPicsId",
        });
    };

    return StorageSpecificPics;
};
