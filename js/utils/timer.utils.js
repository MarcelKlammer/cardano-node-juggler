let _timeStart  = 0
let _timeEnd    = 0

const timerStart = () => {

  _timeStart    = process.hrtime.bigint()
}

const timerEnd = () => {

  _timeEnd      = process.hrtime.bigint()

  return {
    timeStart:  parseFloat(_timeStart) / 1000000,
    timeEnd:    parseFloat(_timeEnd) / 1000000,
    timeDiff:   parseFloat(_timeEnd - _timeStart) / 1000000}
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const getDuration = (firstDate, secondDate) => {

  if(!firstDate || !secondDate) { return 0 }

  return (firstDate.getTime() - secondDate.getTime()) / 1000
}

module.exports = { timerStart, timerEnd, sleep, getDuration }
