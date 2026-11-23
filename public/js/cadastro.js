if (getToken()) {
    window.location.replace("home.html");
}

const formCadastro = document.getElementById("formCadastro");
const caixaErro = document.getElementById("erro");
const botaoCriar = document.getElementById("botaoCriar");

function mostrarErro(mensagem) {
    caixaErro.textContent = mensagem;
    caixaErro.hidden = false;
}

formCadastro.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    caixaErro.hidden = true;

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmacao = document.getElementById("confirmar").value;

    if (senha.length < 8) {
        return mostrarErro("A senha precisa ter pelo menos 8 caracteres.");
    }

    if (senha !== confirmacao) {
        return mostrarErro("As senhas não são iguais.");
    }

    botaoCriar.disabled = true;
    botaoCriar.textContent = "Criando conta...";

    try {
        const resposta = await api("/auth/cadastro", {
            metodo: "POST",
            corpo: { nome, email, senha }
        });

        salvarSessao(resposta.token, resposta.usuario, true);
        window.location.href = "habitos.html";
    } catch (erro) {
        mostrarErro(erro.message);
        botaoCriar.disabled = false;
        botaoCriar.textContent = "Criar conta";
    }
});
