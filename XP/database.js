const Database = require('better-sqlite3');
const db = new Database('xp.sqlite');

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    customTitle TEXT
  )
`).run();

module.exports = db;
