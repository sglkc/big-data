// @ts-check
import fs from 'node:fs'
import Classificator from 'classificator'
import _ from 'lodash-es/collection.js'
import { dir } from './pkgs/utils.mjs'
import processDatasets from './pkgs/preprocessor.mjs'
import metrics from './pkgs/metrics.mjs'
import trainModel, { classifyRating } from './pkgs/trainer.mjs'

const OVERWRITE_MODEL = true
const DATASET_PATH = dir('./dataset.json')
const MODEL_PATH = dir('./model.json')

// KOMPILASI DATASET
console.log('Mengompilasi dataset...')
/** @type {import('./pkgs/preprocessor.mjs').Dataset[] | null} */
let datasets

// kompilasi dataset jika tidak ada
if (!fs.existsSync(DATASET_PATH)) {
  datasets = await processDatasets()
  fs.writeFileSync(DATASET_PATH, JSON.stringify(datasets), { encoding: 'utf8' })
} else {
  const string = fs.readFileSync(DATASET_PATH, { encoding: 'utf8' })
  datasets = JSON.parse(string)
}

// ACAK DATASET DAN BAGI MENJADI TRAIN, VALIDATION, TESTING
console.log('Mengacak dataset...')
const shuffledDataset = _.shuffle(datasets)
const trainSize = Math.floor(0.9 * shuffledDataset.length)
const valSize = Math.floor(0.025 * shuffledDataset.length)
const trainSet = shuffledDataset.slice(0, trainSize)
const valSet = shuffledDataset.slice(trainSize, trainSize + valSize)
const testSet = shuffledDataset.slice(trainSize + valSize)
datasets = null

// TRAINING MODEL DARI SET TRAIN
console.log('Training model...')

/** @type {string} */
let model

// training model jika tidak ada
if (OVERWRITE_MODEL || !fs.existsSync(MODEL_PATH)) {
  model = trainModel(trainSet)
  fs.writeFileSync(MODEL_PATH, model, { encoding: 'utf8' })
} else {
  model = fs.readFileSync(MODEL_PATH, { encoding: 'utf8' })
}

const classificator = Classificator.fromJson(model)

// VALIDASI MODEL
console.log('Validasi model...')

const trueLabels = []
const predLabels = []
const likelihoods = {}

valSet.forEach(([ review, rating ]) => {
  const category = classificator.categorize(review)

  trueLabels.push(classifyRating(rating))
  predLabels.push(category.predictedCategory)
  category.likelihoods.forEach((l) => {
    likelihoods[l.category] = (likelihoods[l.category] ?? 0) + l.proba
  })
})

const result = metrics(trueLabels, predLabels, ['Negatif', 'Netral', 'Positif'])

console.log(result)
console.log('Rata-rata setiap kelas:')
Object.entries(likelihoods).forEach(([k, v]) => {
  console.log(k, v / valSet.length)
})
// console.log(likelihoods)
