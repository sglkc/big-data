// @ts-check
import fs from 'node:fs'
import { createRequire } from 'node:module'
import Classificator from 'classificator'
import _ from 'lodash-es/collection.js'
import { dir } from './pkgs/utils.mjs'
import processDatasets from './pkgs/preprocessor.mjs'
import metrics from './pkgs/metrics.mjs'

const require = createRequire(import.meta.url)

// KOMPILASI DATASET
console.log('Mengompilasi dataset...')
/** @type {import('./pkgs/preprocessor.mjs').Dataset[] | null} */
let datasets

// kompilasi dataset jika tidak ada
if (!fs.existsSync(dir('./datasets.json'))) {
  datasets = await processDatasets()
  fs.writeFileSync(dir('./datasets.json'), JSON.stringify(datasets), { encoding: 'utf8' })
} else {
  datasets = require('./datasets.json')
}

// ACAK DATASET DAN BAGI MENJADI TRAIN, VALIDATION, TESTING
console.log('Mengacak dataset...')
const shuffledDataset = _.shuffle(datasets)
const trainSize = Math.floor(0.85 * shuffledDataset.length)
const valSize = Math.floor(0.05 * shuffledDataset.length)
const trainSet = shuffledDataset.slice(0, trainSize)
const valSet = shuffledDataset.slice(trainSize, trainSize + valSize)
const testSet = shuffledDataset.slice(trainSize + valSize)
datasets = null

// TRAINING MODEL DARI SET TRAIN
console.log('Training model...')

const classify = (/** @type {number} */ rating) => rating < 3
  ? 'Negatif'
  : rating > 3
    ? 'Positif'
    : 'Netral'

/** @type {import('classificator').NaiveBayes} */
let classificator

// training model jika tidak ada
if (!fs.existsSync(dir('./model.json'))) {
  classificator = Classificator()

  for (const [review, rating] of trainSet) {
    const sentiment = classify(rating)
    classificator.learn(review, sentiment)
  }

  fs.writeFileSync(dir('./model.json'), classificator.toJson(), { encoding: 'utf8' })
} else {
  const model = fs.readFileSync(dir('./model.json'), { encoding: 'utf8' })
  classificator = Classificator.fromJson(model)
}

// VALIDASI MODEL
console.log('Validasi model...')

const trueLabels = valSet.map(([ _, rating ]) => classify(rating))
const predLabels = valSet.map(([ review ]) =>
  classificator.categorize(review).predictedCategory
)

const result = metrics(trueLabels, predLabels, ['Negatif', 'Netral', 'Positif'])

console.log(predLabels.length, trueLabels.length, result)
console.log(predLabels[0], trueLabels[0])
