export const routesConfig = {
  users: {
    name: "/users",
    login: {
      name: "/login",
      jwt: false,
      role: undefined,
    },
    createUser: {
      name: "/createUser",
      jwt: false,
      role: undefined,
    },
    createAddress: {
      name: "/createAddress",
      jwt: true,
      role: "User",
    },
    getAddress: {
      name: "/getAddress",
      jwt: true,
      role: "User",
    },
    editAddress: {
      name: "/editAddress",
      jwt: true,
      role: "User",
    },
    deleteAddress: {
      name: "/deleteAddress",
      jwt: true,
      role: "User",
    },
    getWishList: {
      name: "/getWishList",
      jwt: true,
      role: "User",
    },
    createWishList: {
      name: "/createWishList",
      jwt: true,
      role: "User",
    },
    deleteWishList: {
      name: "/deleteWishList",
      jwt: true,
      role: "User",
    },
    deleteAllWishList: {
      name: "/deleteAllWishList",
      jwt: true,
      role: "User",
    },
    wishList: {
      name: "/wishList",
      jwt: true,
      role: "User",
    },
    getCartProduct: {
      name: "/getCartProduct",
      jwt: true,
      role: "User",
    },
    deleteCartProduct: {
      name: "/deleteCartProduct",
      jwt: true,
      role: "User",
    },
    createCartProduct: {
      name: "/createCartProduct",
      jwt: true,
      role: "User",
    },
    editCartProduct: {
      name: "/editCartProduct",
      jwt: true,
      role: "User",
    },
    purchase: {
      name: "/purchase",
      jwt: true,
      role: "User",
    },
    createOtp: {
      name: "/createOtp",
      jwt: false,
      role: undefined,
    },
    getPassword: {
      name: "/getPassword",
      jwt: false,
      role: undefined,
    },
    getHistory: {
      name: "/getHistory",
      jwt: true,
      role: "User",
    },
    editAccount: {
      name: "/editAccount",
      jwt: true,
      role: "User",
    },
    cancelOder: {
      name: "/cancelOder",
      jwt: true,
      role: "User",
    },
    getDailyDealsProduct: {
      name: "/getDailyDealsProduct",
      jwt: false,
      role: undefined,
    },
    getLatestProduct: {
      name: "/getLatestProduct",
      jwt: false,
      role: undefined,
    },
    getBestSellerProduct: {
      name: "/getBestSellerProduct",
      jwt: false,
      role: undefined,
    },
    getFeatureProduct: {
      name: "/getFeatureProduct",
      jwt: false,
      role: undefined,
    },
  },
  sellers: {
    name: "/sellers",
    createProduct: {
      name: "/createProduct",
      jwt: true,
      role: "Seller",
    },
    getAllProducts: {
      name: "/getAllProducts",
      jwt: true,
      role: "Seller",
    },
    editProduct: {
      name: "/editProduct",
      jwt: true,
      role: "Seller",
    },
    getProducts: {
      name: "/getProducts",
      jwt: false,
      role: undefined,
    },
    getProductById: {
      name: "/getProductById",
      jwt: false,
      role: undefined,
    },
    searchCategoryProduct: {
      name: "/searchCategoryProduct",
      jwt: false,
      role: undefined,
    },
    oder: {
      name: "/oder",
      jwt: true,
      role: "Seller",
    },
    editOrder: {
      name: "/editOrder",
      jwt: true,
      role: "Seller",
    },
  },
};

export const checkConfigJWT = (urlString) => {
  console.log("in check config jwt");

  const urlParts = urlString.split("/");
  let config = routesConfig;

  for (let i = 1; i < urlParts.length; i++) {
    const part =
      urlParts[i].indexOf("?") === -1
        ? urlParts[i]
        : urlParts[i].slice(0, urlParts[i].indexOf("?"));
    if (config[part]) {
      config = config[part];
    } else {
      console.log("return null");
      return null;
    }
  }

  console.log("out check configJWT");

  return { jwt: config.jwt, role: config.role };
};
