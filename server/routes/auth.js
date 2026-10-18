const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const autenticar = require("../middleware/autenticar");

const router = express.Router();

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas. Aguarde alguns minutos." }
});

const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function gerarToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/cadastro", limitador, async (req, res) => {
  const { nome, email, senha } = req.body ?? {};
  const nomeLimpo = String(nome ?? "").trim();
  const emailLimpo = String(email ?? "").trim().toLowerCase();
  const senhaTexto = String(senha ?? "");

  if (nomeLimpo.length < 2 || nomeLimpo.length > 80) {
    return res.status(400).json({ erro: "Informe um nome com 2 a 80 caracteres." });
  }
  if (!emailValido(emailLimpo) || emailLimpo.length > 120) {
    return res.status(400).json({ erro: "Informe um e-mail válido." });
  }
  if (senhaTexto.length < 8 || senhaTexto.length > 72) {
    return res.status(400).json({ erro: "A senha deve ter de 8 a 72 caracteres." });
  }

  try {
    const hash = await bcrypt.hash(senhaTexto, 10);
    const [resultado] = await db.execute(
      "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
      [nomeLimpo, emailLimpo, hash]
    );

    res.status(201).json({
      token: gerarToken(resultado.insertId),
      usuario: { id: resultado.insertId, nome: nomeLimpo, email: emailLimpo }
    });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }
    throw erro;
  }
});

router.post("/login", limitador, async (req, res) => {
  const { email, senha } = req.body ?? {};
  const emailLimpo = String(email ?? "").trim().toLowerCase();

  const [linhas] = await db.execute(
    "SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?",
    [emailLimpo]
  );
  const usuario = linhas[0];

  const confere = usuario && (await bcrypt.compare(String(senha ?? ""), usuario.senha_hash));
  if (!confere) {
    return res.status(401).json({ erro: "E-mail ou senha incorretos." });
  }

  res.json({
    token: gerarToken(usuario.id),
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
  });
});

router.get("/me", autenticar, async (req, res) => {
  const [linhas] = await db.execute(
    "SELECT id, nome, email FROM usuarios WHERE id = ?",
    [req.usuarioId]
  );
  if (!linhas[0]) return res.status(401).json({ erro: "Usuário não encontrado." });
  res.json(linhas[0]);
});

module.exports = router;
