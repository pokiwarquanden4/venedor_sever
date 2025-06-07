"use strict";
module.exports = (sequelize, DataTypes) => {
    const Advertisement = sequelize.define(
        "Advertisement",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            content: {
                type: DataTypes.STRING,
            },
            subcontent: {
                type: DataTypes.STRING,
            },
            imgURL: {
                type: DataTypes.STRING,
            },
        },
        {
            timestamps: true,
        }
    );

    return Advertisement;
};
