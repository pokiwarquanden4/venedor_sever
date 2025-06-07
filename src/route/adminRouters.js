import express from "express";
import multer from "multer";
import { routesConfig } from "../config/routesConfig";
import { jwtMiddlewareController } from "../middleware/jwtMiddleware";
import { createRefundController, createReportController, disableUserController, getAllReportedController, getGraphController, getSellerListController, getUserListController, handleReportController } from "../controller/adminController";

const upload = multer({ storage: multer.memoryStorage() });

//Routers
const adminRoutes = express.Router();

adminRoutes.get(
    routesConfig.admin.getUserList.name,
    jwtMiddlewareController,
    getUserListController
);

adminRoutes.get(
    routesConfig.admin.getSellerList.name,
    jwtMiddlewareController,
    getSellerListController
);

adminRoutes.get(
    routesConfig.admin.getGraph.name,
    jwtMiddlewareController,
    getGraphController
);

adminRoutes.get(
    routesConfig.admin.getAllReported.name,
    jwtMiddlewareController,
    getAllReportedController
);

adminRoutes.post(
    routesConfig.admin.handleReport.name,
    jwtMiddlewareController,
    handleReportController
);

adminRoutes.post(
    routesConfig.admin.disableUser.name,
    jwtMiddlewareController,
    disableUserController
);

adminRoutes.post(
    routesConfig.admin.createReport.name,
    jwtMiddlewareController,
    createReportController
);

adminRoutes.post(
    routesConfig.admin.createRefund.name,
    jwtMiddlewareController,
    createRefundController
);

export default adminRoutes;