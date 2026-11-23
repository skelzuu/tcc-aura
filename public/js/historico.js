(async function () {

    if (!exigirLogin()) return;
    montarMenu("historico");

    const agora = hoje();
    const chaveHoje = chaveData(agora);

    const elCalendario = document.getElementById("calendario");
    const elMes = document.getElementById("mesAtual");
    const elLista = document.getElementById("listaDia");
    const elTituloDia = document.getElementById("tituloDia");
    const elResumoDia = document.getElementById("resumoDia");
    const botaoAnterior = document.getElementById("mesAnterior");
    const botaoProximo = document.getElementById("mesProximo");

    let ano = agora.getFullYear();
    let mes = agora.getMonth();
    let selecionado = chaveHoje;
    let habitos;
    let mapa = {};

    mostrarCarregando(elCalendario, 1);
    mostrarCarregando(elLista, 3);

    try {
        habitos = await api("/habitos");
    } catch (erro) {
        elLista.innerHTML = "";
        mostrarErroCarga(elCalendario, erro.message);
        return;
    }

    const inicioGeral = dataDeChave(menorInicio(habitos));

    async function carregarMes() {
        const primeiro = new Date(ano, mes, 1, 12);
        const ultimo = new Date(ano, mes + 1, 0, 12);

        mapa = await buscarConclusoes(chaveData(primeiro), chaveData(ultimo));
    }

    function nivelDoDia(data) {
        const r = resumoDoDia(habitos, mapa, data);

        if (r.previstos === 0) return "vazio";
        if (r.feitos === 0) return 0;
        if (r.feitos === r.previstos) return 4;

        const razao = r.feitos / r.previstos;
        return razao <= 0.34 ? 1 : razao <= 0.67 ? 2 : 3;
    }


    /* ---------- calendário ---------- */

    function desenharCalendario() {
        elCalendario.innerHTML = "";

        const rotuloMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
            .format(new Date(ano, mes, 1));

        elMes.textContent = capitalizar(rotuloMes);

        botaoAnterior.disabled = ano * 12 + mes <= inicioGeral.getFullYear() * 12 + inicioGeral.getMonth();
        botaoProximo.disabled = ano * 12 + mes >= agora.getFullYear() * 12 + agora.getMonth();

        DIAS_CURTOS.forEach(function (nome) {
            const cabecalho = document.createElement("div");
            cabecalho.className = "cal-semana";
            cabecalho.textContent = nome;
            elCalendario.appendChild(cabecalho);
        });

        const deslocamentoMes = new Date(ano, mes, 1).getDay();

        for (let i = 0; i < deslocamentoMes; i++) {
            const vazio = document.createElement("div");
            vazio.className = "cal-fora";
            elCalendario.appendChild(vazio);
        }

        const totalDias = new Date(ano, mes + 1, 0).getDate();

        for (let d = 1; d <= totalDias; d++) {
            const data = new Date(ano, mes, d, 12);
            const chave = chaveData(data);
            const r = resumoDoDia(habitos, mapa, data);

            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "cal-dia" + (chave === chaveHoje ? " agora" : "");
            botao.dataset.n = nivelDoDia(data);
            botao.textContent = d;
            botao.disabled = chave > chaveHoje;
            botao.setAttribute("aria-pressed", String(chave === selecionado));
            botao.setAttribute("aria-label", `${d} de ${rotuloMes}: ${r.feitos} de ${r.previstos} concluídos`);

            botao.addEventListener("click", function () {
                selecionado = chave;
                desenharCalendario();
                desenharDetalhe();
            });

            elCalendario.appendChild(botao);
        }
    }


    /* ---------- detalhe do dia ---------- */

    function atualizarResumoDia() {
        const data = dataDeChave(selecionado);
        const r = resumoDoDia(habitos, mapa, data);

        elResumoDia.textContent = r.previstos
            ? `${r.feitos} de ${r.previstos} concluídos`
            : "Nenhum hábito previsto neste dia.";
    }

    function desenharDetalhe() {
        const data = dataDeChave(selecionado);

        elTituloDia.textContent = capitalizar(
            new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(data)
        );

        elLista.innerHTML = "";
        atualizarResumoDia();

        habitos.filter(function (h) {
            return habitoPrevisto(h, data);
        }).forEach(function (habito) {
            const feito = Boolean(mapa[selecionado] && mapa[selecionado].has(habito.id));
            const chave = selecionado;

            elLista.appendChild(criarLinhaHabito(habito, feito, async function (novo) {
                await api("/conclusoes", {
                    metodo: "PUT",
                    corpo: { habito_id: habito.id, data: chave, concluido: novo }
                });

                if (!mapa[chave]) mapa[chave] = new Set();

                if (novo) {
                    mapa[chave].add(habito.id);
                } else {
                    mapa[chave].delete(habito.id);
                }

                atualizarResumoDia();
                desenharCalendario();
            }));
        });
    }


    /* ---------- troca de mês ---------- */

    async function irParaMes(variacao) {
        mes += variacao;

        if (mes < 0) { mes = 11; ano--; }
        if (mes > 11) { mes = 0; ano++; }

        selecionado = (ano === agora.getFullYear() && mes === agora.getMonth())
            ? chaveHoje
            : chaveData(new Date(ano, mes, 1, 12));

        try {
            await carregarMes();
        } catch (erro) {
            toast(erro.message, "erro");
        }

        desenharCalendario();
        desenharDetalhe();
    }

    botaoAnterior.addEventListener("click", function () { irParaMes(-1); });
    botaoProximo.addEventListener("click", function () { irParaMes(1); });

    try {
        await carregarMes();
    } catch (erro) {
        toast(erro.message, "erro");
    }

    desenharCalendario();
    desenharDetalhe();

})();
