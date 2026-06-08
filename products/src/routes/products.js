const express = require("express");
const fetch = require("node-fetch");
const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

const IS_REPLICA = process.env.IS_REPLICA === "true";
const REPLICA_URL = process.env.REPLICA_URL;

let readCounter = 0;

function shouldUseReplica() {
  if (IS_REPLICA || !REPLICA_URL) return false;
  readCounter++;
  return readCounter % 2 === 0;
}

router.get("/", async (req, res) => {
  try {
    if (shouldUseReplica()) {
      const response = await fetch(`${REPLICA_URL}/products`);
      if (response.ok) return res.json(await response.json());
    }
  } catch {}
  res.json(await readDB());
});

router.get("/:id", async (req, res) => {
  try {
    if (shouldUseReplica()) {
      const response = await fetch(`${REPLICA_URL}/products/${req.params.id}`);
      if (response.ok) return res.json(await response.json());
      if (response.status === 404)
        return res.status(404).json({ error: "Produto não encontrado" });
    }
  } catch {}
  const products = await readDB();
  const product = products.find((p) => p.id === req.params.id);
  if (!product)
    return res.status(404).json({ error: "Produto não encontrado" });
  res.json(product);
});

router.post("/", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Apenas admins podem criar produtos" });
  }
  const { name, description, category, price, stock, brand, thumbnail } =
    req.body;
  if (!name || price === undefined || stock === undefined) {
    return res
      .status(400)
      .json({ error: "name, price e stock são obrigatórios" });
  }
  const product = {
    id: uuidv4(),
    name,
    description: description || null,
    category: category || null,
    price,
    stock,
    brand: brand || null,
    thumbnail: thumbnail || null,
    createdAt: new Date().toISOString(),
  };
  const products = await readDB();
  products.push(product);
  await writeDB(products);

  if (!IS_REPLICA && REPLICA_URL) {
    const replicaRes = await fetch(`${REPLICA_URL}/internal/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!replicaRes.ok) {
      return res.status(502).json({ error: "Falha ao replicar produto" });
    }
  }

  res.status(201).json(product);
});

module.exports = router;
