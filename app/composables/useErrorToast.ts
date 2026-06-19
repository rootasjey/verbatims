export function useErrorToast() {
  const { toast } = useToast()

  function showErrorToast(
    error: unknown,
    options?: string | { title?: string; fallback?: string }
  ) {
    const opts = typeof options === 'string' ? { fallback: options } : (options ?? {})
    const err = error as Record<string, any> | undefined
    const details = err?.data?.statusMessage
      || err?.statusMessage
      || err?.data?.message
      || err?.message
      || opts.fallback
      || 'An error occurred'

    toast({
      toast: 'soft-error',
      title: opts.title || 'Error',
      description: details,
      actions: [{
        label: 'Copy',
        btn: 'soft-gray',
        altText: 'Copy error details',
        onClick: () => navigator.clipboard.writeText(details)
      }]
    })
  }

  return { showErrorToast }
}
