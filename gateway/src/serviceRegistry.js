const services = {
  users: {
    url: process.env.USERS_URL,
    status: "unknown",
    lastCheck: null,
    failCount: 0,
  },
  products: {
    url: process.env.PRODUCTS_URL,
    status: "unknown",
    lastCheck: null,
    failCount: 0,
  },
  orders: {
    url: process.env.ORDERS_URL,
    status: "unknown",
    lastCheck: null,
    failCount: 0,
  },
};

module.exports = { services };
