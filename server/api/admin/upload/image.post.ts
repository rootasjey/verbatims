import { blob } from 'hub:blob'
import { randomUUID } from 'node:crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const file = formData.find((f) => f.name === 'image')

  if (!file || !file.data || file.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No image file provided' })
  }

  const mimeType = file.type || 'image/jpeg'
  if (!mimeType.startsWith('image/')) {
    throw createError({ statusCode: 400, statusMessage: 'File must be an image' })
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'Image must be less than 5MB' })
  }

  const ext = extFromContentType(mimeType)
  const id = randomUUID()
  const key = `images/uploads/${id}${ext}`

  const raw = file.data
  const ab = raw.byteOffset === 0 && raw.byteLength === raw.buffer.byteLength
    ? (raw.buffer as ArrayBuffer)
    : raw.slice().buffer as ArrayBuffer
  const uploadData = new Blob([ab], { type: mimeType })

  await blob.put(key, uploadData, {
    addRandomSuffix: false,
  })

  return {
    success: true,
    data: {
      url: `/blob/${key}`,
    },
  }
})
