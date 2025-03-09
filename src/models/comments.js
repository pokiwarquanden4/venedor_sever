"use strict";
module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define(
        "Comment",
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            parentId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "Categories", // Table name, not model name
                    key: "id",
                },
                onDelete: "CASCADE",
            },
            productId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            rate: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            content: {
                type: DataTypes.STRING,
            }
        },
        {
            timestamps: true,
        }
    );

    Comment.associate = (models) => {
        Comment.belongsTo(models.User, {
            foreignKey: "userId",
        });
        Comment.hasMany(models.Comment, {
            foreignKey: "parentId",
            as: "children",
        });
        Comment.belongsTo(models.Comment, {
            foreignKey: "parentId",
            as: "parent",
        });
    };

    return Comment;
};
