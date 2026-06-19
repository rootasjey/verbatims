export function useImageUpload() {
  const { showErrorToast } = useErrorToast()
  const uploading = ref(false)

  async function uploadImage(file: File): Promise<string | null> {
    if (!file.type.startsWith('image/')) {
      showErrorToast(null, { title: 'Invalid file', fallback: 'Please select an image file.' })
      return null
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast(null, { title: 'File too large', fallback: 'Image must be less than 5MB.' })
      return null
    }

    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await $fetch<{ success: boolean; data: { url: string } }>('/api/admin/upload/image', {
        method: 'POST',
        body: formData,
      })
      return response.data.url
    } catch (error: any) {
      showErrorToast(error, 'Upload failed')
      return null
    } finally {
      uploading.value = false
    }
  }

  return { uploading, uploadImage }
}
