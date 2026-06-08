const express = require("express");
const cors = require("cors");
const { writeDB, readDB } = require("./db");
const productsRoutes = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 5002;
const IS_REPLICA = process.env.IS_REPLICA === "true";

app.use(cors());
app.use(express.json());

app.use("/products", productsRoutes);

app.post("/internal/products", async (req, res) => {
  const product = req.body;
  if (!product || !product.id) {
    return res.status(400).json({ error: "Produto inválido" });
  }
  const products = await readDB();
  products.push(product);
  await writeDB(products);
  res.status(201).json(product);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "products",
    role: IS_REPLICA ? "replica" : "primary",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () =>
  console.log(
    `Products service (${IS_REPLICA ? "replica" : "primary"}) running on port ${PORT}`,
  ),
);
