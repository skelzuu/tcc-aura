# Persistance

Sistema web para organizar rotina e acompanhar hábitos. Projeto de TCC do curso de Análise e Desenvolvimento de Sistemas.

## Tecnologias

- Front-end: HTML, CSS e JavaScript puro
- Back-end: Node.js e Express
- Banco de dados: MySQL
- Autenticação: JWT, com senhas protegidas por bcrypt

## Como rodar

Pré-requisitos: Node.js 18 ou superior e MySQL em execução.

1. Instale as dependências:

   ```
   npm install
   ```

2. Crie o banco e as tabelas rodando o script no MySQL:

   ```
   mysql -u root -p < database/schema.sql
   ```

3. Copie o arquivo de configuração e preencha com seus dados:

   ```
   cp .env.example .env
   ```

   Edite o `.env` com usuário e senha do MySQL e troque o `JWT_SECRET` por uma frase longa.

4. Inicie o servidor:

   ```
   npm start
   ```

5. Abra http://localhost:3000

O próprio Express serve as páginas da pasta `public`, então não precisa de outro servidor.

## Estrutura

```
database/schema.sql      tabelas usuarios, habitos e conclusoes
server/
  index.js               configuração do Express
  db.js                  conexão com o MySQL
  middleware/autenticar.js   valida o token JWT
  routes/auth.js         cadastro, login e /me
  routes/habitos.js      CRUD de hábitos
  routes/conclusoes.js   marcar/desmarcar e listar conclusões
public/
  css/style.css
  js/app.js              funções usadas por todas as páginas
  *.html e js/*.js       uma página e um script por tela
```

## Rotas da API

| Método | Rota                 | Descrição                              |
|--------|----------------------|----------------------------------------|
| POST   | /api/auth/cadastro   | cria conta e devolve o token           |
| POST   | /api/auth/login      | autentica e devolve o token            |
| GET    | /api/auth/me         | dados do usuário logado                |
| GET    | /api/habitos         | lista os hábitos do usuário            |
| POST   | /api/habitos         | cria hábito                            |
| PUT    | /api/habitos/:id     | edita hábito                           |
| DELETE | /api/habitos/:id     | exclui hábito e suas conclusões        |
| GET    | /api/conclusoes?de=&ate= | conclusões entre duas datas        |
| PUT    | /api/conclusoes      | marca ou desmarca um hábito em um dia  |

Todas as rotas, exceto cadastro e login, exigem o cabeçalho `Authorization: Bearer <token>`.

## Regras do sistema

- Um hábito só aparece nos dias da sua frequência e a partir do dia em que foi criado.
- Os percentuais (início, estatísticas e histórico) usam a mesma regra, então os números sempre batem.
- A sequência conta dias seguidos em que todos os hábitos previstos foram concluídos. Dias sem hábito previsto não quebram a sequência, e o dia de hoje ainda em aberto também não.
- Ao excluir um hábito, as conclusões dele são apagadas junto (`ON DELETE CASCADE`).

## Segurança

- Senhas guardadas com hash bcrypt, nunca em texto puro.
- Todas as consultas SQL usam parâmetros, o que evita SQL injection.
- Cada rota confere se o hábito pertence ao usuário do token.
- Textos digitados pelo usuário são inseridos na página com `textContent`, o que evita XSS.
- Login e cadastro têm limite de tentativas por IP.
