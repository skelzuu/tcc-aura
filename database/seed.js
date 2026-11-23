/*
  Cria uma conta de demonstração com 35 dias de histórico.

  Como usar (na pasta do projeto, com o MySQL ligado):
      node database/seed.js

  Depois é só entrar com:
      e-mail: demo@persistance.com
      senha:  demo12345

  Rodar de novo apaga os hábitos da conta de demonstração e recria tudo,
  com as datas contadas a partir de hoje. Nenhuma outra conta é alterada.
*/

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const db = require("../server/db");

const EMAIL = "demo@persistance.com";
const SENHA = "demo12345";
const NOME = "Conta Demo";
const DIAS = 35;

// chance = probabilidade de cumprir o hábito nos dias comuns
const HABITOS = [
    { nome: "Beber 2L de água", categoria: "Saúde", frequencia: "Todos os dias", chance: 0.92 },
    { nome: "Estudar 1h", categoria: "Estudos", frequencia: "Segunda a sexta", chance: 0.86 },
    { nome: "Treinar", categoria: "Saúde", frequencia: "3x por semana", chance: 0.8 },
    { nome: "Ler 20 páginas", categoria: "Desenvolvimento", frequencia: "Todos os dias", chance: 0.66 },
    { nome: "Dormir antes das 23h", categoria: "Sono", frequencia: "Todos os dias", chance: 0.55 }
];

const DIAS_DA_FREQUENCIA = {
    "Todos os dias": [0, 1, 2, 3, 4, 5, 6],
    "Segunda a sexta": [1, 2, 3, 4, 5],
    "3x por semana": [1, 3, 5],
    "2x por semana": [2, 5]
};

// sorteio com semente fixa: a demonstração sai igual toda vez
let semente = 20260;
function sorteio() {
    semente = (semente * 9301 + 49297) % 233280;
    return semente / 233280;
}

function dataDaqui(diasAtras) {
    const t = new Date();
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - diasAtras, 12);
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");

    return { texto: `${d.getFullYear()}-${mes}-${dia}`, semana: d.getDay() };
}

/*
  Monta o histórico. Para a demonstração ficar com boas histórias:
    - os 6 dias antes de hoje estão todos fechados (sequência atual de 6)
    - 7 dias atrás houve uma falha, que quebrou a sequência anterior
    - de 16 a 8 dias atrás tudo fechado (recorde de 9)
    - 17 dias atrás houve outra falha
    - o resto varia, e hoje fica em branco para marcar ao vivo
*/
function decidir(diasAtras, indiceHabito, chance) {
    if (diasAtras >= 1 && diasAtras <= 6) return true;
    if (diasAtras === 7) return indiceHabito !== 3;
    if (diasAtras >= 8 && diasAtras <= 16) return true;
    if (diasAtras === 17) return indiceHabito !== 4;

    return sorteio() < chance;
}

async function principal() {
    // conta de demonstração: cria ou reaproveita
    const [achados] = await db.execute("SELECT id FROM usuarios WHERE email = ?", [EMAIL]);
    let usuarioId;

    if (achados.length > 0) {
        usuarioId = achados[0].id;
        await db.execute("DELETE FROM habitos WHERE usuario_id = ?", [usuarioId]);
    } else {
        const hash = await bcrypt.hash(SENHA, 10);
        const [novo] = await db.execute(
            "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)",
            [NOME, EMAIL, hash]
        );
        usuarioId = novo.insertId;
    }

    // hábitos, todos começando no primeiro dia do histórico
    const inicio = dataDaqui(DIAS).texto;
    const ids = [];

    for (const h of HABITOS) {
        const [r] = await db.execute(
            "INSERT INTO habitos (usuario_id, nome, categoria, frequencia, data_inicio) VALUES (?, ?, ?, ?, ?)",
            [usuarioId, h.nome, h.categoria, h.frequencia, inicio]
        );
        ids.push(r.insertId);
    }

    // conclusões
    const linhas = [];

    for (let diasAtras = DIAS; diasAtras >= 1; diasAtras--) {
        const dia = dataDaqui(diasAtras);

        HABITOS.forEach(function (h, i) {
            if (!DIAS_DA_FREQUENCIA[h.frequencia].includes(dia.semana)) return;

            if (decidir(diasAtras, i, h.chance)) {
                linhas.push([ids[i], dia.texto]);
            }
        });
    }

    await db.query("INSERT IGNORE INTO conclusoes (habito_id, data) VALUES ?", [linhas]);

    console.log("Conta de demonstração pronta.");
    console.log(`  e-mail: ${EMAIL}`);
    console.log(`  senha:  ${SENHA}`);
    console.log(`  ${HABITOS.length} hábitos e ${linhas.length} conclusões nos últimos ${DIAS} dias.`);
    console.log("  Hoje está em branco, para você marcar ao vivo na apresentação.");
}

principal()
    .catch(function (erro) {
        console.error("Não foi possível criar a conta de demonstração.");
        console.error(erro.message);
        console.error("Confira se o MySQL está ligado, se o .env está preenchido e se o schema.sql foi executado.");
        process.exitCode = 1;
    })
    .finally(function () {
        return db.end();
    });
