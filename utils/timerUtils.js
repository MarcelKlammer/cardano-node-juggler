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

const sleep = (ms) => {

  return new Promise(resolve => setTimeout(resolve, ms));
}

const getTimeDifferenceInSeconds = (first, second) => {

  return (first ? first.getTime() : 0 - second ? second.getTime() : 0) / 1000
}

module.exports = { timerStart, timerEnd, sleep, getTimeDifferenceInSeconds }
