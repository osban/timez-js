export default (...args) => {
  const d = new Date()
  const f = x => ('0' + x).slice(-2)

  console.log(`[${d.getFullYear()}-${f(d.getMonth()+1)}-${f(d.getDate())} ${f(d.getHours())}:${f(d.getMinutes())}:${f(d.getSeconds())}]`, ...args)
}
