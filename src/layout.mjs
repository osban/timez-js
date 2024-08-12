export default {
  view: ({children, attrs: {A}}) =>
    m('.layout', {class: 'relative w-screen h-screen'},
      m('div', {class: 'container mx-auto bg-sky-300'},
        m('div', {class: 'text-center py-4'},
          m('h1', {class: 'text-3xl font-bold tracking-widest'}, 'Timez')
        ),
        m('div', {class: 'bg-sky-950'},
          m('ul', {class: 'flex justify-start items-center gap-14 ml-14 pt-3 pb-3.5 list-none'},
            m('li', {class: 'inline-block text-white cursor-pointer select-none'},
              m('a', {
                onclick: () => {
                  A.initChecks()
                  m.route.set('/times')
                }
              }, 'Times')
            ),
            m('li', {class: 'inline-block text-white cursor-pointer select-none'},
              m('a', {onclick: () => m.route.set('/invoices')}, 'Invoices')
            ),
            m('li', {class: 'inline-block text-white cursor-pointer select-none'},
              m('a', {onclick: () => m.route.set('/config')}, 'Config')
            )
          )
        ),
        m('div', {class: 'bg-stone-100'},
          children
        )
      )
    )
}
