
const mysql = require('mysql2/promise');
const fs = require('fs');

async function importar() {
  const conexao = await mysql.createConnection({
    host: 'persistance-ehmx94.db.enzonic.com',
    port: 3306,
    user: 'u_jtplw8un37',
    password: 'jcXFJaeDz4TxWFmdjupKa6JMADuV8KGK',
    database: 'main',
    ssl: {
      servername: 'persistance-ehmx94.db.enzonic.com'
    },
    multipleStatements: true
  });

  const sql = fs.readFileSync(
    'C:/Users/Skelzor/Documents/dumps/persistance_backup.sql',
    'utf8'
  );

  await conexao.query(sql);

  console.log('Banco importado com sucesso!');
  await conexao.end();
}

importar().catch(console.error);
