export function useImageUpload() {
  const uploading = ref(false)

  async function uploadImage(file: File): Promise<string | null> {
    if (!file.type.startsWith('image/')) {
      useToast().toast({ title: 'Invalid file', description: 'Please select an image file.', toast: 'soft-error' })
      return null
    }

    if (file.size > 5 * 1024 * 1024) {
      useToast().toast({ title: 'File too large', description: 'Image must be less than 5MB.', toast: 'soft-error' })
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
      useToast().toast({
        title: 'Upload failed',
        description: error?.data?.statusMessage || 'Could not upload the image.',
        toast: 'soft-error',
      })
      return null
    } finally {
      uploading.value = false
    }
  }

  return { uploading, uploadImage }
}
