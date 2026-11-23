(async function () {

    if (!exigirLogin()) return;
    montarMenu("inicio");

    const agora = hoje();
    const chaveHoje = chaveData(agora);

    const elHero = document.querySelector(".hoje");
    const elPlacar = document.getElementById("placar");
    const elPlacarTexto = document.getElementById("placarTexto");
    const elSequencia = document.getElementById("sequencia");
    const elFita = document.getElementById("fita");
    const elLista = document.getElementById("lista");
    const elLegenda = document.getElementById("legendaLista");
    const elNivelNumero = document.getElementById("nivelNumero");
    const elNivelXp = document.getElementById("nivelXp");
    const elNivelBarra = document.getElementById("nivelBarra");
    const elNivelFalta = document.getElementById("nivelFalta");

    // cabeçalho
    const horas = new Date().getHours();
    const saudacao = horas < 12 ? "Bom dia" : horas < 18 ? "Boa tarde" : "Boa noite";

    document.getElementById("saudacao").textContent = `${saudacao}, ${primeiroNome()}`;
    document.getElementById("dataHoje").textContent = capitalizar(
        new Intl.DateTimeFormat("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }).format(agora)
    );

    let habitos;
    let mapa;

    // o bloco azul fica sem conteúdo até os dados chegarem
    elHero.classList.add("carregando");
    mostrarCarregando(elLista, 3);

    try {
        habitos = await api("/habitos");
        mapa = await buscarConclusoes(menorInicio(habitos), chaveHoje);
    } catch (erro) {
        elHero.classList.remove("carregando");
        elLegenda.textContent = "";
        mostrarErroCarga(elLista, erro.message);
        return;
    }

    const previstosHoje = habitos.filter(function (h) {
        return habitoPrevisto(h, agora);
    });


    /* ---------- fita da semana ---------- */

    const pilulas = [];

    for (let i = 0; i < 7; i++) {
        const dia = somarDias(agora, i - 6);

        const coluna = document.createElement("div");
        coluna.className = "dia-fita" + (i === 6 ? " agora" : "");

        const pilula = document.createElement("div");
        pilula.className = "pilula";

        const nivel = document.createElement("i");
        pilula.appendChild(nivel);

        const rotulo = document.createElement("span");
        rotulo.textContent = DIAS_CURTOS[dia.getDay()];

        coluna.append(pilula, rotulo);
        elFita.appendChild(coluna);
        pilulas.push({ dia, nivel, coluna });
    }

    function pintarFita() {
        pilulas.forEach(function (item) {
            const r = resumoDoDia(habitos, mapa, item.dia);
            const fracao = r.previstos ? r.feitos / r.previstos : 0;

            item.nivel.style.transform = deslocamento("y", fracao);
            item.coluna.title = r.previstos ? `${r.feitos} de ${r.previstos} hábitos` : "Nada previsto";
        });
    }


    /* ---------- resumo ---------- */

    let animou = false;
    let xpAtual = null;

    function pintarNivel() {
        elNivelBarra.style.transform = deslocamento("x", xpAtual.pct / 100);
    }

    function atualizarResumo() {
        const r = resumoDoDia(habitos, mapa, agora);

        elPlacar.innerHTML = `${r.feitos}<span>/${r.previstos}</span>`;

        if (r.previstos === 0) {
            elPlacarTexto.textContent = "Nenhum hábito previsto para hoje.";
        } else if (r.feitos === r.previstos) {
            elPlacarTexto.textContent = "Dia fechado. Tudo marcado.";
        } else {
            const falta = r.previstos - r.feitos;
            elPlacarTexto.textContent = falta === 1
                ? "Falta 1 hábito para fechar o dia."
                : `Faltam ${falta} hábitos para fechar o dia.`;
        }

        const { atual } = calcularSequencias(habitos, mapa);

        elSequencia.textContent = atual > 0
            ? `${atual} ${atual === 1 ? "dia seguido" : "dias seguidos"} com tudo concluído.`
            : "Conclua todos os hábitos do dia para começar uma sequência.";

        xpAtual = calcularXP(habitos, mapa);

        elNivelNumero.textContent = `Nível ${xpAtual.nivel}`;
        elNivelXp.textContent = `${xpAtual.total} XP`;
        elNivelFalta.textContent = `Faltam ${xpAtual.faltam} XP para o nível ${xpAtual.nivel + 1}.`;

        if (animou) {
            pintarFita();
            pintarNivel();
        }
    }


    /* ---------- lista ---------- */

    function desenharLista() {
        elLista.innerHTML = "";

        if (habitos.length === 0) {
            elLegenda.textContent = "Nada por aqui ainda.";
            elLista.innerHTML = `
                <li class="vazio">
                    <h3>Você ainda não tem hábitos.</h3>
                    <p>Crie o primeiro e ele aparece aqui para você marcar todo dia.</p>
                    <a class="btn" href="habitos.html">Criar hábito</a>
                </li>
            `;
            return;
        }

        if (previstosHoje.length === 0) {
            elLegenda.textContent = "Sem hábitos previstos.";
            elLista.innerHTML = `
                <li class="vazio">
                    <h3>Hoje é dia de descanso.</h3>
                    <p>Nenhum dos seus hábitos está previsto para hoje.</p>
                </li>
            `;
            return;
        }

        const fora = habitos.length - previstosHoje.length;

        elLegenda.textContent = fora > 0
            ? `Toque para marcar. ${fora} ${fora === 1 ? "hábito fica" : "hábitos ficam"} para outro dia.`
            : "Toque para marcar o que você já fez.";

        previstosHoje.forEach(function (habito) {
            const feito = Boolean(mapa[chaveHoje] && mapa[chaveHoje].has(habito.id));

            elLista.appendChild(criarLinhaHabito(habito, feito, async function (novo, linha) {
                await api("/conclusoes", {
                    metodo: "PUT",
                    corpo: { habito_id: habito.id, data: chaveHoje, concluido: novo }
                });

                const antes = calcularXP(habitos, mapa);
                const conquistasAntes = listarConquistas(habitos, mapa);

                if (!mapa[chaveHoje]) mapa[chaveHoje] = new Set();

                if (novo) {
                    mapa[chaveHoje].add(habito.id);
                } else {
                    mapa[chaveHoje].delete(habito.id);
                }

                const depois = calcularXP(habitos, mapa);
                const conquistasDepois = listarConquistas(habitos, mapa);
                atualizarResumo();

                if (novo) {
                    mostrarXP(linha, depois.total - antes.total);

                    if (depois.nivel > antes.nivel) {
                        toast(`Você chegou ao nível ${depois.nivel}.`);
                    }

                    conquistasDepois.forEach(function (c, i) {
                        if (c.feita && !conquistasAntes[i].feita) {
                            toast(`Conquista desbloqueada: ${c.titulo}.`);
                        }
                    });
                }
            }));
        });
    }

    animarEntrada(elLista);
    desenharLista();
    atualizarResumo();

    elHero.classList.remove("carregando");

    // as barras sobem depois do primeiro desenho da tela
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            animou = true;
            pintarFita();
            pintarNivel();
        });
    });

})();
