const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { readDB, writeDB } = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email e password são obrigatórios" });
  }
  const users = await readDB();
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ error: "Email já cadastrado" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, passwordHash, role: "user" };
  users.push(user);
  await writeDB(users);
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email e password são obrigatórios" });
  }
  const users = await readDB();
  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

module.exports = router;
