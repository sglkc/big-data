// @ts-ignore
import Classificator from 'https://esm.sh/classificator'
import { Stemmer } from 'https://esm.sh/sastrawijs'
import stopWords from './pkgs/stop-words.mjs'

const $ = document.querySelector.bind(document)
const res = await fetch('./model.json')
const dataset = await res.json()

/** @type {import('classificator').NaiveBayes} */
const classificator = Classificator.fromJson(dataset)

/** @type {import('sastrawijs').Stemmer} */
const stemmer = new Stemmer()

const form = $('form')
const input = $('input')

const elms = {
  tokenization: { before: $('#tokenization-before'), after: $('#tokenization-after') },
  caseFolding: { before: $('#case-folding-before'), after: $('#case-folding-after') },
  normalization: { before: $('#normalization-before'), after: $('#normalization-after') },
  filtering: { before: $('#filtering-before'), after: $('#filtering-after') },
  stopWords: { before: $('#stop-words-before'), after: $('#stop-words-after') },
  stemming: { before: $('#stemming-before'), after: $('#stemming-after') },
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  analysis(input.value)
  $('main').classList.remove('empty')
})

function tokenization(review) {
  const tokens = review.split(' ')
    .flatMap((term) => term.match(/\p{Extended_Pictographic}+/u)
      ? [...new Intl.Segmenter().segment(term)].map(x => x.segment)
      : term)

  elms.tokenization.before.textContent = review
  tokens.forEach((token) => elms.tokenization.after.innerHTML += `<span class="chip add">${token}</span>`)

  return tokens
}

function filtering(tokens) {
  const filtered = tokens.filter((token) => {
    if (token.match(/\p{Extended_Pictographic}+/u)) return true
    return token.match(/^[a-z]+$/)
  })

  for (let i = 0, j = 0; i < tokens.length; i++, j++) {
    let isDeleted = false

    if (filtered[j] !== tokens[i]) {
      isDeleted = true;
      j--
    }

    elms.filtering.before.innerHTML += `<span class="chip ${isDeleted ? 'del' : ''}">${tokens[i]}</span>`
    elms.filtering.after.innerHTML += `<span class="chip ${isDeleted ? 'hidden' : ''}">${tokens[i]}</span>`
  }

  return filtered
}

function caseFolding(tokens) {
  const caseFolded = tokens.map(r => r.toLowerCase())

  caseFolded.forEach((token, i) => {
    const isAdded = token !== tokens[i]
    elms.caseFolding.before.innerHTML += `<span class="chip ${isAdded ? 'del' : ''}">${tokens[i]}</span>`
    elms.caseFolding.after.innerHTML += `<span class="chip ${isAdded ? 'add' : ''}">${token}</span>`
  })

  return caseFolded
}

function normalization(tokens) {
  const normalized = tokens.map((token) => token
    .normalize('NFKC') // normalisasi huruf dengan aksen
    .replace(/\n/g, ' ') // menghapus enter untuk kalimat lebih dari 1 baris
    .replace(/(.)\1{3,}/g, '') // menghapus huruf yang dipanjang-panjangkan
    .replace(/[\d"',\.\-\_\+=\[\]\(\)\?!\\\/\|;;<>@#\$%\^&\* ]/g, '') // menghapus angka dan simbol
    .trim() // menghapus spasi di awal dan akhir kata
  )

  normalized.forEach((token, i) => {
    const isAdded = token !== tokens[i]
    elms.normalization.before.innerHTML += `<span class="chip ${isAdded ? 'del' : ''}">${tokens[i]}</span>`
    elms.normalization.after.innerHTML += `<span class="chip ${isAdded ? 'add' : ''}">${token}</span>`
  })

  return normalized
}

function stopWordsRemoval(tokens) {
  const removed = tokens.filter((token) => !stopWords.has(token))

  for (let i = 0, j = 0; i < tokens.length; i++, j++) {
    let isDeleted = false

    if (removed[j] !== tokens[i]) {
      isDeleted = true;
      j--
    }

    elms.stopWords.before.innerHTML += `<span class="chip ${isDeleted ? 'del' : ''}">${tokens[i]}</span>`
    elms.stopWords.after.innerHTML += `<span class="chip ${isDeleted ? 'hidden' : ''}">${tokens[i]}</span>`
  }

  return removed
}

function stemming(tokens) {
  const stemmed = tokens.map((token) => stemmer.stem(token))

  stemmed.forEach((token, i) => {
    const isAdded = token !== tokens[i]
    elms.stemming.before.innerHTML += `<span class="chip ${isAdded ? 'del' : ''}">${tokens[i]}</span>`
    elms.stemming.after.innerHTML += `<span class="chip ${isAdded ? 'add' : ''}">${token}</span>`
  })

  return stemmed
}

function analysis(review) {
  Object.values(elms).forEach((elm) => {
    elm.before.innerHTML = ''
    elm.after.innerHTML = ''
  })

  // TOKENIZATION
  const tokens = tokenization(review)
  const normalized = normalization(tokens)
  const caseFolded = caseFolding(normalized)
  const filtered = filtering(caseFolded)
  const removed = stopWordsRemoval(filtered)
  const stemmed = stemming(removed)

  const sentimentElm = $('#sentimen')
  const classification = classificator.categorize(stemmed.join(' '))

  classification.likelihoods.forEach((likelihood) => {
    $(`#${likelihood.category.toLowerCase()}-prob`).textContent = likelihood.proba
  })

  sentimentElm.textContent = classification.predictedCategory

  switch(classification.predictedCategory) {
    case 'Positif': sentimentElm.className = 'p-1 bg-green-200'; break
    case 'Netral': sentimentElm.className = 'p-1 bg-gray-200'; break
    case 'Negatif': sentimentElm.className = 'p-1 bg-red-200'; break
  }

  console.log(classification)
}

// @ts-ignore
window.classificator = classificator
// @ts-ignore
window.analysis = analysis
