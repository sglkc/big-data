// @ts-check

import Classificator from 'classificator'
import { Stemmer } from 'sastrawijs'
import stopWords from './stop-words.mjs'

const stemmer = new Stemmer()

export const classifyRating = (/** @type {number} */ rating) => rating < 3
  ? 'Negatif'
  : rating > 3
    ? 'Positif'
    : 'Netral'

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
    .map((term) => term.normalize())
    .map((term) => term.replace(/\n/g, ' ')) // menghapus enter untuk kalimat lebih dari 1 baris
    .map((term) => term.replace(/(.)\1{3,}/g, '')) // menghapus huruf yang dipanjang-panjangkan
    .map((term) => term.replace(/[\d"',\.\-\_\+=\[\]\(\)\?!\\\/\|;;<>@#\$%\^&\* ]/g, '')) // menghapus angka dan simbol
    .map((term) => term.trim()) // menghapus spasi di awal dan akhir kata
    // filtering
    // .flatMap((term) => term.split(/\p{Extended_Pictographic}/gu)) // memisah semua emoji dari teks biasa
    .filter((term) => term in stemmer.internalDictionary) // menghapus kata yang tidak ada dalam kamus
    // .filter((term) => term.match(/^[a-z]+$/gu)) // menghapus kata yang tidak diawali dan diakhiri huruf
    // .filter((term) => term.length) // menghapus kata kosong atau hanya spasi
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
  const classificator = Classificator({ tokenizer, fitPrior: false })

  for (const [review, rating] of set) {
    const sentiment = classifyRating(rating)
    classificator.learn(review, sentiment)
  }

  return classificator.toJson()
}
