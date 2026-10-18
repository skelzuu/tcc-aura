// quem já está logado vai direto para o início
if (getToken()) {
    window.location.replace("home.html");
}

const formLogin = document.getElementById("formLogin");
const caixaErro = document.getElementById("erro");
const botaoEntrar = document.getElementById("botaoEntrar");

formLogin.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    caixaErro.hidden = true;
    botaoEntrar.disabled = true;
    botaoEntrar.textContent = "Entrando...";

    try {
        const resposta = await api("/auth/login", {
            metodo: "POST",
            corpo: {
                email: document.getElementById("email").value,
                senha: document.getElementById("senha").value
            }
        });

        salvarSessao(resposta.token, resposta.usuario, document.getElementById("lembrar").checked);
        window.location.href = "home.html";
    } catch (erro) {
        caixaErro.textContent = erro.message;
        caixaErro.hidden = false;
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = "Entrar";
    }
});
