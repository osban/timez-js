const api = {
  req : (method, url, opts) => m.request({method, url, opts}),
  get : (url, opts) => api.req('get',  url, opts),
  post: (url, opts) => api.req('post', url, opts),
  put : (url, opts) => api.req('put',  url, opts),
  del : (url, opts) => api.req('del',  url, opts)
}

export default (S, A = {
  init: () => {
    S.loaded = false
    return Promise.all([
      A.get('times'),
      A.get('companies'),
      A.get('projects'),
      A.get('invoices')
    ])
    .then(() => S.loaded = true)
    .catch(console.log)
  },

  initChecks: () => S.checks = S.times.reduce((a,{id}) => (a[id] = false, a), {}),

  get: table =>
    api.get(`/api/${table}`)
    .then(res => S[table] = res)
    .catch(console.log),

  post: (table, body) =>
    api.post(`/api/${table}`, {body})
    .then(res => {
      if (table !== 'pdf') {
        S[table].unshift({id: res.id, ...body})
      }
      else return res
    })
    .catch(console.log),

  put: (table, id, body) =>
    api.put(`/api/${table}/${id}`, {body})
    .then(() => {
      const idx = S[table].findIndex(x => x.id === id)
      S[table][idx] = body
    })
    .catch(console.log),

  del: (table, id) =>
    api.del(`/api/${table}/${id}`, {method: 'DELETE'})
    .then(() => {
      S[table] = S[table].filter(x => x.id !== id)
    })
    .catch(console.log)
}) => A