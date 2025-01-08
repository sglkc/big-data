// @ts-check

import Classificator from 'classificator'
import { Stemmer } from 'sastrawijs'
import Graphemer from 'graphemer'
import stopWords from './stop-words.mjs'

/** @type {import('graphemer').default} */
// @ts-ignore
const splitter = new Graphemer.default()
const stemmer = new Stemmer()

const emoji = (/** @type {string} */ term) => term.match(/^\p{Extended_Pictographic}+$/u)
const word = (/** @type {string} */ term) => term.match(/^[a-z]+$/)

export const classifyRating = (/** @type {number} */ rating) => rating < 3
  ? 'Negatif'
  : rating > 3
    ? 'Positif'
    : 'Netral'

export const normalize = (/** @type {string} */ term) => {
  if (word(term))
    return term
      .normalize('NFKC') // normalisasi huruf dengan aksen
      .replace(/\n/g, ' ') // menghapus enter untuk kalimat lebih dari 1 baris
      .replace(/(.)\1{3,}/g, '') // menghapus huruf yang dipanjang-panjangkan
      .replace(/[\d"',\.\-\_\+=\[\]\(\)\?!\\\/\|;;<>@#\$%\^&\* ]/g, '') // menghapus angka dan simbol
      .trim() // menghapus spasi di awal dan akhir kata

  // memisah semua emoji dari teks biasa
  return splitter.splitGraphemes(term)
}

export const filter = (/** @type {string} */ term) => {
  // jika emoji maka masukkan
  if (emoji(term)) return true

  // jika kata maka cek apakah ada di kamus
  if (word(term)) return term in stemmer.internalDictionary

  return false
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export const tokenizer = (text) => {
  // tokenization
  const terms = text.split(' ')
    // case folding
    .map((term) => term.toLowerCase())
    // normalization
    .flatMap(normalize)
    // filtering
    .filter(filter)
    // stop words removal
    .filter((term) => !stopWords.has(term))
    // stemming
    .map((term) => stemmer.stem(term))

  return terms
}

/**
 * @param {Array<[review: string, rating: number]>} set
 * @returns {string} JSON
 */
export default function trainModel(set) {
  const classificator = Classificator({ tokenizer })

  for (const [review, rating] of set) {
    const sentiment = classifyRating(rating)
    classificator.learn(review, sentiment)
  }

  return classificator.toJson()
}
