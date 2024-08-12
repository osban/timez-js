const txt = (field, idx) => ({
  title: ['Invoice', 'Factuur'],
  coc: ['CoC: ', 'KvK: '],
  vat: ['VAT: ', 'BTW: '],
  nr: ['Invoice number: ', 'Factuurnummer: '],
  date: ['Date', 'Datum'],
  description: ['Description', 'Omschrijving'],
  price: ['Price', 'Prijs'],
  hours: ['Hours', 'Uren'],
  total: ['Total', 'Totaal'],
  sub: ['Subtotal', 'Subtotaal'],
  tax: ['Tax ',  'BTW ']
}[field][idx])

export default ({attrs: {S}}) => {
  const proj = S.projects.find(({id}) =>  id === S.invo.projid)
  const ids = S.invo.times.split(',').map(Number)
  const times = S.times.filter(({id}) => ids.includes(id)).reverse()
  const comp = S.companies.find(({id}) => id === times[0].compid)

  const idx = proj.language === 'EN' ? 0 : 1
  const curs = {USD: '$', EUR: '€'}
  const getym = date => date.replaceAll('-', '').slice(2)
  const calctax = (perc, total) => ((Math.round(((perc / 100) * total) * 100)) / 100)

  return {
    view: () =>
      m('div', {style: 'position:relative; width:100vw; height:100vh'},
        m('div', {style: 'width:970px; margin:0 auto; padding:20px'},
          m('div', {style: 'display:flex; justify-content:space-between; align-items:center'},
            m('div', {style: 'font-size: 2.25rem'}, txt('title', idx)),
            m('div', {style: 'margin-top:9px; font-size: 1rem; font-style:italic'}, S.invo.date)
          ),
          m('hr', {style: 'border-top:1px solid black'}),
          m('div', {style: 'display:flex; justify-content:space-between; margin-top:20px'},
            m('div',
              m('div', {style: 'font-weight:bold'}, proj.name),
              m('div', proj.address),
              m('div', proj.city),
              m('div', proj.country)
            ),
            m('div', {style: 'margin-right:20px'},
              m('div', {style: 'font-weight:bold'}, comp.name),
              m('div', comp.address),
              m('div', comp.city),
              m('div', comp.country),
              m('div', {style: 'margin-top:3px'}, txt('coc', idx) + comp.coc),
              m('div', txt('vat', idx) + comp.vat),
              m('div', `Bank: ${proj.bank}`)
            )
          ),
          m('div', {style: 'margin-top:90px'}, txt('nr', idx) + getym(S.invo.date)),
          m('div', {style: 'margin-top:60px'},
            m('table', {style: 'width:100%; text-align:left; font-size:18px'},
              m('thead',
                ['date', 'description', 'price', 'hours', 'total']
                .map(x => m('th', txt(x, idx)))
              ),
              m('tbody',
                times.map(time =>
                  m('tr', {style: 'height:28px'},
                    m('td', {style: 'width:120px'}, time.date),
                    m('td', time.description),
                    m('td', curs[proj.currency] + time.price.toFixed(2)),
                    m('td', time.hours.toFixed(1)),
                    m('td', {style: 'width:100px'}, curs[proj.currency] + time.total.toFixed(2))
                  )
                ),
                m('tr',
                  m('td', {colspan: 4}),
                  m('td',
                    m('hr', {style: 'border-top:1px solid black'})
                  )
                ),
                m('tr',
                  m('td', {colspan: 3}),
                  m('td', {style: 'padding-top:8px'}, txt('sub', idx)),
                  m('td', curs[proj.currency] + S.invo.total.toFixed(2))
                ),
                m('tr',
                  m('td', {colspan: 3}),
                  m('td', {style: 'padding-top:5px'}, `${txt('tax', idx)} (${proj.tax}%)`),
                  m('td', curs[proj.currency] + calctax(proj.tax, S.invo.total).toFixed(2))
                ),
                m('tr', {style: 'font-weight:bold'},
                  m('td', {colspan: 3}),
                  m('td', {style: 'padding-top:5px; font-size:18px; font-weight:bold'}, txt('total', idx)),
                  m('td', curs[proj.currency] + (S.invo.total + calctax(proj.tax, S.invo.total)).toFixed(2))
                )
              )
            )
          )
        )
      )
  }
}