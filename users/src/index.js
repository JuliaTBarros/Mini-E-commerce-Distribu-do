const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use("/users", authRoutes);
app.use("/users", userRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "users",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => console.log(`Users service running on port ${PORT}`));
