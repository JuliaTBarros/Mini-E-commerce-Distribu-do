const express = require("express");
const { readDB } = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/:id", auth, async (req, res) => {
  if (req.user.userId !== req.params.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  const users = await readDB();
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

module.exports = router;
