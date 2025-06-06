export const routesConfig = {
  users: {
    name: "/users",
    login: {
      name: "/login",
      jwt: false,
      role: undefined,
    },
    askAI: {
      name: "/askAI",
      jwt: false,
      role: undefined,
    },
    createUser: {
      name: "/createUser",
      jwt: false,
      role: undefined,
    },
    makePayment: {
      name: "/makePayment",
      jwt: false,
      role: undefined,
    },
    getPayment: {
      name: "/getPayment",
      jwt: false,
      role: undefined,
    },
    createAddress: {
      name: "/createAddress",
      jwt: true,
      role: ["User"],
    },
    getAddress: {
      name: "/getAddress",
      jwt: true,
      role: ["User"],
    },
    editAddress: {
      name: "/editAddress",
      jwt: true,
      role: ["User"],
    },
    getUserData: {
      name: "/getUserData",
      jwt: true,
      role: undefined,
    },
    deleteAddress: {
      name: "/deleteAddress",
      jwt: true,
      role: ["User"],
    },
    getWishList: {
      name: "/getWishList",
      jwt: true,
      role: ["User"],
    },
    createWishList: {
      name: "/createWishList",
      jwt: true,
      role: ["User"],
    },
    deleteWishList: {
      name: "/deleteWishList",
      jwt: true,
      role: ["User"],
    },
    deleteAllWishList: {
      name: "/deleteAllWishList",
      jwt: true,
      role: ["User"],
    },
    wishList: {
      name: "/wishList",
      jwt: true,
      role: ["User"],
    },
    getCartProduct: {
      name: "/getCartProduct",
      jwt: true,
      role: ["User"],
    },
    deleteCartProduct: {
      name: "/deleteCartProduct",
      jwt: true,
      role: ["User"],
    },
    createCartProduct: {
      name: "/createCartProduct",
      jwt: true,
      role: ["User"],
    },
    editCartProduct: {
      name: "/editCartProduct",
      jwt: true,
      role: ["User"],
    },
    purchase: {
      name: "/purchase",
      jwt: true,
      role: ["User"],
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
      role: ["User"],
    },
    editAccount: {
      name: "/editAccount",
      jwt: true,
      role: undefined,
    },
    updatePassword: {
      name: "/updatePassword",
      jwt: true,
      role: undefined,
    },
    cancelOder: {
      name: "/cancelOder",
      jwt: true,
      role: ["User"],
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
    sendCreateAccountOTP: {
      name: "/sendCreateAccountOTP",
      jwt: false,
      role: undefined,
    },
    getComment: {
      name: "/getComment",
      jwt: false,
      role: undefined,
    },
    getCategory: {
      name: "/getCategory",
      jwt: false,
      role: undefined,
    },
    addComment: {
      name: "/addComment",
      jwt: true,
      role: undefined,
    },
    createRoomChat: {
      name: "/createRoomChat",
      jwt: true,
      role: ["User"],
    },
    getAllRoomChat: {
      name: "/getAllRoomChat",
      jwt: true,
      role: undefined,
    },
    getMessageByRoomChat: {
      name: "/getMessageByRoomChat",
      jwt: true,
      role: undefined,
    },
  },
  sellers: {
    name: "/sellers",
    createProduct: {
      name: "/createProduct",
      jwt: true,
      role: ["Seller", "Stocker"],
    },
    createStaff: {
      name: "/createStaff",
      jwt: true,
      role: ["Seller"],
    },
    editStaff: {
      name: "/editStaff",
      jwt: true,
      role: ["Seller"],
    },
    deleteStaff: {
      name: "/deleteStaff",
      jwt: true,
      role: ["Seller"],
    },
    getAllStaff: {
      name: "/getAllStaff",
      jwt: true,
      role: ["Seller"],
    },
    getShopRankingRating: {
      name: "/getShopRankingRating",
      jwt: true,
      role: ["Seller"],
    },
    getShopRankingSales: {
      name: "/getShopRankingSales",
      jwt: true,
      role: ["Seller"],
    },
    getStockNumber: {
      name: "/getStockNumber",
      jwt: true,
      role: ["Seller", 'Stocker'],
    },
    getShopRankingProductSales: {
      name: "/getShopRankingProductSales",
      jwt: true,
      role: ["Seller"],
    },
    getRankingData: {
      name: "/getRankingData",
      jwt: true,
      role: ["Seller"],
    },
    askOverviewAI: {
      name: "/askOverviewAI",
      jwt: true,
      role: ["Seller"],
    },
    getSaleToBuyData: {
      name: "/getSaleToBuyData",
      jwt: true,
      role: ["Seller"],
    },
    deleteProduct: {
      name: "/deleteProduct",
      jwt: true,
      role: ["Seller", 'Stocker'],
    },
    getSellerProducts: {
      name: "/getSellerProducts",
      jwt: true,
      role: ["Seller", 'Stocker'],
    },
    editProduct: {
      name: "/editProduct",
      jwt: true,
      role: ["Seller", 'Stocker'],
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
      role: ["Seller", 'Shipper', 'Stocker'],
    },
    editOrder: {
      name: "/editOrder",
      jwt: true,
      role: ["Seller", 'Shipper', 'Stocker'],
    },
  },
  admin: {
    name: "/admin",
    getUserList: {
      name: "/getUserList",
      jwt: true,
      role: ["Admin"],
    },
    getSellerList: {
      name: "/getSellerList",
      jwt: true,
      role: ["Admin"],
    },
    getGraph: {
      name: "/getGraph",
      jwt: true,
      role: ["Admin"],
    },
    getAllReported: {
      name: "/getAllReported",
      jwt: true,
      role: ["Admin"],
    },
    getAllRefund: {
      name: "/getAllRefund",
      jwt: true,
      role: ["Admin", 'Seller'],
    },
    handleReport: {
      name: "/handleReport",
      jwt: true,
      role: ["Admin"],
    },
    handleRefund: {
      name: "/handleRefund",
      jwt: true,
      role: ["Admin", 'Seller', 'User'],
    },
    disableUser: {
      name: "/disableUser",
      jwt: true,
      role: ["Admin"],
    },
    createReport: {
      name: "/createReport",
      jwt: true,
      role: ["User"],
    },
    createRefund: {
      name: "/createRefund",
      jwt: true,
      role: ["User"],
    },
  }
};

export const checkConfigJWT = (urlString) => {
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
      return null;
    }
  }

  return { jwt: config.jwt, role: config.role };
};
