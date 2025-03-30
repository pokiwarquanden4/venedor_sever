"use strict";
module.exports = (sequelize, DataTypes) => {
    const CategoryDetail = sequelize.define(
        "CategoryDetail",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            categoryName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            categoryId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            }
        },
        {
            timestamps: true,
        }
    );

    CategoryDetail.associate = (models) => {
        CategoryDetail.belongsTo(models.Category, {
            foreignKey: "categoryId",
        });
    };

    return CategoryDetail;
};
