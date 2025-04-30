import jwt from "jsonwebtoken";

export const createJWT = (data) => {
  const user = {
    account: data.account,
    roleName: data.roleName,
  };
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  return accessToken;
};

export const createRefreshToken = (data) => {
  const user = {
    account: data.account,
    roleName: data.roleName,
  };
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "4h",
  });
  return refreshToken;
};

export const authenJWT = (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log(authHeader)
  let users;
  if (token == null) {
    return {
      success: false,
      message: "Token is null",
    };
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          return {
            success: false,
            message: "Token is invalid",
          };
        } else {
          if (req.body.role === undefined || user.roleName === req.body.role) {
            users = user;
            users.refreshToken = true;
          } else {
            return {
              success: false,
              message: "You don't have permission",
            };
          }
        }
      });
    } else {
      if (req.body.role === undefined || user.roleName === req.body.role) {
        users = user;
      } else {
        return {
          success: false,
          message: "You don't have permission",
        };
      }
    }
  });

  users.success = true
  return users;
};

export const responseWithJWT = (req, obj, user) => {
  return req.body.refreshToken && user
    ? {
      accessToken: createJWT(user),
      refreshToken: createRefreshToken(user),
      obj: obj,
    }
    : {
      obj: obj,
    };
};
