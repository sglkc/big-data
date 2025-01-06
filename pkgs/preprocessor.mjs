// @ts-check
import fs from 'node:fs'
import events from 'node:events'
import readline from 'node:readline'
import { dir } from './utils.mjs'

/**
 * Dataset dari CSV
 * @typedef {[review: string, rating: number]} Dataset
 */

/**
 * Memroses file dengan membaca setiap baris satu per satu
 * @param {string} file File yang ingin dibaca
 */
async function processLines(file) {
  const dataset = []
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  })

  let row = ''

  rl.on('line', (line) => {
    // lewati baris awal
    if (line === 'review,rating') return

    // jika diawali kutip dan tidak ada kutip penutup maka review terdiri dari beberapa baris
    if (!row.length && line.startsWith('"') && line.slice(-3, -2) !== '"')
      return (row += line)

    // jika terdapat baris sementara maka tambah baris ini
    if (row.length) {
      row += '\n' + line

      // jika tidak ada kutip penutup maka lanjut ke baris selanjutnya
      if (line.slice(-3, -1) !== '",') return
    } else {
      row = line
    }

    // menghapus kutip
    const review = row.slice(0, -2).replace(/^"|"$/g, '')

    // rating hanya 1-5 jadi ambil angka terakhir, sisanya review
    const rating = Number(row.slice(-1))

    dataset.push([review, rating])
    row = ''
  })

  await events.once(rl, 'close')

  return dataset
}

/**
 * @returns {Promise<Array<[review: string, rating: number]>>}
 */
export default async function processDatasets() {
  const results = []
  const collections = fs.readdirSync(dir('./dataset'))

  for await (const collection of collections) {
    const datasets = fs.readdirSync(dir('./dataset', collection))

    for await (const dataset of datasets) {
      const result = await processLines(dir('./dataset', collection, dataset))

      result.forEach(r => results.push(r))
    }
  }

  return results
}
