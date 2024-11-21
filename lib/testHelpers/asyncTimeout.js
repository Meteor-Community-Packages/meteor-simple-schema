export const asyncTimeout = ms => new Promise(resolve => {
  setTimeout(() => resolve(), ms)
})
