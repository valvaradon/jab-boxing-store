// Almacenamiento simple de documentos JSON.
// - Con DATABASE_URL (Postgres de Render) guarda todo en la tabla "docs".
// - Sin DATABASE_URL guarda en data/db.json (solo para pruebas locales:
//   en Render el disco se borra en cada despliegue).
const fs = require("fs");
const path = require("path");

function postgres(url) {
  const { Pool } = require("pg");
  const needsSsl = process.env.PGSSL === "require" || /\.render\.com|amazonaws\.com|neon\.tech|supabase/.test(url);
  const pool = new Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : false });
  return {
    kind: "postgres",
    async init() {
      await pool.query(`create table if not exists docs(
        col text not null, id text not null, data jsonb not null,
        created timestamptz not null default now(), updated timestamptz not null default now(),
        primary key(col, id))`);
    },
    async get(col, id) {
      const r = await pool.query("select data from docs where col=$1 and id=$2", [col, id]);
      return r.rows[0] ? r.rows[0].data : null;
    },
    async put(col, id, data) {
      await pool.query(
        `insert into docs(col,id,data) values($1,$2,$3)
         on conflict(col,id) do update set data=excluded.data, updated=now()`, [col, id, data]);
      return data;
    },
    async list(col) {
      const r = await pool.query("select data from docs where col=$1 order by created desc", [col]);
      return r.rows.map(x => x.data);
    },
    async del(col, id) { await pool.query("delete from docs where col=$1 and id=$2", [col, id]); }
  };
}

function jsonFile(file) {
  let mem = {};
  let timer = null;
  const flush = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(mem));
    }, 50);
  };
  return {
    kind: "archivo local",
    async init() { try { mem = JSON.parse(fs.readFileSync(file, "utf8")); } catch { mem = {}; } },
    async get(col, id) { return mem[col]?.[id]?.data ?? null; },
    async put(col, id, data) {
      mem[col] = mem[col] || {};
      const prev = mem[col][id];
      mem[col][id] = { data, created: prev?.created || Date.now() };
      flush();
      return data;
    },
    async list(col) {
      return Object.values(mem[col] || {}).sort((a, b) => b.created - a.created).map(x => x.data);
    },
    async del(col, id) { if (mem[col]) { delete mem[col][id]; flush(); } }
  };
}

module.exports = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL)
  : jsonFile(path.join(__dirname, "..", "data", "db.json"));
