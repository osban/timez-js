export default ({attrs: {S}}) => {
  const make = () =>
    S.times
    .filter(time => S.checks[time.id])
    .reduce((a,c) => (a.push({project: c.code, who: 'Oscar Bannink', comment: c.description, hr: c.hours, date: c.date}), a), [])
    .sort((a,b) => a.date > b.date ? 1 : -1)

  return {
    view: () =>
      m('div', {class: 'p-4'},
        m('div', {class: 'mb-3'},
          m('button', {
              class: S.classes.button,
              onclick: () => {
                navigator.clipboard.writeText(document.getElementById('json').innerHTML)
              }
            },
            'Copy to Clipboard'
          )
        ),
        m('pre#json', JSON.stringify(make(), null, 2))
      )
  }
}