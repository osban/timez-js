import svgs from './svgs.mjs'

const Modal = () => {
  const txt = {
    savHTML: `save HTML`,
    makePDF: `make PDF`,
    movePDF: `move PDF`,
    delHTML: `delete HTML`
  }

  return {
    view: ({attrs: {res, cls, click}}) =>
      m('div', {class: 'fixed top-0 left-0 w-screen h-screen flex flex-col justify-center items-center bg-black opacity-80'},
        m('div', {class: 'text-center mb-2.5 p-5 w-52 h-52 bg-white'},
          ['savHTML', 'makePDF', 'movePDF', 'delHTML']
          .map(x =>
            m('div', {class: 'flex'},
              m('span', {class: 'w-24 ml-4 mr-1 text-left'}, txt[x]),
              m('span', res[x] ? svgs.crossredsm : svgs.check))
            ),
          m('div', {class: 'mt-2'},
            m('button', {class: cls, onclick: click}, "OK")
          )
        )
      )
    }
}

export default ({attrs: {S,A}}) => {
  if (!S.loaded) A.init()

  const curs = {USD: '$', EUR: '€'}
  const proj = (id, prop) => {
    const p = S.projects.find(proj => proj.id === id)
    return p ? p[prop] : ''
  }
  let pdfres = null

  const pdf = () => {
    const proj = S.projects.find(({id}) =>  id === S.invo.projid)
    const ids = S.invo.times.split(',').map(Number)
    const times = S.times.filter(({id}) => ids.includes(id)).reverse()
    const comp = S.companies.find(({id}) => id === times[0].compid)
    A.post('pdf', {invo: S.invo, comp, proj, times})
    .then(res => pdfres = res)
    .catch(console.log)
  }

  return {
    onbeforeupdate: () => {
      if (!S.loaded) A.init()
    },

    view: () =>
      m('div', {class: 'p-4'},
        m('h2', {class: 'text-2xl font-bold mb-2'}, 'Invoices'),
        m('div',
          S.invoices.length > 0
          ? m('table',
              m('thead',
                m('tr',
                  ['date', 'project', 'total', '']
                  .map(x =>
                    m('th', {class: 'text-left px-3'}, x)
                  )
                )
              ),
              m('tbody',
                S.invoices.map(invo =>
                  m('tr',
                    m('td', {class: 'px-3'}, invo.date),
                    m('td', {class: 'px-3'}, proj(invo.projid, 'name')),
                    m('td', {class: 'px-3'}, curs[(proj(invo.projid, 'currency'))] + invo.total),
                    m('td', {class: 'flex'},
                      m('span', {
                        class: 'cursor-pointer mr-1.5 mt-1',
                        title: 'pdf',
                        onclick: () => {
                          S.invo = invo
                          pdf()
                        }
                      }, svgs.pdf),
                      m('span', {
                        class: 'cursor-pointer mt-0.5',
                        title: 'preview',
                        onclick: () => {
                          S.invo = invo
                          m.route.set('/preview')
                        }
                      }, svgs.eye),
                      m('span', {
                        class: 'cursor-pointer',
                        onclick: () => {
                          if (confirm(`Are you sure you wish to delete ${invo.name}?`)) {
                            A.del('invoices', invo.id)
                          }
                        }
                      }, svgs.crossred)
                    )
                  )
                )
              )
            )
          : m('h5', {class: 'text-lg font-bold'}, 'No invoices found')
        ),
        pdfres && m(Modal, {res: pdfres, cls: S.classes.button, click: () => pdfres = null})
      )
  }
}
