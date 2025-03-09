"use strict";
module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define(
        "Category",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            categoryName: {
                type: DataTypes.STRING,
                allowNull: false,
            }
        },
        {
            timestamps: true,
        }
    );

    Category.associate = (models) => {
        Category.hasMany(models.Storage, {
            foreignKey: "categoryId",
        });
    };

    return Category;
};
