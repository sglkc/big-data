// @ts-check
// import _ from 'lodash-es/collection.js'

/**
 * @typedef {import('./preprocessor.mjs').Dataset[]} Datasets
 */

function randomSample(/** @type {Datasets} */ dataset) {
  const length = dataset.length
  const positif = dataset.filter(i => i[1] > 3)
  const netral = dataset.filter(i => i[1] === 3)
  const negatif = dataset.filter(i => i[1] < 3)

  console.log('Positif:', positif.length, 'Negatif:', negatif.length, 'Netral:', netral.length)
  dataset = []

  for (let i = length; i > 0; i--) {
    dataset.push(positif[Math.floor(Math.random() * positif.length)])
    dataset.push(netral[Math.floor(Math.random() * netral.length)])
    dataset.push(negatif[Math.floor(Math.random() * negatif.length)])
  }

  return dataset
}

/**
 * @param {Datasets} datasets
 * @returns {{ trainSet: Datasets, valSet: Datasets, testSet: Datasets }} JSON
 */
export default function splitDataset(datasets, trainSize = 0.9, valSize = 0.05) {
  datasets = randomSample(datasets)
  trainSize = Math.floor(0.9 * datasets.length)
  valSize = Math.floor(0.05 * datasets.length)

  const shuffledDataset = (datasets)
  const trainSet = shuffledDataset.slice(0, trainSize)
  const valSet = shuffledDataset.slice(trainSize, trainSize + valSize)
  const testSet = shuffledDataset.slice(trainSize + valSize)

  // @ts-ignore
  datasets = undefined

  return {
    trainSet,
    valSet,
    testSet
  }
}
