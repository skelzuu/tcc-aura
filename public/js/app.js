/* =========================================
   Funções compartilhadas entre as páginas
   ========================================= */

const API = "/api";
const CHAVE_TOKEN = "persistance_token";
const CHAVE_USUARIO = "persistance_usuario";

const LOGO_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 5v22M13 5v22M19 5v22M25 5v22"/><path d="M2 22L30 10"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;


/* ---------- sessão ---------- */

function lerSessao(chave) {
    return localStorage.getItem(chave) ?? sessionStorage.getItem(chave);
}

function getToken() {
    return lerSessao(CHAVE_TOKEN);
}

function getUsuario() {
    try {
        return JSON.parse(lerSessao(CHAVE_USUARIO));
    } catch {
        return null;
    }
}

// guarda o usuário atualizado no mesmo lugar em que a sessão já estava
function atualizarUsuarioSalvo(usuario) {
    const storage = localStorage.getItem(CHAVE_TOKEN) ? localStorage : sessionStorage;
    storage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function limparSessao() {
    [localStorage, sessionStorage].forEach(function (storage) {
        storage.removeItem(CHAVE_TOKEN);
        storage.removeItem(CHAVE_USUARIO);
    });
}

// "lembrar" decide se a sessão sobrevive ao fechar o navegador
function salvarSessao(token, usuario, lembrar) {
    limparSessao();
    const storage = lembrar ? localStorage : sessionStorage;
    storage.setItem(CHAVE_TOKEN, token);
    storage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function sair() {
    limparSessao();
    window.location.href = "index.html";
}

function exigirLogin() {
    if (!getToken()) {
        window.location.replace("index.html");
        return false;
    }
    return true;
}


/* ---------- requisições ---------- */

async function api(rota, opcoes = {}) {
    const { metodo = "GET", corpo } = opcoes;
    const headers = {};
    const token = getToken();

    if (corpo) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    let resposta;

    try {
        resposta = await fetch(API + rota, {
            method: metodo,
            headers,
            body: corpo ? JSON.stringify(corpo) : undefined
        });
    } catch {
        throw new Error("Não foi possível conectar ao servidor.");
    }

    const dados = await resposta.json().catch(() => ({}));

    if (resposta.status === 401 && token) {
        limparSessao();
        window.location.replace("index.html");
        throw new Error("Sessão expirada. Entre novamente.");
    }

    if (!resposta.ok) {
        throw new Error(
            dados.erro || `O servidor respondeu com erro ${resposta.status}. Confira se abriu o site por http://localhost:3000.`
        );
    }

    return dados;
}


/* ---------- datas ---------- */

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// as datas ficam sempre ao meio-dia para o horário de verão não bagunçar a conta
function hoje() {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12);
}

function somarDias(data, dias) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias, 12);
}

function chaveData(data) {
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;
}

function dataDeChave(chave) {
    return new Date(`${chave}T12:00:00`);
}

function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function primeiroNome() {
    const usuario = getUsuario();
    return usuario ? usuario.nome.split(" ")[0] : "";
}


/* ---------- regras dos hábitos ---------- */

const DIAS_DA_FREQUENCIA = {
    "Todos os dias": [0, 1, 2, 3, 4, 5, 6],
    "Segunda a sexta": [1, 2, 3, 4, 5],
    "3x por semana": [1, 3, 5],
    "2x por semana": [2, 5]
};

// o hábito só conta a partir do dia em que foi criado e nos dias da frequência
function habitoPrevisto(habito, data) {
    if (chaveData(data) < habito.data_inicio) return false;
    return (DIAS_DA_FREQUENCIA[habito.frequencia] || []).includes(data.getDay());
}

function menorInicio(habitos) {
    return habitos.reduce(function (menor, h) {
        return h.data_inicio < menor ? h.data_inicio : menor;
    }, chaveData(hoje()));
}

// devolve { "2026-10-18": Set(ids dos hábitos concluídos) }
async function buscarConclusoes(de, ate) {
    const lista = await api(`/conclusoes?de=${de}&ate=${ate}`);
    const mapa = {};

    lista.forEach(function (c) {
        if (!mapa[c.data]) mapa[c.data] = new Set();
        mapa[c.data].add(c.habito_id);
    });

    return mapa;
}

function resumoDoDia(habitos, mapa, data) {
    const chave = chaveData(data);
    const previstos = habitos.filter(function (h) {
        return habitoPrevisto(h, data);
    });
    const feitos = previstos.filter(function (h) {
        return mapa[chave] && mapa[chave].has(h.id);
    }).length;

    return { previstos: previstos.length, feitos };
}

// dia fechado = todos os hábitos previstos concluídos.
// dias sem hábito previsto não quebram a sequência, e o dia de hoje
// ainda em aberto também não.
function calcularSequencias(habitos, mapa) {
    const fim = chaveData(hoje());
    let atual = 0;
    let melhor = 0;

    for (let d = dataDeChave(menorInicio(habitos)); chaveData(d) <= fim; d = somarDias(d, 1)) {
        const r = resumoDoDia(habitos, mapa, d);

        if (r.previstos === 0) continue;

        if (r.feitos === r.previstos) {
            atual++;
            melhor = Math.max(melhor, atual);
        } else if (chaveData(d) !== fim) {
            atual = 0;
        }
    }

    return { atual, melhor };
}


/* ---------- XP e nível ---------- */

// o XP não é guardado: é calculado em cima das conclusões do histórico
const XP_POR_HABITO = 10;
const XP_DIA_FECHADO = 20;

// XP acumulado necessário para chegar ao nível n (100, 300, 600, 1000...)
function xpDoNivel(n) {
    return 50 * n * (n - 1);
}

function calcularXP(habitos, mapa) {
    const fim = chaveData(hoje());
    let total = 0;

    Object.values(mapa).forEach(function (ids) {
        total += ids.size * XP_POR_HABITO;
    });

    for (let d = dataDeChave(menorInicio(habitos)); chaveData(d) <= fim; d = somarDias(d, 1)) {
        const r = resumoDoDia(habitos, mapa, d);
        if (r.previstos > 0 && r.feitos === r.previstos) total += XP_DIA_FECHADO;
    }

    let nivel = 1;
    while (total >= xpDoNivel(nivel + 1)) nivel++;

    const base = xpDoNivel(nivel);
    const proximo = xpDoNivel(nivel + 1);

    return {
        total,
        nivel,
        faltam: proximo - total,
        pct: Math.round(((total - base) / (proximo - base)) * 100)
    };
}

// "+10 XP" sobe da linha do hábito que acabou de ser marcado
function mostrarXP(linha, valor) {
    const aviso = document.createElement("span");
    aviso.className = "xp-pop";
    aviso.textContent = `+${valor} XP`;
    linha.appendChild(aviso);

    setTimeout(function () {
        aviso.remove();
    }, 1100);
}


/* ---------- conquistas ---------- */

// também derivadas do histórico, como o XP
function listarConquistas(habitos, mapa) {
    const fim = chaveData(hoje());
    const conclusoes = Object.values(mapa).reduce(function (soma, ids) {
        return soma + ids.size;
    }, 0);

    let diasFechados = 0;

    for (let d = dataDeChave(menorInicio(habitos)); chaveData(d) <= fim; d = somarDias(d, 1)) {
        const r = resumoDoDia(habitos, mapa, d);
        if (r.previstos > 0 && r.feitos === r.previstos) diasFechados++;
    }

    const melhor = calcularSequencias(habitos, mapa).melhor;
    const nivel = calcularXP(habitos, mapa).nivel;

    const lista = [
        ["Primeiro passo", "Concluir um hábito", conclusoes, 1],
        ["Dia fechado", "Concluir todos os hábitos de um dia", diasFechados, 1],
        ["Três seguidos", "Fechar 3 dias em sequência", melhor, 3],
        ["Semana inteira", "Fechar 7 dias em sequência", melhor, 7],
        ["Mês inteiro", "Fechar 30 dias em sequência", melhor, 30],
        ["50 conclusões", "Concluir 50 hábitos ao todo", conclusoes, 50],
        ["200 conclusões", "Concluir 200 hábitos ao todo", conclusoes, 200],
        ["Nível 5", "Chegar ao nível 5", nivel, 5]
    ];

    return lista.map(function (c) {
        return {
            titulo: c[0],
            descricao: c[1],
            atual: Math.min(c[2], c[3]),
            meta: c[3],
            feita: c[2] >= c[3]
        };
    });
}


/* ---------- movimento ---------- */

// as linhas entram em sequência só na primeira vez que a lista aparece
function animarEntrada(elemento) {
    elemento.classList.add("entrada");

    setTimeout(function () {
        elemento.classList.remove("entrada");
    }, 1000);
}

// preenche uma barra deslizando-a para dentro do trilho.
// transform é animado direto pela placa de vídeo, ao contrário de width/height.
function deslocamento(eixo, fracao) {
    const falta = (1 - fracao) * 100;
    return eixo === "x" ? `translateX(${-falta}%)` : `translateY(${falta}%)`;
}

function preencher(elemento, eixo, fracao) {
    elemento.style.transform = deslocamento(eixo, 0);

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            elemento.style.transform = deslocamento(eixo, fracao);
        });
    });
}


/* ---------- carregando e erro ---------- */

function criarBloco(container, classe) {
    const tag = container.tagName === "UL" || container.tagName === "OL" ? "li" : "div";
    const bloco = document.createElement(tag);
    bloco.className = classe;
    return bloco;
}

function mostrarCarregando(container, linhas) {
    container.innerHTML = "";

    for (let i = 0; i < linhas; i++) {
        const bloco = criarBloco(container, "esqueleto");
        bloco.setAttribute("aria-hidden", "true");
        container.appendChild(bloco);
    }
}

// quando a busca falha, mostra o motivo e um botão para tentar de novo
function mostrarErroCarga(container, mensagem) {
    container.innerHTML = "";

    const bloco = criarBloco(container, "vazio erro-carga");
    bloco.setAttribute("role", "alert");

    const titulo = document.createElement("h3");
    titulo.textContent = "Não foi possível carregar.";

    const texto = document.createElement("p");
    texto.textContent = mensagem;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn";
    botao.textContent = "Tentar de novo";
    botao.addEventListener("click", function () {
        window.location.reload();
    });

    bloco.append(titulo, texto, botao);
    container.appendChild(bloco);
}


/* ---------- pedaços de interface ---------- */

function criarInfoHabito(habito) {
    const info = document.createElement("div");
    info.className = "habito-info";

    const nome = document.createElement("span");
    nome.className = "habito-nome";
    nome.textContent = habito.nome;

    const meta = document.createElement("div");
    meta.className = "habito-meta";

    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta";
    etiqueta.textContent = habito.categoria;
    etiqueta.dataset.cat = habito.categoria;

    const frequencia = document.createElement("span");
    frequencia.textContent = habito.frequencia;

    meta.append(etiqueta, frequencia);
    info.append(nome, meta);

    return info;
}

// linha com caixa de marcar; a tela já muda na hora e volta atrás se o servidor falhar
function criarLinhaHabito(habito, feito, aoAlternar) {
    const linha = document.createElement("li");
    linha.className = "habito clicavel" + (feito ? " feito" : "");

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "tique";
    botao.innerHTML = CHECK_SVG;
    botao.setAttribute("role", "checkbox");
    botao.setAttribute("aria-checked", String(feito));
    botao.setAttribute("aria-label", habito.nome);

    linha.append(botao, criarInfoHabito(habito));

    let ocupado = false;

    linha.addEventListener("click", async function () {
        if (ocupado) return;
        ocupado = true;

        const novo = !linha.classList.contains("feito");
        linha.classList.toggle("feito", novo);
        botao.setAttribute("aria-checked", String(novo));

        try {
            await aoAlternar(novo, linha);
        } catch (erro) {
            linha.classList.toggle("feito", !novo);
            botao.setAttribute("aria-checked", String(!novo));
            toast(erro.message, "erro");
        }

        ocupado = false;
    });

    return linha;
}

function montarMenu(ativa) {
    const itens = [
        ["inicio", "home.html", "Início", `<path d="M3 11l9-8 9 8M5 10v10h14V10"/>`],
        ["habitos", "habitos.html", "Hábitos", `<path d="M9 6h11M9 12h11M9 18h11M3.5 6l1.2 1.2L6.8 5M3.5 12l1.2 1.2L6.8 11M3.5 18l1.2 1.2L6.8 17"/>`],
        ["estatisticas", "estatisticas.html", "Estatísticas", `<path d="M5 20V10M12 20V4M19 20v-7"/>`],
        ["historico", "historico.html", "Histórico", `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`],
        ["configuracoes", "configuracoes.html", "Configurações", `<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>`]
    ];

    const links = itens.map(function (item) {
        const atual = item[0] === ativa ? ' aria-current="page"' : "";
        const destaque = item[0] === ativa ? '<span class="destaque"></span>' : "";

        return `<a href="${item[1]}"${atual}>${destaque}<svg viewBox="0 0 24 24" aria-hidden="true">${item[3]}</svg>${item[2]}</a>`;
    }).join("");

    const menu = document.getElementById("menu");
    menu.className = "rail";
    menu.innerHTML = `
        <a class="logo" href="home.html">${LOGO_SVG}<span>persistance</span></a>
        <nav class="menu" aria-label="Principal">
            ${links}
            <a href="#" class="so-mobile" id="sairMobile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/></svg>Sair</a>
        </nav>
        <div class="rail-user">
            <strong id="menuNome"></strong>
            <button type="button" id="sairBotao">Sair da conta</button>
        </div>
    `;

    const usuario = getUsuario();
    document.getElementById("menuNome").textContent = usuario ? usuario.nome : "";

    document.getElementById("sairBotao").addEventListener("click", sair);
    document.getElementById("sairMobile").addEventListener("click", function (evento) {
        evento.preventDefault();
        sair();
    });
}

function toast(mensagem, tipo) {
    const aviso = document.createElement("div");
    aviso.className = "toast" + (tipo === "erro" ? " erro" : "");
    aviso.setAttribute("role", "status");
    aviso.textContent = mensagem;
    aviso.style.bottom = (28 + document.querySelectorAll(".toast").length * 58) + "px";
    document.body.appendChild(aviso);

    setTimeout(function () {
        aviso.classList.add("saindo");
    }, 2900);

    setTimeout(function () {
        aviso.remove();
    }, 3200);
}

function confirmar(opcoes) {
    return new Promise(function (resolver) {
        const caixa = document.createElement("dialog");
        caixa.innerHTML = `
            <h3></h3>
            <p></p>
            <div class="dialog-acoes">
                <button type="button" class="btn btn-claro" data-valor="0">Cancelar</button>
                <button type="button" class="btn btn-perigo" data-valor="1"></button>
            </div>
        `;

        caixa.querySelector("h3").textContent = opcoes.titulo;
        caixa.querySelector("p").textContent = opcoes.texto;
        caixa.querySelector(".btn-perigo").textContent = opcoes.botao || "Confirmar";

        caixa.querySelectorAll("button").forEach(function (botao) {
            botao.addEventListener("click", function () {
                caixa.close(botao.dataset.valor);
            });
        });

        caixa.addEventListener("close", function () {
            resolver(caixa.returnValue === "1");
            caixa.remove();
        });

        document.body.appendChild(caixa);
        caixa.showModal();
    });
}

// quadradinhos do painel azul das telas de login e cadastro
function desenharHeat() {
    const area = document.querySelector("[data-heat]");
    if (!area) return;

    let semente = 7;
    const sorteio = function () {
        semente = (semente * 9301 + 49297) % 233280;
        return semente / 233280;
    };

    for (let i = 0; i < 112; i++) {
        const quadro = document.createElement("i");

        if (sorteio() < 0.2 + (i / 112) * 0.7) {
            const r = sorteio();
            quadro.dataset.n = r < 0.5 ? 1 : r < 0.85 ? 2 : 3;
        }

        area.appendChild(quadro);
    }
}

desenharHeat();
