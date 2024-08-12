import restify from 'restify'
import {readFile} from 'fs'
import db from './db.mjs'
import pdf from './pdf.mjs'
import logit from './logit.mjs'

const server = restify.createServer({name: 'Timez'})

server.use(restify.plugins.bodyParser())
server.use(restify.plugins.gzipResponse())

server.get('/*',
  restify.plugins.serveStatic({
    directory: '../',
    default: 'index.html'
  })
)

server.get('/images/:name', (req, res, next) => {
  const name = req.params.name
  const type = name.slice(-3)
  readFile('../images/' + name, (err, buffer) => {
    if (err) return next(err)
    res.sendRaw(200, buffer, {'Content-Type': `image/${type}`})
    next()
  })
})

server.get('/api/:table', (req, res, next) => {
  res.json(db.get(req.params.table))
  next()
})

server.post('/api/pdf', (req, res, next) => {
  pdf(req.body, rs => {
    res.json(rs)
    next()
  })
})

server.post('/api/:table', (req, res, next) => {
  const id = db.insert(req.params.table, req.body)
  res.json({id})
  next()
})

server.put('/api/:table/:id', (req, res, next) => {
  db.update(req.params.table, req.body, req.params.id)
  res.send()
  next()
})

server.del('/api/:table/:id', (req, res, next) => {
  db.delete(req.params.table, req.params.id)
  res.send()
  next()
})

server.listen(11201, () => {
  logit(`Oscar's small Timez app is listening at port 11201`)
  db.init()
})