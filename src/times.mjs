import svgs from './svgs.mjs'

export default ({attrs: {S,A}}) => {
  if (!S.loaded) {
    A.init()
    .then(A.initChecks)
  }

  const curs = {USD: '$', EUR: '€'}
  const proj = (id, prop) => {
    const p = S.projects.find(proj => proj.id === id)
    return p ? p[prop] : ''
  }

  const getdate = () => {
    const now = new Date(Date.now())
    return now.toJSON().split('T')[0]
  }

  const createInvoice = () => {
    const ids = Object.entries(S.checks)
      .sort((a,b) => +a[0] > +b[0] ? 1 : -1)
      .reduce((a,[k,v]) => {if (v) a.push(+k); return a}, [])
    const projid = S.times.find(({id}) => id === ids[0]).id
    const total = S.times
      .filter(({id}) => ids.includes(id))
      .reduce((a,c) => (a += c.total, a), 0)

    A.post('invoices', {date: getdate(), projid, total, times: ids.join(',')})
    .then(() => {})
    .catch(console.log)
  }

  return {
    onbeforeupdate: () => {
      if (!S.loaded) {
        A.init()
        .then(A.initChecks)
      }
    },

    view: () =>
      m('div', {class: 'p-4'},
        m('div', {class: 'flex'},
          m('h2', {class: 'text-2xl font-bold mb-3'}, 'Times'),
          m('button', {
            class: S.classes.plus,
            onclick: () => {
              S.time = {}
              m.route.set('/time')
            }
          }, '+')
        ),
        m('div', {class: 'mb-3'},
          m('button', {
            class: 'mr-3 ' + S.classes.button,
            onclick: () => m.route.set('/json')
          }, 'Copy Json'),
          m('button', {
            class: S.classes.button,
            onclick: createInvoice
          }, 'Create Invoice')
        ),
        m('div',
          S.times.length > 0
          ? m('table',
              m('thead',
                m('tr',
                  ['', 'date', 'project', 'hours', 'price', 'total', 'description', '']
                  .map(x =>
                    m('th', {class: 'text-left px-3'}, x)
                  )
                )
              ),
              m('tbody',
                S.times.map(time =>
                  m('tr', {class: 'hover:bg-slate-50'},
                    m('td',
                      m('input', {
                        type: 'checkbox',
                        checked: S.checks[time.id],
                        onchange: () => S.checks[time.id] = !S.checks[time.id]
                      })
                    ),
                    ['date', 'projname', 'hours', 'price', 'total', 'description'].map(x =>
                      x === 'projname'
                      ? m('td', {class: 'px-3'}, proj(time.projid, 'name'))
                      : x === 'total'
                        ? m('td', {class: 'px-3'},
                            curs[(proj(time.projid, 'currency'))] +
                            ((Math.round((time.hours * time.price) * 100)) / 100).toFixed(2)
                          )
                        : m('td', {class: 'px-3'}, time[x])
                      ),
                    m('td', {class: 'flex'},
                      m('span', {
                        class: 'cursor-pointer',
                        title: 'edit',
                        onclick: () => {
                          S.time = time
                          m.route.set('/time')
                        }
                      }, svgs.edit),
                      m('span', {
                        class: 'cursor-pointer',
                        title: 'copy',
                        onclick: () => {
                          const {id, ...body} = time
                          A.post('times', body)
                        }
                      }, svgs.copy),
                      m('span', {
                        class: 'cursor-pointer mt-0.5',
                        onclick: () => {
                          if (confirm(`Are you sure you wish to delete this time entry?`)) {
                            A.del('times', time.id)
                          }
                        }
                      }, svgs.crossred)
                    )
                  )
                )
              )
            )
          : m('h5', {class: 'text-lg font-bold'}, 'No time entries found')
        )
      )
  }
}
