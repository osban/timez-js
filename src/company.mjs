export default ({attrs: {S,A}}) => {
  if (!S.loaded) A.init()

  const action = S.comp.id ? 'put' : 'post'
  const cred = action === 'post' ? 'Create' : 'Edit'

  const save = () => {
    if (action === 'post') {
      A.post('companies', S.comp)
      .then(() => m.route.set('/config'))
      .catch(console.log)
    }
    else {
      const {id, ...body} = S.comp
      A.put('companies', id, body)
      .then(() => m.route.set('/config'))
      .catch(console.log)
    }
  }

  return {
    onbeforeupdate: () => {
      if (!S.loaded) A.init()
    },

    view: () =>
      m('div', {class: 'p-4'},
        m('h2', {class: 'text-2xl font-bold mb-3'}, `${cred} company`),
        m('form', {class: 'flex flex-col gap-[20px]'},
          ['name', 'address', 'city', 'country', 'coc', 'vat'].map(x =>
            m('div', {class: 'flex'},
              m('label', {class: 'w-[100px] capitalize'},
                x === 'coc' ? 'CoC/KvK' :
                x === 'vat' ? 'VAT/BTW' :
                x
              ),
              m('input', {
                class: 'px-2',
                value: S.comp[x],
                onchange: e => S.comp[x] = e.target.value
              })
            )
          )
        ),
        m('button', {
          class: 'w-[120px] mt-5 ' + S.classes.button,
          onclick: () => save()
        }, 'Save')
      )
  }
}