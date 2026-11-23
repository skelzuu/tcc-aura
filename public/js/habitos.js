(async function () {

    if (!exigirLogin()) return;
    montarMenu("habitos");

    const painel = document.getElementById("painelForm");
    const form = document.getElementById("formHabito");
    const tituloForm = document.getElementById("tituloForm");
    const campoNome = document.getElementById("nome");
    const campoCategoria = document.getElementById("categoria");
    const campoFrequencia = document.getElementById("frequencia");
    const botaoSalvar = document.getElementById("botaoSalvar");
    const elLista = document.getElementById("lista");
    const elContagem = document.getElementById("contagem");

    let habitos = [];
    let editandoId = null;

    mostrarCarregando(elLista, 3);

    try {
        habitos = await api("/habitos");
    } catch (erro) {
        elContagem.textContent = "";
        mostrarErroCarga(elLista, erro.message);
        return;
    }


    /* ---------- formulário ---------- */

    function abrirForm(habito) {
        editandoId = habito ? habito.id : null;

        tituloForm.textContent = habito ? "Editar hábito" : "Novo hábito";
        botaoSalvar.textContent = habito ? "Salvar alterações" : "Criar hábito";

        campoNome.value = habito ? habito.nome : "";
        campoCategoria.value = habito ? habito.categoria : "Saúde";
        campoFrequencia.value = habito ? habito.frequencia : "Todos os dias";

        painel.hidden = false;
        painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        campoNome.focus();
    }

    function fecharForm() {
        painel.hidden = true;
        editandoId = null;
        form.reset();
    }

    document.getElementById("botaoNovo").addEventListener("click", function () {
        abrirForm(null);
    });

    document.getElementById("botaoCancelar").addEventListener("click", fecharForm);

    form.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const dados = {
            nome: campoNome.value.trim(),
            categoria: campoCategoria.value,
            frequencia: campoFrequencia.value
        };

        botaoSalvar.disabled = true;

        try {
            if (editandoId) {
                const atualizado = await api(`/habitos/${editandoId}`, { metodo: "PUT", corpo: dados });

                habitos = habitos.map(function (h) {
                    return h.id === editandoId ? atualizado : h;
                });

                toast("Hábito atualizado.");
            } else {
                dados.data_inicio = chaveData(hoje());
                habitos.push(await api("/habitos", { metodo: "POST", corpo: dados }));

                toast("Hábito criado.");
            }

            fecharForm();
            desenhar();
        } catch (erro) {
            toast(erro.message, "erro");
        }

        botaoSalvar.disabled = false;
    });


    /* ---------- lista ---------- */

    async function excluir(habito) {
        const certeza = await confirmar({
            titulo: "Excluir hábito?",
            texto: `"${habito.nome}" e todo o histórico dele serão apagados.`,
            botao: "Excluir"
        });

        if (!certeza) return;

        try {
            await api(`/habitos/${habito.id}`, { metodo: "DELETE" });

            habitos = habitos.filter(function (h) {
                return h.id !== habito.id;
            });

            toast("Hábito excluído.");
            desenhar();
        } catch (erro) {
            toast(erro.message, "erro");
        }
    }

    function desenhar() {
        elLista.innerHTML = "";

        elContagem.textContent = habitos.length === 1
            ? "1 hábito cadastrado"
            : `${habitos.length} hábitos cadastrados`;

        if (habitos.length === 0) {
            elLista.innerHTML = `
                <li class="vazio">
                    <h3>Nenhum hábito por aqui.</h3>
                    <p>Comece com algo pequeno, como beber água ou ler dez minutos.</p>
                </li>
            `;
            return;
        }

        habitos.forEach(function (habito) {
            const linha = document.createElement("li");
            linha.className = "habito";

            const acoes = document.createElement("div");
            acoes.className = "acoes";

            const editar = document.createElement("button");
            editar.type = "button";
            editar.className = "btn-texto";
            editar.textContent = "Editar";
            editar.addEventListener("click", function () {
                abrirForm(habito);
            });

            const apagar = document.createElement("button");
            apagar.type = "button";
            apagar.className = "btn-texto perigo";
            apagar.textContent = "Excluir";
            apagar.addEventListener("click", function () {
                excluir(habito);
            });

            acoes.append(editar, apagar);
            linha.append(criarInfoHabito(habito), acoes);
            elLista.appendChild(linha);
        });
    }

    animarEntrada(elLista);
    desenhar();

})();
