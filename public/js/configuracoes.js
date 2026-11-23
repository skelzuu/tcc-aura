(function () {

    if (!exigirLogin()) return;
    montarMenu("configuracoes");

    const usuario = getUsuario() || {};

    const campoNome = document.getElementById("nome");
    const campoEmail = document.getElementById("email");

    campoNome.value = usuario.nome || "";
    campoEmail.value = usuario.email || "";


    /* ---------- perfil ---------- */

    document.getElementById("formPerfil").addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const botao = document.getElementById("botaoPerfil");
        botao.disabled = true;

        try {
            const atualizado = await api("/auth/perfil", {
                metodo: "PUT",
                corpo: { nome: campoNome.value.trim() }
            });

            atualizarUsuarioSalvo(atualizado);
            campoNome.value = atualizado.nome;
            document.getElementById("menuNome").textContent = atualizado.nome;
            toast("Nome atualizado.");
        } catch (erro) {
            toast(erro.message, "erro");
        }

        botao.disabled = false;
    });


    /* ---------- senha ---------- */

    const formSenha = document.getElementById("formSenha");
    const erroSenha = document.getElementById("erroSenha");

    function mostrarErroSenha(mensagem) {
        erroSenha.textContent = mensagem;
        erroSenha.hidden = false;
    }

    formSenha.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        erroSenha.hidden = true;

        const atual = document.getElementById("senhaAtual").value;
        const nova = document.getElementById("senhaNova").value;
        const confirmacao = document.getElementById("senhaConfirmar").value;

        if (nova.length < 8) {
            return mostrarErroSenha("A nova senha precisa ter pelo menos 8 caracteres.");
        }

        if (nova !== confirmacao) {
            return mostrarErroSenha("As senhas novas não são iguais.");
        }

        const botao = document.getElementById("botaoSenha");
        botao.disabled = true;

        try {
            await api("/auth/senha", {
                metodo: "PUT",
                corpo: { senha_atual: atual, nova_senha: nova }
            });

            formSenha.reset();
            toast("Senha alterada.");
        } catch (erro) {
            mostrarErroSenha(erro.message);
        }

        botao.disabled = false;
    });


    /* ---------- exportar histórico ---------- */

    // evita que uma célula que comece com = + - @ seja lida como fórmula no Excel
    function celula(valor) {
        let texto = String(valor);

        if (/^[=+\-@]/.test(texto)) texto = "'" + texto;

        return /[;"\r\n]/.test(texto) ? '"' + texto.replace(/"/g, '""') + '"' : texto;
    }

    document.getElementById("botaoExportar").addEventListener("click", async function () {
        const botao = this;
        botao.disabled = true;

        try {
            const habitos = await api("/habitos");
            const mapa = await buscarConclusoes(menorInicio(habitos), chaveData(hoje()));
            const porId = new Map(habitos.map(function (h) { return [h.id, h]; }));
            const linhas = [];

            Object.keys(mapa).sort().reverse().forEach(function (data) {
                mapa[data].forEach(function (id) {
                    const h = porId.get(id);
                    if (h) linhas.push([data, h.nome, h.categoria, h.frequencia]);
                });
            });

            if (linhas.length === 0) {
                toast("Você ainda não tem hábitos concluídos para exportar.");
            } else {
                // ponto e vírgula e BOM fazem o Excel em português abrir com os acentos certos
                const csv = [["Data", "Hábito", "Categoria", "Frequência"]].concat(linhas)
                    .map(function (l) { return l.map(celula).join(";"); })
                    .join("\r\n");

                const arquivo = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
                const link = document.createElement("a");

                link.href = URL.createObjectURL(arquivo);
                link.download = `persistance-historico-${chaveData(hoje())}.csv`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(link.href);

                toast("Histórico baixado.");
            }
        } catch (erro) {
            toast(erro.message, "erro");
        }

        botao.disabled = false;
    });


    /* ---------- excluir conta ---------- */

    const formExcluir = document.getElementById("formExcluir");
    const erroExcluir = document.getElementById("erroExcluir");

    formExcluir.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        erroExcluir.hidden = true;

        const certeza = await confirmar({
            titulo: "Excluir a conta?",
            texto: "Sua conta, seus hábitos e todo o histórico serão apagados. Essa ação não pode ser desfeita.",
            botao: "Excluir conta"
        });

        if (!certeza) return;

        const botao = document.getElementById("botaoExcluir");
        botao.disabled = true;

        try {
            await api("/auth/conta", {
                metodo: "DELETE",
                corpo: { senha: document.getElementById("senhaExcluir").value }
            });

            limparSessao();
            window.location.href = "index.html";
        } catch (erro) {
            erroExcluir.textContent = erro.message;
            erroExcluir.hidden = false;
            botao.disabled = false;
        }
    });

})();
