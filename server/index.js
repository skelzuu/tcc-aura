require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("Defina JWT_SECRET no arquivo .env antes de iniciar.");
  process.exit(1);
}

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/habitos", require("./routes/habitos"));
app.use("/api/conclusoes", require("./routes/conclusoes"));
app.use("/api", (req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

// o front fica na pasta public e é servido pelo próprio Express
app.use(express.static(path.join(__dirname, "..", "public")));

app.use((erro, req, res, next) => {
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido." });
  }
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

const porta = process.env.PORT || 3000;
app.listen(porta, () => {
  console.log(`Persistance rodando em http://localhost:${porta}`);
});
