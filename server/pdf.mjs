import {exec} from 'node:child_process'
import {writeFile} from 'node:fs'

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

const getym = date => date.replaceAll('-', '').slice(2)

const template = ({invo, comp, proj, times}) => {
  const idx = proj.language === 'EN' ? 0 : 1
  const curs = {USD: '$', EUR: '€'}
  const headers = () => ['date', 'description', 'price', 'hours', 'total'].map(x => `<th>${txt(x, idx)}</th>`).join('')
  const body = () => times
    .map(time => `
      <tr style="height:28px">
        <td style="width:120px">${time.date}</td>
        <td>${time.description}</td>
        <td>${curs[proj.currency]} ${(time.price).toFixed(2)}</td>
        <td>${(time.hours).toFixed(1)}</td>
        <td style="width:100px">${curs[proj.currency]} ${(time.total).toFixed(2)}</td>
      </tr>`
    )
    .join('')
  const calctax = (perc, total) => ((Math.round(((perc / 100) * total) * 100)) / 100)

  return `<!DOCTYPE html>
<html>
  <head>
    <title>Times</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="images/favicon.ico" />
  </head>
  <body style="font-family:calibri,arial,verdana,sans-serif; font-size:18px; margin:0; padding:0">
    <div style="position:relative; width:100vw; height:100vh">
      <div style="width:970px; margin:0 auto; padding:20px">
        <div style="display: -webkit-box; display:flex; -webkit-box-pack: justify; justify-content:space-between; align-items:center">
          <div style="font-size: 2.25rem">${txt('title', idx)}</div>
          <div style="margin-top:9px; font-size: 1rem; font-style:italic">${invo.date}</div>
        </div>
        <hr>
        <div style="display: -webkit-box; display:flex; -webkit-box-pack: justify; justify-content:space-between; margin-top:20px">
          <div>
            <div style="font-weight:bold">${proj.name}</div>
            <div>${proj.address}</div>
            <div>${proj.city}</div>
            <div>${proj.country}</div>
          </div>
          <div style="margin-right:20px">
            <div style="font-weight:bold">${comp.name}</div>
            <div>${comp.address}</div>
            <div>${comp.city}</div>
            <div>${comp.country}</div>
            <div style="margin-top:3px">${txt('coc', idx)} ${comp.coc}</div>
            <div>${txt('vat', idx)} ${comp.vat}</div>
            <div>Bank: ${proj.bank}</div>
          </div>
        </div>
        <div style="margin-top:90px">${txt('nr', idx)} ${getym(invo.date)}</div>
        <div style="margin-top:60px">
          <table style="width:100%; text-align:left; font-size:18px">
            <thead>
              ${headers()}
            </thead>
            <tbody>
              ${body()}
              <tr>
                <td colspan=4></td>
                <td><hr></td>
              </tr>
              <tr>
                <td colspan=3></td>
                <td style="padding-top:8px">${txt('sub', idx)}</td>
                <td>${curs[proj.currency]} ${invo.total.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan=3></td>
                <td style="padding-top:5px">${txt('tax', idx)} (${proj.tax}%)</td>
                <td>${curs[proj.currency]} ${calctax(proj.tax, invo.total).toFixed(2)}</td>
              </tr>
              <tr style="font-weight:bold">
                <td colspan=3></td>
                <td style="padding-top:5px; font-size:18px; font-weight:bold">${txt('total', idx)}</td>
                <td>${curs[proj.currency]} ${(invo.total + calctax(proj.tax, invo.total)).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </body>
</html>`
}

export default (body, cb) => {
  const html = template(body)
  const {invo, proj} = body
  const filename = `${getym(invo.date)}-${proj.name.replaceAll(' ', '_')}.pdf`
  const dir = `C:\\Users\\Oscar\\Dropbox\\Belasting\\${invo.date.slice(0,4)}\\`
  const res = {
    savHTML: 0,
    makePDF: 0,
    movePDF: 0,
    delHTML: 0
  }

  writeFile('files/tmp.html', html, err => {
    if (err) {
      res.savHTML = 1
      console.log(err)
    }
    exec('"C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe" files/tmp.html files/tmp.pdf', err => {
      if (err) {
        res.makePDF = 1
        return console.log(err)
      }
      exec(`move files\\tmp.pdf "${dir + filename}"`, err => {
        if (err) {
          res.movePDF = 1
          return console.log(err)
        }
        exec(`del files\\tmp.html`, err => {
          if (err) {
            res.delHTML = 1
            return console.log(err)
          }
          console.log(filename, "created")
          cb(res)
        })
      })
    })
  })
}