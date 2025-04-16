import { checkConfigJWT } from "../config/routesConfig";
import { authenJWT } from "../service/jwt/jwtService";

const jwtMiddleware = async (req, res, next) => {
  try {
    const config = checkConfigJWT(req.originalUrl);
    if (config.jwt) {
      req.body.role = config.role;
      const user = await authenJWT(req, res);

      if (user.success) {
        if (!user.refreshToken) {
          req.body = {
            ...req.body,
            jwtAccount: user.account,
          };
        } else {
          req.body = {
            ...req.body,
            jwtAccount: user.account,
            refreshToken: user.refreshToken,
          };
        }
      } else {
        return res.status(401).json(user.message)
      }
    }
    next();
  } catch (err) {
    res.status(500).json(err);
  }
};

export const jwtMiddlewareController = async (req, res, next) => {
  return await jwtMiddleware(req, res, next);
};
