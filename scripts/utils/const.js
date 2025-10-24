import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT_DIR = join(fileURLToPath(import.meta.url), '../../../')
