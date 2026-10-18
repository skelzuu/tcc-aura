CREATE DATABASE IF NOT EXISTS persistance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE persistance;

CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(80)  NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  senha_hash  VARCHAR(72)  NOT NULL,
  criado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habitos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT          NOT NULL,
  nome        VARCHAR(80)  NOT NULL,
  categoria   ENUM('Saúde','Estudos','Desenvolvimento','Sono','Outro') NOT NULL DEFAULT 'Outro',
  frequencia  ENUM('Todos os dias','Segunda a sexta','3x por semana','2x por semana') NOT NULL DEFAULT 'Todos os dias',
  data_inicio DATE         NOT NULL,
  criado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_habitos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  INDEX idx_habitos_usuario (usuario_id)
);

-- uma linha por hábito concluído em um dia
CREATE TABLE IF NOT EXISTS conclusoes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  habito_id INT  NOT NULL,
  data      DATE NOT NULL,
  CONSTRAINT fk_conclusoes_habito FOREIGN KEY (habito_id)
    REFERENCES habitos (id) ON DELETE CASCADE,
  UNIQUE KEY uq_habito_data (habito_id, data),
  INDEX idx_conclusoes_data (data)
);
