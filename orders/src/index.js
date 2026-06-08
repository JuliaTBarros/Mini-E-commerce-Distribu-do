const express = require("express");
const cors = require("cors");
const ordersRoutes = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.use("/orders", ordersRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "orders",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => console.log(`Orders service running on port ${PORT}`));
