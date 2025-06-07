"use strict";
module.exports = (sequelize, DataTypes) => {
    const Policy = sequelize.define(
        "Policy",
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            name: {
                type: DataTypes.STRING,
            },
            content: {
                type: DataTypes.TEXT,
            },
        },
        {
            timestamps: true,
        }
    );

    return Policy;
};
