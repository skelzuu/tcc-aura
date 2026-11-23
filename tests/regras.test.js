/*
  Testes das regras do sistema (frequência, sequência, XP, nível e conquistas).
  Não precisam de banco nem de navegador. Para rodar:  npm test
*/

const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

// carrega o app.js do site em um ambiente isolado, sem navegador
const codigo = fs.readFileSync(path.join(__dirname, "..", "public", "js", "app.js"), "utf8");
const ambiente = { document: { querySelector: () => null }, localStorage: {}, sessionStorage: {}, window: {}, console, Date, Intl };
vm.createContext(ambiente);
vm.runInContext(
    codigo + "\nthis.R = { habitoPrevisto, resumoDoDia, calcularSequencias, calcularXP, xpDoNivel, listarConquistas, dataDeChave, deslocamento, menorInicio };",
    ambiente
);
const R = ambiente.R;

// fixa o "hoje" em quarta-feira, 04/11/2026, para os testes não dependerem do dia em que rodam
ambiente.hoje = () => new Date(2026, 10, 4, 12);

const dia = (texto) => R.dataDeChave(texto);

function habito(id, frequencia, inicio) {
    return { id, frequencia, data_inicio: inicio };
}

function marcar(mapa, data, ...ids) {
    mapa[data] = new Set(ids);
}

/* ---------- frequência ---------- */

test("Todos os dias: o hábito aparece de domingo a sábado", () => {
    const h = habito(1, "Todos os dias", "2026-01-01");
    for (const d of ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07"]) {
        assert.equal(R.habitoPrevisto(h, dia(d)), true, d);
    }
});

test("Segunda a sexta: não aparece no sábado nem no domingo", () => {
    const h = habito(1, "Segunda a sexta", "2026-01-01");
    assert.equal(R.habitoPrevisto(h, dia("2026-11-02")), true);   // segunda
    assert.equal(R.habitoPrevisto(h, dia("2026-11-06")), true);   // sexta
    assert.equal(R.habitoPrevisto(h, dia("2026-11-07")), false);  // sábado
    assert.equal(R.habitoPrevisto(h, dia("2026-11-01")), false);  // domingo
});

test("3x por semana: segunda, quarta e sexta", () => {
    const h = habito(1, "3x por semana", "2026-01-01");
    assert.deepEqual([2, 3, 4, 5, 6].map((n) => R.habitoPrevisto(h, dia(`2026-11-0${n}`))), [true, false, true, false, true]);
});

test("2x por semana: terça e sexta", () => {
    const h = habito(1, "2x por semana", "2026-01-01");
    assert.deepEqual([2, 3, 4, 5, 6].map((n) => R.habitoPrevisto(h, dia(`2026-11-0${n}`))), [false, true, false, false, true]);
});

test("O hábito não conta em dias anteriores à data de início", () => {
    const h = habito(1, "Todos os dias", "2026-11-05");
    assert.equal(R.habitoPrevisto(h, dia("2026-11-04")), false);
    assert.equal(R.habitoPrevisto(h, dia("2026-11-05")), true);
});

/* ---------- resumo do dia ---------- */

test("Resumo do dia conta só os hábitos previstos e os concluídos", () => {
    const habitos = [habito(1, "Todos os dias", "2026-11-01"), habito(2, "Todos os dias", "2026-11-01"), habito(3, "2x por semana", "2026-11-01")];
    const mapa = {};
    marcar(mapa, "2026-11-04", 1);   // quarta: o hábito 3 (ter e sex) não é previsto
    const r = R.resumoDoDia(habitos, mapa, dia("2026-11-04"));
    assert.equal(r.previstos, 2);
    assert.equal(r.feitos, 1);
});

/* ---------- sequência ---------- */

test("Sequência: dias fechados seguidos, com o dia de hoje ainda em aberto", () => {
    const habitos = [habito(1, "Todos os dias", "2026-10-25")];
    const mapa = {};
    ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03"].forEach((d) => marcar(mapa, d, 1));
    const s = R.calcularSequencias(habitos, mapa);
    assert.equal(s.atual, 5);
    assert.equal(s.melhor, 5);
});

test("Sequência: fechar o dia de hoje soma mais um", () => {
    const habitos = [habito(1, "Todos os dias", "2026-10-25")];
    const mapa = {};
    ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"].forEach((d) => marcar(mapa, d, 1));
    assert.equal(R.calcularSequencias(habitos, mapa).atual, 6);
});

test("Sequência: um dia sem marcar zera a contagem, mas o recorde fica", () => {
    const habitos = [habito(1, "Todos os dias", "2026-10-25")];
    const mapa = {};
    ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"].forEach((d) => marcar(mapa, d, 1)); // 5 seguidos
    // 31/10 falhou
    ["2026-11-01", "2026-11-02", "2026-11-03"].forEach((d) => marcar(mapa, d, 1));                            // 3 seguidos
    const s = R.calcularSequencias(habitos, mapa);
    assert.equal(s.melhor, 5);
    assert.equal(s.atual, 3);
});

test("Sequência: esquecer o dia anterior zera a sequência atual", () => {
    const habitos = [habito(1, "Todos os dias", "2026-10-25")];
    const mapa = {};
    ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"].forEach((d) => marcar(mapa, d, 1));
    // 03/11 (ontem) ficou em branco
    const s = R.calcularSequencias(habitos, mapa);
    assert.equal(s.atual, 0);
    assert.equal(s.melhor, 4);
});

test("Sequência: dias sem hábito previsto não quebram a contagem", () => {
    // segunda a sexta: sábado e domingo não têm hábito previsto
    const habitos = [habito(1, "Segunda a sexta", "2026-10-26")];
    const mapa = {};
    ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02", "2026-11-03"].forEach((d) => marcar(mapa, d, 1));
    const s = R.calcularSequencias(habitos, mapa);
    assert.equal(s.atual, 7);
    assert.equal(s.melhor, 7);
});

/* ---------- XP e nível ---------- */

test("XP necessário para cada nível: 50 x n x (n - 1)", () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6].map(R.xpDoNivel), [0, 100, 300, 600, 1000, 1500]);
});

test("XP: 10 por hábito concluído e 20 de bônus por dia fechado", () => {
    const habitos = [habito(1, "Todos os dias", "2026-11-01"), habito(2, "Todos os dias", "2026-11-01")];
    const mapa = {};
    ["2026-11-01", "2026-11-02", "2026-11-03"].forEach((d) => marcar(mapa, d, 1, 2));   // 3 dias fechados
    const xp = R.calcularXP(habitos, mapa);
    assert.equal(xp.total, 6 * 10 + 3 * 20);   // 120
    assert.equal(xp.nivel, 2);
    assert.equal(xp.faltam, 180);
});

test("XP: um hábito solto vale 10 e não dá bônus", () => {
    const habitos = [habito(1, "Todos os dias", "2026-11-01"), habito(2, "Todos os dias", "2026-11-01")];
    const mapa = {};
    marcar(mapa, "2026-11-03", 1);
    assert.equal(R.calcularXP(habitos, mapa).total, 10);
});

test("XP: sem nada marcado, a pessoa está no nível 1", () => {
    const xp = R.calcularXP([habito(1, "Todos os dias", "2026-11-01")], {});
    assert.equal(xp.total, 0);
    assert.equal(xp.nivel, 1);
    assert.equal(xp.pct, 0);
});

/* ---------- conquistas ---------- */

test("Conquistas: desbloqueia as de início e mostra o progresso das outras", () => {
    const habitos = [habito(1, "Todos os dias", "2026-11-01")];
    const mapa = {};
    ["2026-11-01", "2026-11-02", "2026-11-03"].forEach((d) => marcar(mapa, d, 1));
    const c = Object.fromEntries(R.listarConquistas(habitos, mapa).map((x) => [x.titulo, x]));
    assert.equal(c["Primeiro passo"].feita, true);
    assert.equal(c["Dia fechado"].feita, true);
    assert.equal(c["Três seguidos"].feita, true);
    assert.equal(c["Semana inteira"].feita, false);
    assert.equal(c["Semana inteira"].atual, 3);
    assert.equal(c["Semana inteira"].meta, 7);
});

/* ---------- animação ---------- */

test("Deslocamento das barras: 0% preenchido esconde, 100% mostra", () => {
    assert.equal(R.deslocamento("y", 0), "translateY(100%)");
    assert.equal(R.deslocamento("y", 1), "translateY(0%)");
    assert.equal(R.deslocamento("x", 0.5), "translateX(-50%)");
});
