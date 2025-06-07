import userRouter from "./userRouters";
import { routesConfig } from "../config/routesConfig";
import sellerRouters from "./sellerRouters";
import adminRoutes from "./adminRouters";

let initWebRoutes = (app) => {
  app.use(routesConfig.users.name, userRouter);
  app.use(routesConfig.sellers.name, sellerRouters);
  app.use(routesConfig.admin.name, adminRoutes);
};

export default initWebRoutes;
