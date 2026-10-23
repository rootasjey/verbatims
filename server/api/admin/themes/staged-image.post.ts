import { blob } from 'hub:blob'
import { randomUUID } from 'node:crypto'
import { extFromContentType } from '~~/server/utils/image-storage'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const formData = await readMultipartFormData(event)
  if (!formData) throwServer(400, 'No file provided')

  const file = formData.find(part => part.name === 'image')
  if (!file?.data?.length) throwServer(400, 'No image file provided')

  const contentType = file.type || 'image/jpeg'
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throwServer(400, 'Image must be JPEG, PNG, WebP, GIF, or AVIF')
  }
  if (file.data.length > MAX_FILE_SIZE) throwServer(400, 'Image must be less than 5MB')

  const key = `images/theme-staging/${randomUUID()}${extFromContentType(contentType)}`
  const data = file.data.byteOffset === 0 && file.data.byteLength === file.data.buffer.byteLength
    ? file.data.buffer as ArrayBuffer
    : file.data.slice().buffer as ArrayBuffer

  await blob.put(key, new Blob([data], { type: contentType }), {
    addRandomSuffix: false,
    contentType,
  })

  return { success: true, data: { url: `/blob/${key}` } }
})
