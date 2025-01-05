// @ts-check

/**
 * Confusion object
 * @typedef {Object} ConfusionMatrixEntry
 * @property {number} truePositives
 * @property {number} falsePositives
 * @property {number} falseNegatives
 */

/**
 * Confusion matrix
 * @template {string | number} T
 * @typedef {Object.<T, ConfusionMatrixEntry>} ConfusionMatrix
 */

/**
 * Score matrix
 * @template {string | number} T
 * @typedef {Object.<T, number>} ScoreMatrix
 */

/**
 * @template {string | number} T
 * @typedef {Object} MetricsReturnType
 * @property {ConfusionMatrix<T>} matrix
 * @property {ScoreMatrix<T>} precision
 * @property {ScoreMatrix<T>} recall
 * @property {ScoreMatrix<T>} f1Score
 * @property {ScoreMatrix<T>} support
 */

/**
 * @template {string | number} T
 * @param {T[]} yTrue Array of true labels
 * @param {T[]} yPred Array of predicted labels
 * @param {T[]} labels Array of label names
 * @returns {ConfusionMatrix<T>}
 */
function confusionMatrix(yTrue, yPred, labels) {
  /** @type {ConfusionMatrix<T>} */
  const matrix = {}

  labels.forEach(label => {
    matrix[label] = { truePositives: 0, falsePositives: 0, falseNegatives: 0 }
  })

  yTrue.forEach((trueLabel, index) => {
    const predLabel = yPred[index]
    labels.forEach(label => {
      if (trueLabel === label && predLabel === label) {
        matrix[label].truePositives++
      } else if (predLabel === label) {
        matrix[label].falsePositives++
      } else if (trueLabel === label) {
        matrix[label].falseNegatives++
      }
    })
  })

  return matrix
}

/**
 * Function to calculate precision
 * @template {string | number} T
 * @param {ConfusionMatrix<T>} matrix
 * @returns {ScoreMatrix<T>}
 */
function calculatePrecision(matrix) {
  const precision = {}
  for (const label in matrix) {
    const tp = matrix[label].truePositives
    const fp = matrix[label].falsePositives
    precision[label] = tp / (tp + fp)
  }
  return precision
}

/**
 * Function to calculate recall
 * @template {string | number} T
 * @param {ConfusionMatrix<T>} matrix
 * @returns {ScoreMatrix<T>}
 */
function calculateRecall(matrix) {
  const recall = {}
  for (const label in matrix) {
    const tp = matrix[label].truePositives
    const fn = matrix[label].falseNegatives
    recall[label] = tp / (tp + fn)
  }
  return recall
}

/**
 * Function to calculate F1-score
 * @template {string | number} T
 * @param {ScoreMatrix<T>} precision
 * @param {ScoreMatrix<T>} recall
 * @returns {ScoreMatrix<T>}
 */
function calculateF1Score(precision, recall) {
  const f1Score = {}
  for (const label in precision) {
    const p = precision[label]
    const r = recall[label]
    f1Score[label] = 2 * (p * r) / (p + r)
  }
  return f1Score
}

/**
 * Function to calculate support
 * @template {string | number} T
 * @param {T[]} yTrue Array of true labels
 * @param {T[]} labels Array of label names
 * @returns {ScoreMatrix<T>}
 */
function calculateSupport(yTrue, labels) {
  /** @type {ScoreMatrix<T>} */
  const support = {}
  labels.forEach(label => {
    support[label] = yTrue.filter(trueLabel => trueLabel === label).length
  })
  return support
}

/**
 * Prints metrics for machine learning
 * @template {string | number} T
 * @param {T[]} yTrue Array of true labels
 * @param {T[]} yPred Array of predicted labels
 * @param {T[]} labels Array of label names
 * @returns {MetricsReturnType<T>}
 */
export default function metrics(yTrue, yPred, labels) {
  const matrix = confusionMatrix(yTrue, yPred, labels)
  const precision = calculatePrecision(matrix)
  const recall = calculateRecall(matrix)
  const f1Score = calculateF1Score(precision, recall)
  const support = calculateSupport(yTrue, labels)

  return { matrix, precision, recall, f1Score, support }
}
