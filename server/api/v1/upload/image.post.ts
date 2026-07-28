import { blob } from 'hub:blob'
import { randomUUID } from 'node:crypto'

defineRouteMeta({
  openAPI: {
    summary: 'Upload an image',
    description: 'Uploads an image file and returns its /blob/ URL for use in author/reference create/update calls.',
    tags: ['Upload'],
    security: [{ apiKey: ['write:authors', 'write:references'] }],
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              image: { type: 'string', format: 'binary', description: 'Image file (max 5MB)' },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Image uploaded' },
      '400': { description: 'Invalid file' },
      '403': { description: 'Insufficient role' },
    },
  },
})

const MAX_FILE_SIZE = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiKeyRole(api, 'user', 'moderator', 'admin')
  requireApiPermission(api, 'write:authors', 'write:references')

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throwServer(400, 'No file provided')
  }

  const file = formData.find((f) => f.name === 'image')

  if (!file || !file.data || file.data.length === 0) {
    throwServer(400, 'No image file provided')
  }

  const mimeType = file!.type || 'image/jpeg'
  if (!mimeType.startsWith('image/')) {
    throwServer(400, 'File must be an image')
  }

  if (file!.data.length > MAX_FILE_SIZE) {
    throwServer(400, 'Image must be less than 5MB')
  }

  const ext = extFromContentType(mimeType)
  const id = randomUUID()
  const key = `images/uploads/${id}${ext}`

  const raw = file!.data
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
