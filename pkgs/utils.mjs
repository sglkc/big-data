// @ts-check
import path from 'node:path'
import fs from 'node:fs'

export const dir = (/** @type {string[]} */ ...paths) =>
  path.join(import.meta.dirname, '..', ...paths)

export const readSync = (/** @type {string} */ path) =>
  fs.readFileSync(dir(path), { encoding: 'utf8' })

export const writeSync = (/** @type {string} */ path, /** @type {string} */ content) =>
  fs.writeFileSync(dir(path), content, { encoding: 'utf8' })
