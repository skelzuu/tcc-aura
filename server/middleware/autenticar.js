const jwt = require("jsonwebtoken");

module.exports = function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const [tipo, token] = cabecalho.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Faça login para continuar." });
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = dados.id;
    next();
  } catch {
    res.status(401).json({ erro: "Sessão expirada. Entre novamente." });
  }
};
