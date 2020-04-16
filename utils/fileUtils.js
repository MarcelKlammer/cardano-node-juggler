const fs                              = require('fs')
const util                            = require('util')

const writeFileAsync                  = util.promisify(fs.writeFile)
const readFileAsync                   = util.promisify(fs.readFile)

const readTextFile = (url) => {

  return fs.readFileSync(url, 'utf8')
}

const readTextFileAsync = async (url) => {

  try { return await readFileAsync(url, 'utf8') } catch(e) { }

  return ''
}

const writeTextFile = (url, content) => {

  fs.writeFileSync(url, new Uint8Array(Buffer.from(content)))
}

const writeTextFileAsync = async (url, content) => {

  await writeFileAsync(url, new Uint8Array(Buffer.from(content)))
}

const existsSync = (url) => {

  return fs.existsSync(url)
}

const appendJsonFile = (url, content) => {

  fs.appendFileSync(url, content)
}

module.exports = {

  readTextFile,  readTextFileAsync,
  writeTextFile, writeTextFileAsync,

  existsSync,
  appendJsonFile
}
