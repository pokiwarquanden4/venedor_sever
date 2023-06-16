import userRouter from "./userRouters";
import { routesConfig } from "../config/routesConfig";
import sellerRouters from "./sellerRouters";

let initWebRoutes = (app) => {
  app.use(routesConfig.users.name, userRouter);
  app.use(routesConfig.sellers.name, sellerRouters);
};

export default initWebRoutes;
