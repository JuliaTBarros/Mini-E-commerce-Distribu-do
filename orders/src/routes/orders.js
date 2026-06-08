const express = require("express");
const fetch = require("node-fetch");
const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity) {
    return res
      .status(400)
      .json({ error: "productId e quantity são obrigatórios" });
  }
  try {
    const productRes = await fetch(
      `${process.env.PRODUCTS_URL}/products/${productId}`,
    );
    if (!productRes.ok) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
  } catch {
    return res.status(503).json({ error: "Serviço de produtos indisponível" });
  }
  const order = {
    id: uuidv4(),
    userId: req.user.userId,
    productId,
    quantity,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const orders = await readDB();
  orders.push(order);
  await writeDB(orders);
  res.status(201).json(order);
});

router.get("/:userId", auth, async (req, res) => {
  if (req.user.userId !== req.params.userId && req.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  const orders = await readDB();
  res.json(orders.filter((o) => o.userId === req.params.userId));
});

module.exports = router;
