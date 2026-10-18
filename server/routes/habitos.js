const express = require("express");
const db = require("../db");
const autenticar = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar);

const CATEGORIAS = ["Saúde", "Estudos", "Desenvolvimento", "Sono", "Outro"];
const FREQUENCIAS = ["Todos os dias", "Segunda a sexta", "3x por semana", "2x por semana"];
const COLUNAS = "id, nome, categoria, frequencia, data_inicio";

function lerCampos(corpo) {
  const nome = String(corpo?.nome ?? "").trim();
  const { categoria, frequencia } = corpo ?? {};

  if (nome.length < 1 || nome.length > 80) return { erro: "Dê um nome de até 80 caracteres ao hábito." };
  if (!CATEGORIAS.includes(categoria)) return { erro: "Categoria inválida." };
  if (!FREQUENCIAS.includes(frequencia)) return { erro: "Frequência inválida." };

  return { nome, categoria, frequencia };
}

router.get("/", async (req, res) => {
  const [linhas] = await db.execute(
    `SELECT ${COLUNAS} FROM habitos WHERE usuario_id = ? ORDER BY id`,
    [req.usuarioId]
  );
  res.json(linhas);
});

router.post("/", async (req, res) => {
  const campos = lerCampos(req.body);
  if (campos.erro) return res.status(400).json({ erro: campos.erro });

  const inicio = /^\d{4}-\d{2}-\d{2}$/.test(req.body.data_inicio ?? "")
    ? req.body.data_inicio
    : null;

  const [resultado] = await db.execute(
    `INSERT INTO habitos (usuario_id, nome, categoria, frequencia, data_inicio)
     VALUES (?, ?, ?, ?, COALESCE(?, CURDATE()))`,
    [req.usuarioId, campos.nome, campos.categoria, campos.frequencia, inicio]
  );

  const [linhas] = await db.execute(
    `SELECT ${COLUNAS} FROM habitos WHERE id = ?`,
    [resultado.insertId]
  );
  res.status(201).json(linhas[0]);
});

router.put("/:id", async (req, res) => {
  const campos = lerCampos(req.body);
  if (campos.erro) return res.status(400).json({ erro: campos.erro });

  const [resultado] = await db.execute(
    "UPDATE habitos SET nome = ?, categoria = ?, frequencia = ? WHERE id = ? AND usuario_id = ?",
    [campos.nome, campos.categoria, campos.frequencia, req.params.id, req.usuarioId]
  );
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ erro: "Hábito não encontrado." });
  }

  const [linhas] = await db.execute(
    `SELECT ${COLUNAS} FROM habitos WHERE id = ?`,
    [req.params.id]
  );
  res.json(linhas[0]);
});

router.delete("/:id", async (req, res) => {
  const [resultado] = await db.execute(
    "DELETE FROM habitos WHERE id = ? AND usuario_id = ?",
    [req.params.id, req.usuarioId]
  );
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ erro: "Hábito não encontrado." });
  }
  res.status(204).end();
});

module.exports = router;
