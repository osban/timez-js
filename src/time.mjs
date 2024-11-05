export default ({attrs: {S,A}}) => {
  if (!S.loaded) A.init()

  const action = () => S.time.id ? 'put' : 'post'
  const cred = action() === 'post' ? 'Create' : 'Edit'

  const save = () => {
    S.time.total = S.time.hours * S.time.price
    if (action() === 'post') {
      A.post('times', S.time)
      .then(() => m.route.set('/times'))
      .catch(console.log)
    }
    else {
      const {id, ...body} = S.time
      A.put('times', id, body)
      .then(() => m.route.set('/times'))
      .catch(console.log)
    }
  }

  return {
    onbeforeupdate: () => {
      if (!S.loaded) A.init()
    },

    view: () =>
      m('div', {class: 'p-4'},
        m('h2', {class: 'text-2xl font-bold mb-3'}, `${cred} time entry`),
        m('form', {class: 'flex flex-col gap-[20px]'},
          m('div', {class: 'flex'},
            m('label', {class: 'w-[100px] capitalize'}, 'Date'),
            m('input', {
              type: 'date',
              class: 'px-2',
              value: S.time.date,
              onchange: e => S.time.date = e.target.value
            })
          ),
          ['description', 'hours', 'price', 'code'].map(x =>
            m('div', {class: 'flex'},
              m('label', {class: 'w-[100px] capitalize'}, x),
              m('input', {
                class: 'px-2',
                value: S.time[x],
                onchange: e => S.time[x] = (x === 'hours' || x === 'price') ? +e.target.value : e.target.value
              })
            )
          ),
          [{code: 'projid', name: 'Project', arr: 'projects'},
           {code: 'compid', name: 'Company', arr: 'companies'}].map(x =>
            m('div', {class: 'flex'},
              m('label', {class: 'w-[100px] capitalize'}, x.name),
              m('select', {
                  name: x.code,
                  style: 'padding: 0 8px',
                  value: S.time[x.code],
                  onchange: e => S.time[x.code] = +e.target.value
                },
                S[x.arr].map(y =>
                  m('option', {value: y.id}, y.name)
                )
              )
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