export default ({attrs: {S,A}}) => {
  if (!S.loaded) A.init()

  const action = S.proj.id ? 'put' : 'post'
  const cred = action === 'post' ? 'Create' : 'Edit'

  const save = () => {
    if (action === 'post') {
      A.post('projects', S.proj)
      .then(() => m.route.set('/config'))
      .catch(console.log)
    }
    else {
      const {id, ...body} = S.proj
      A.put('projects', id, body)
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
        m('h2', {class: 'text-2xl font-bold mb-3'}, `${cred} project`),
        m('form', {class: 'flex flex-col gap-[20px]'},
          ['name', 'address', 'city', 'country', 'bank', 'currency', 'tax', 'language'].map(x =>
            m('div', {class: 'flex'},
              m('label', {class: 'w-[100px] capitalize'}, x),
              x === 'currency'
              ? m('select', {
                    style: 'padding: 0 8px',
                    value: S.proj[x],
                    onchange: e => S.proj[x] = e.target.value
                  },
                  ['USD', 'EUR'].map(y => m('option', {value: y}, y))
                )
              : x === 'language'
                ? m('select', {
                      style: 'padding: 0 8px',
                      value: S.proj[x],
                      onchange: e => S.proj[x] = e.target.value
                    },
                    Object.entries({EN: 'English', NL: 'Nederlands'})
                    .map(([k,v]) => m('option', {value: k}, v))
                  )
                : m('input', {
                    class: 'px-2',
                    value: S.proj[x],
                    onchange: e => S.proj[x] = x === 'tax' ? +e.target.value : e.target.value
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