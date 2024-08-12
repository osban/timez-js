import Database from 'better-sqlite3'

const db = new Database('data/timez.db')

process.on('exit', () => db.close())

export default {
  get: (table) => db.prepare(`select * from ${table} order by id desc`).all(),

  insert: (table, data, cols = Object.keys(data)) =>
    db.prepare(`insert into ${table} ('${cols.join("', '")}')
                values (${cols.map(v => '$' + v).join(', ')})`)
      .run(data).lastInsertRowid,

  update: (table, data, id, cols = Object.keys(data)) =>
    db.prepare(`update ${table}
                set ${cols.map(v => '"' + v + '"' + ' = $' + v).join(', ')}
                where id = $id`)
      .run({id, ...data}),

  delete: (table, id) =>
    db.prepare(`delete from ${table} where id = $id`).run({id}),

  init: () => {
    db.pragma('journal_mode = WAL')
  }
}