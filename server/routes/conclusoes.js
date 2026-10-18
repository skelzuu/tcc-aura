const express = require("express");
const db = require("../db");
const autenticar = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar);

const formatoData = /^\d{4}-\d{2}-\d{2}$/;

// lista as conclusões do usuário entre duas datas
router.get("/", async (req, res) => {
  const { de, ate } = req.query;
  if (!formatoData.test(de ?? "") || !formatoData.test(ate ?? "")) {
    return res.status(400).json({ erro: "Informe as datas no formato AAAA-MM-DD." });
  }

  const [linhas] = await db.execute(
    `SELECT c.habito_id, c.data
       FROM conclusoes c
       JOIN habitos h ON h.id = c.habito_id
      WHERE h.usuario_id = ? AND c.data BETWEEN ? AND ?`,
    [req.usuarioId, de, ate]
  );
  res.json(linhas);
});

// marca ou desmarca um hábito em uma data
router.put("/", async (req, res) => {
  const { habito_id, data, concluido } = req.body ?? {};
  if (!Number.isInteger(habito_id) || !formatoData.test(data ?? "") || typeof concluido !== "boolean") {
    return res.status(400).json({ erro: "Dados inválidos." });
  }

  const [habitos] = await db.execute(
    "SELECT id FROM habitos WHERE id = ? AND usuario_id = ?",
    [habito_id, req.usuarioId]
  );
  if (habitos.length === 0) {
    return res.status(404).json({ erro: "Hábito não encontrado." });
  }

  if (concluido) {
    await db.execute("INSERT IGNORE INTO conclusoes (habito_id, data) VALUES (?, ?)", [habito_id, data]);
  } else {
    await db.execute("DELETE FROM conclusoes WHERE habito_id = ? AND data = ?", [habito_id, data]);
  }
  res.json({ ok: true });
});

module.exports = router;
