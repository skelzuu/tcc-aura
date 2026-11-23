# Persistance

Sistema web para organizar rotina e acompanhar hábitos, com XP, níveis, sequência de dias e conquistas.
Projeto de TCC do curso de Análise e Desenvolvimento de Sistemas.

## Tecnologias

- Front-end: HTML, CSS e JavaScript
- Back-end: Node.js e Express
- Banco de dados: MySQL
- Autenticação: token JWT, com senhas protegidas por bcrypt

## Como rodar

Pré-requisitos: Node.js 18 ou superior e MySQL ligado.

1. Instale as dependências: `npm install`
2. Crie o banco rodando `database/schema.sql` no MySQL (pelo Workbench ou pelo terminal).
3. Copie `.env.example` para `.env` e preencha usuário, senha do banco e uma chave secreta longa.
4. Inicie o servidor: `npm start`
5. Abra http://localhost:3000 (não abra os arquivos direto nem por servidores que só entregam páginas).

Comandos úteis:

| Comando        | O que faz                                                        |
|----------------|------------------------------------------------------------------|
| `npm start`    | Inicia o servidor                                                |
| `npm run dev`  | Inicia o servidor e reinicia sozinho ao editar o código          |
| `npm run seed` | Cria a conta de demonstração (demo@persistance.com / demo12345)  |
| `npm test`     | Roda os testes automáticos das regras do sistema                 |

## Estrutura

```
database/   schema.sql (tabelas) e seed.js (conta de demonstração)
server/     index.js, db.js, middleware/autenticar.js e routes/ (auth, habitos, conclusoes)
public/     páginas HTML, css/style.css e js/ (app.js compartilhado + um script por tela)
tests/      regras.test.js
```

## Telas

Login, cadastro, início, hábitos, estatísticas, histórico e configurações.

## Rotas da API

Todas, exceto cadastro e login, exigem `Authorization: Bearer <token>`.

| Método | Rota                      | Descrição                                      |
|--------|---------------------------|------------------------------------------------|
| POST   | /api/auth/cadastro        | Cria a conta                                   |
| POST   | /api/auth/login           | Faz login                                      |
| GET    | /api/auth/me              | Dados do usuário logado                        |
| PUT    | /api/auth/perfil          | Altera o nome                                  |
| PUT    | /api/auth/senha           | Troca a senha (exige a senha atual)            |
| DELETE | /api/auth/conta           | Exclui a conta e todos os dados (exige senha)  |
| GET    | /api/habitos              | Lista os hábitos                               |
| POST   | /api/habitos              | Cria um hábito                                 |
| PUT    | /api/habitos/:id          | Edita um hábito                                |
| DELETE | /api/habitos/:id          | Exclui um hábito e o histórico dele            |
| GET    | /api/conclusoes?de=&ate=  | Lista as conclusões entre duas datas           |
| PUT    | /api/conclusoes           | Marca ou desmarca um hábito em um dia          |

## Regras principais

- Um hábito só aparece nos dias da sua frequência e a partir do dia em que foi criado.
- Dia fechado: todos os hábitos previstos do dia foram marcados.
- Sequência: dias fechados seguidos. Dias sem hábito previsto e o dia de hoje em aberto não a quebram.
- XP: 10 por hábito concluído e 20 de bônus por dia fechado. O nível n exige 50 x n x (n - 1) XP.
- XP, nível e conquistas são calculados a partir das conclusões (não ficam guardados no banco).
- Cada usuário só acessa os próprios dados.

## Segurança

- Senhas com hash bcrypt, nunca em texto puro.
- Consultas SQL parametrizadas.
- Textos do usuário inseridos na página com `textContent`.
- Limite de tentativas em login, cadastro, troca de senha e exclusão de conta.
- Trocar a senha e excluir a conta exigem a senha atual.
