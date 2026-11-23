(async function () {

    if (!exigirLogin()) return;
    montarMenu("estatisticas");

    const agora = hoje();
    let periodo = 7;
    let habitos;
    let mapa;

    mostrarCarregando(document.getElementById("desempenho"), 3);

    try {
        habitos = await api("/habitos");

        const limite = chaveData(somarDias(agora, -29));
        const de = limite < menorInicio(habitos) ? limite : menorInicio(habitos);

        mapa = await buscarConclusoes(de, chaveData(agora));
    } catch (erro) {
        mostrarErroCarga(document.getElementById("desempenho"), erro.message);
        return;
    }

    const elGrafico = document.getElementById("grafico");
    const elDesempenho = document.getElementById("desempenho");

    function diasDoPeriodo() {
        const dias = [];

        for (let i = periodo - 1; i >= 0; i--) {
            dias.push(somarDias(agora, -i));
        }

        return dias;
    }

    function contarConclusoes(dia) {
        const chave = chaveData(dia);

        return habitos.filter(function (h) {
            return mapa[chave] && mapa[chave].has(h.id);
        }).length;
    }


    /* ---------- números do topo ---------- */

    function desenharResumo(dias) {
        const hojeResumo = resumoDoDia(habitos, mapa, agora);
        const taxaHoje = hojeResumo.previstos
            ? Math.round((hojeResumo.feitos / hojeResumo.previstos) * 100)
            : 0;

        document.getElementById("taxaHoje").textContent = `${taxaHoje}%`;
        document.getElementById("detalheHoje").textContent =
            `${hojeResumo.feitos} de ${hojeResumo.previstos} previstos`;

        const total = dias.reduce(function (soma, dia) {
            return soma + contarConclusoes(dia);
        }, 0);

        document.getElementById("totalPeriodo").textContent = total;
        document.getElementById("rotuloPeriodo").textContent = `Conclusões em ${periodo} dias`;

        const { atual, melhor } = calcularSequencias(habitos, mapa);

        document.getElementById("sequenciaAtual").textContent = `${atual} ${atual === 1 ? "dia" : "dias"}`;
        document.getElementById("recorde").textContent = `Recorde: ${melhor} ${melhor === 1 ? "dia" : "dias"}`;
    }


    /* ---------- gráfico ---------- */

    function desenharGrafico(dias) {
        elGrafico.innerHTML = "";

        const contagens = dias.map(contarConclusoes);
        const maximo = Math.max(1, ...contagens);

        dias.forEach(function (dia, i) {
            const coluna = document.createElement("div");
            coluna.className = "coluna" + (i === dias.length - 1 ? " agora" : "");

            const valor = document.createElement("span");
            valor.className = "coluna-valor";
            valor.textContent = periodo === 7 || contagens[i] > 0 ? contagens[i] : "";

            if (periodo === 30) valor.style.fontSize = "0.65rem";

            const faixa = document.createElement("div");
            faixa.className = "faixa";

            const barra = document.createElement("div");
            barra.className = "barra";
            barra.title = `${contagens[i]} ${contagens[i] === 1 ? "conclusão" : "conclusões"}`;

            faixa.appendChild(barra);

            const rotulo = document.createElement("span");
            rotulo.className = "coluna-rotulo";

            if (periodo === 7) {
                rotulo.textContent = DIAS_CURTOS[dia.getDay()];
            } else if (dia.getDate() % 5 === 0 || i === dias.length - 1) {
                rotulo.textContent = dia.getDate();
            }

            coluna.append(valor, faixa, rotulo);
            elGrafico.appendChild(coluna);

            preencher(barra, "y", contagens[i] / maximo);
        });
    }


    /* ---------- desempenho por hábito ---------- */

    function desenharDesempenho(dias) {
        elDesempenho.innerHTML = "";

        if (habitos.length === 0) {
            elDesempenho.innerHTML = `
                <li class="vazio">
                    <h3>Sem hábitos para analisar.</h3>
                    <p>Crie um hábito e marque os dias para ver o desempenho aqui.</p>
                    <a class="btn" href="habitos.html">Criar hábito</a>
                </li>
            `;
            document.getElementById("melhorHabito").textContent = "—";
            document.getElementById("detalheMelhor").textContent = "Ainda sem registros";
            return;
        }

        const resultados = habitos.map(function (habito) {
            let previstos = 0;
            let feitos = 0;

            dias.forEach(function (dia) {
                if (!habitoPrevisto(habito, dia)) return;

                previstos++;

                const chave = chaveData(dia);
                if (mapa[chave] && mapa[chave].has(habito.id)) feitos++;
            });

            return {
                habito,
                previstos,
                feitos,
                taxa: previstos ? Math.round((feitos / previstos) * 100) : 0
            };
        });

        resultados.sort(function (a, b) {
            return b.taxa - a.taxa || b.feitos - a.feitos;
        });

        resultados.forEach(function (r) {
            const item = document.createElement("li");

            const texto = document.createElement("div");
            const nome = document.createElement("strong");
            nome.className = "nome";
            nome.textContent = r.habito.nome;

            const detalhe = document.createElement("small");
            detalhe.textContent = r.previstos
                ? `${r.feitos} de ${r.previstos} dias previstos`
                : "Ainda sem dias previstos";

            texto.append(nome, detalhe);

            const taxa = document.createElement("span");
            taxa.className = "taxa";
            taxa.textContent = r.previstos ? `${r.taxa}%` : "—";

            const trilho = document.createElement("div");
            trilho.className = "trilho";

            const preenchido = document.createElement("i");
            trilho.appendChild(preenchido);

            item.append(texto, taxa, trilho);
            elDesempenho.appendChild(item);

            preencher(preenchido, "x", r.taxa / 100);
        });

        const melhor = resultados[0];

        if (melhor.feitos > 0) {
            document.getElementById("melhorHabito").textContent = melhor.habito.nome;
            document.getElementById("detalheMelhor").textContent = `${melhor.taxa}% nos últimos ${periodo} dias`;
        } else {
            document.getElementById("melhorHabito").textContent = "—";
            document.getElementById("detalheMelhor").textContent = "Ainda sem registros";
        }
    }


    /* ---------- período ---------- */

    function desenharTudo() {
        const dias = diasDoPeriodo();

        document.getElementById("subtituloDesempenho").textContent =
            `Percentual dos dias previstos em que você concluiu, nos últimos ${periodo} dias.`;

        desenharResumo(dias);
        desenharGrafico(dias);
        desenharDesempenho(dias);
    }

    document.querySelectorAll("[data-periodo]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            periodo = Number(botao.dataset.periodo);

            document.querySelectorAll("[data-periodo]").forEach(function (b) {
                b.setAttribute("aria-pressed", String(b === botao));
            });

            desenharTudo();
        });
    });


    /* ---------- conquistas ---------- */

    function desenharConquistas() {
        const lista = listarConquistas(habitos, mapa);
        const feitas = lista.filter(function (c) { return c.feita; }).length;
        const elLista = document.getElementById("conquistas");

        document.getElementById("resumoConquistas").textContent =
            `${feitas} de ${lista.length} desbloqueadas`;

        lista.forEach(function (c) {
            const item = document.createElement("li");
            item.className = "conquista" + (c.feita ? " feita" : "");

            const titulo = document.createElement("strong");
            titulo.textContent = c.titulo;

            const descricao = document.createElement("span");
            descricao.textContent = c.descricao;

            item.append(titulo, descricao);

            if (!c.feita) {
                const trilho = document.createElement("div");
                trilho.className = "trilho";

                const barra = document.createElement("i");
                trilho.appendChild(barra);

                const progresso = document.createElement("small");
                progresso.textContent = `${c.atual} de ${c.meta}`;

                item.append(trilho, progresso);
                preencher(barra, "x", c.atual / c.meta);
            }

            elLista.appendChild(item);
        });
    }

    animarEntrada(elDesempenho);
    desenharTudo();
    desenharConquistas();

})();
