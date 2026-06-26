import { useLocalStorage, useDebounceFn } from '@vueuse/core'
/**
 * Data Export Composable
 * Handles export logic and state management for the admin export interface
 */
export const useDataExport = () => {
  const { showErrorToast } = useErrorToast()
  const STORAGE_KEYS = {
    options: 'verbatims-admin-export-options',
    quotes: 'verbatims-admin-export-filters-quotes',
    references: 'verbatims-admin-export-filters-references',
    authors: 'verbatims-admin-export-filters-authors',
    users: 'verbatims-admin-export-filters-users',
    tags: 'verbatims-admin-export-filters-tags'
  } as const

  const state = reactive<ExportState>({
    isExporting: false,
    showProgressDialog: false,
    successMessage: '',
    errorMessage: '',
    previewData: null,
    exportHistory: [],
    isLoadingHistory: false,
    historyPagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasMore: false
    }
  })

  const exportOptions = ref<UIExportOptions>({
    format: { label: 'JSON', value: 'json' },
    data_type: { label: 'Quotes', value: 'quotes' },
    include_relations: true,
    include_user_data: false,
    include_moderation_data: false,
    include_analytics: true,
    include_metadata: false,
    download_after_export: true,
    limit: 0
  })

  const quotesFilters = ref<QuoteExportFilters>({
    status: [],
    language: [],
    author_name: '',
    date_range: {
      start: '',
      end: ''
    },
    search: '',
    featured_only: false,
    min_views: 0,
    min_likes: 0
  })

  const referencesFilters = ref<ReferenceExportFilters>({
    primary_type: [],
    search: '',
    date_range: {
      start: '',
      end: ''
    },
    min_views: 0,
    min_quotes: 0
  })

  const authorsFilters = ref<AuthorExportFilters>({
    search: '',
    is_fictional: undefined,
    job: '',
    date_range: {
      start: '',
      end: ''
    },
    birth_date_range: {
      start: '',
      end: ''
    },
    death_date_range: {
      start: '',
      end: ''
    },
    birth_location: '',
    death_location: '',
    min_views: 0,
    min_likes: 0,
    min_quotes: 0
  })

  const usersFilters = ref<UserExportFilters>({
    search: '',
    role: [],
    email_verified: undefined,
    is_active: undefined,
    date_range: {
      start: '',
      end: ''
    },
    last_login_range: {
      start: '',
      end: ''
    },
    language: [],
    location: '',
    job: '',
    min_quotes: 0,
    min_collections: 0
  })

  const tagsFilters = ref<TagExportFilters>({
    search: '',
    category: [],
    color: [],
    date_range: { start: '', end: '' },
    min_usage: 0,
    unused_only: false,
  })

  const formatOptions: { label: string; value: ExportFormat }[] = [
    { label: 'JSON', value: 'json' },
    { label: 'CSV', value: 'csv' },
    { label: 'XML', value: 'xml' }
  ]

  const statusOptions = [
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' }
  ]

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'French', value: 'fr' },
    { label: 'Latin', value: 'la' },
    { label: 'Spanish', value: 'es' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Russian', value: 'ru' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Chinese', value: 'zh' }
  ]

  const primaryTypeOptions = [
    { label: 'Book', value: 'book' },
    { label: 'Film', value: 'film' },
    { label: 'TV Series', value: 'tv_series' },
    { label: 'Music', value: 'music' },
    { label: 'Other', value: 'other' }
  ]

  // Persistence mirrors
  const savedExportOptions = useLocalStorage<any>(STORAGE_KEYS.options, {
    format: 'json',
    data_type: 'quotes',
    include_relations: true,
    include_user_data: false,
    include_moderation_data: false,
    include_analytics: true,
    include_metadata: false,
    download_after_export: true,
    limit: 0
  })

  const savedQuotesFilters = useLocalStorage<any>(STORAGE_KEYS.quotes, {
    status: [] as string[],
    language: [] as string[],
    author_name: '',
    date_range: { start: '', end: '' },
    search: '',
    featured_only: false,
    min_views: 0,
    min_likes: 0
  })

  const savedReferencesFilters = useLocalStorage<any>(STORAGE_KEYS.references, {
    primary_type: [] as string[],
    search: '',
    date_range: { start: '', end: '' },
    min_views: 0,
    min_quotes: 0
  })

  const savedAuthorsFilters = useLocalStorage<any>(STORAGE_KEYS.authors, {
    search: '',
    is_fictional: undefined as undefined | boolean,
    job: '',
    date_range: { start: '', end: '' },
    birth_date_range: { start: '', end: '' },
    death_date_range: { start: '', end: '' },
    birth_location: '',
    death_location: '',
    min_views: 0,
    min_likes: 0,
    min_quotes: 0
  })

  const savedUsersFilters = useLocalStorage<any>(STORAGE_KEYS.users, {
    search: '',
    role: [] as string[],
    email_verified: undefined as undefined | boolean,
    is_active: undefined as undefined | boolean,
    date_range: { start: '', end: '' },
    last_login_range: { start: '', end: '' },
    language: [] as string[],
    location: '',
    job: '',
    min_quotes: 0,
    min_collections: 0
  })

  const savedTagsFilters = useLocalStorage<any>(STORAGE_KEYS.tags, {
    search: '',
    category: [] as string[],
    color: [] as string[],
    date_range: { start: '', end: '' },
    min_usage: 0,
    unused_only: false,
  })

  const getCurrentFilters = () => {
    const dataType = exportOptions.value.data_type.value
    switch (dataType) {
      case 'quotes':
        return quotesFilters.value
      case 'references':
        return referencesFilters.value
      case 'authors':
        return authorsFilters.value
      case 'users':
        return usersFilters.value
      case 'tags':
        return tagsFilters.value
      default:
        return {}
    }
  }

  const cleanFilters = (filters: any) => {
    const cleaned: any = {}

    const arrayFields = ['status', 'language', 'primary_type', 'role', 'category', 'color']
    for (const field of arrayFields) {
      if (Array.isArray(filters[field]) && filters[field].length > 0) {
        cleaned[field] = filters[field]
      }
    }

    const stringFields = ['author_name', 'search', 'job', 'birth_location', 'death_location', 'location']
    for (const field of stringFields) {
      if (filters[field]?.trim()) {
        cleaned[field] = filters[field].trim()
      }
    }

    const dateRangeFields = ['date_range', 'birth_date_range', 'death_date_range', 'last_login_range']
    for (const field of dateRangeFields) {
      if (filters[field]?.start && filters[field]?.end) {
        cleaned[field] = { start: filters[field].start, end: filters[field].end }
      }
    }

    const strictBooleanFields = ['featured_only', 'unused_only']
    for (const field of strictBooleanFields) {
      if (filters[field] === true) cleaned[field] = true
    }

    const optionalBooleanFields = ['is_fictional', 'email_verified', 'is_active']
    for (const field of optionalBooleanFields) {
      if (filters[field] !== undefined) cleaned[field] = filters[field]
    }

    const positiveNumberFields = ['min_views', 'min_likes', 'min_quotes', 'min_collections', 'min_usage']
    for (const field of positiveNumberFields) {
      if (filters[field] && filters[field] > 0) {
        cleaned[field] = filters[field]
      }
    }

    return cleaned
  }

  const convertToApiOptions = (): ExportOptions => {
    const rawFilters = getCurrentFilters()
    const cleanedFilters = cleanFilters(rawFilters)

    return {
      format: exportOptions.value.format.value,
      data_type: exportOptions.value.data_type.value,
      filters: cleanedFilters,
      include_metadata: exportOptions.value.include_metadata,
      include_relations: exportOptions.value.include_relations,
      include_user_data: exportOptions.value.include_user_data,
      include_moderation_data: exportOptions.value.include_moderation_data,
      include_analytics: exportOptions.value.include_analytics,
      limit: exportOptions.value.limit
    }
  }

  const buildAllApiOptions = () => {
    return {
      format: exportOptions.value.format.value,
      data_type: 'all' as const,
      include_metadata: exportOptions.value.include_metadata,
      include_relations: exportOptions.value.include_relations,
      include_user_data: exportOptions.value.include_user_data,
      include_moderation_data: exportOptions.value.include_moderation_data,
      include_analytics: exportOptions.value.include_analytics,
      limit: exportOptions.value.limit,
      all_filters: {
        quotes: cleanFilters(quotesFilters.value),
        references: cleanFilters(referencesFilters.value),
        authors: cleanFilters(authorsFilters.value),
        users: cleanFilters(usersFilters.value)
      }
    }
  }

  const validateExport = async () => {
    try {
      state.errorMessage = ''

      const dataType = exportOptions.value.data_type.value
      const apiOptions = dataType === 'all' ? (buildAllApiOptions() as any) : convertToApiOptions()

      let apiEndpoint = ''

      switch (dataType) {
        case 'all':
          apiEndpoint = '/api/admin/export/all/validate'
          break
        case 'quotes':
          apiEndpoint = '/api/admin/export/quotes/validate'
          break
        case 'references':
          apiEndpoint = '/api/admin/export/references/validate'
          break
        case 'authors':
          apiEndpoint = '/api/admin/export/authors/validate'
          break
        case 'users':
          apiEndpoint = '/api/admin/export/users/validate'
          break
        case 'tags':
          apiEndpoint = '/api/admin/export/tags/validate'
          break
        default:
          state.errorMessage = `Validation for ${dataType} export is not yet implemented. You can still proceed with the export.`
          return
      }

      const response = await $fetch<{ success: boolean; data: any }>(apiEndpoint, {
        method: 'POST',
        body: apiOptions
      })

      state.previewData = response.data

      if (!response.data.valid) {
        state.errorMessage = 'Export validation failed. Please check the errors below.'
      }

    } catch (error: any) {
      console.error('Export validation failed:', error)
      state.errorMessage = error.data?.message || 'Failed to validate export'
    }
  }

  const getExportEndpoint = (dataType: string): string => {
    switch (dataType) {
      case 'all':
        return '/api/admin/export/all'
      case 'quotes':
        return '/api/admin/export/quotes'
      case 'references':
        return '/api/admin/export/references'
      case 'authors':
        return '/api/admin/export/authors'
      case 'users':
        return '/api/admin/export/users'
      case 'tags':
        return '/api/admin/export/tags'
      default:
        throw new Error('Invalid data type selected')
    }
  }

  const startDownload = (data: { content?: string; download_url?: string; mimeType?: string; filename: string }) => {
    if (data.content && data.mimeType) {
      downloadContent(data.content, data.filename, data.mimeType)
      return
    }

    if (data.download_url) {
      window.open(data.download_url, '_blank')
      return
    }

    showErrorToast(null, { title: 'Download Export Failed', fallback: 'Failed to start download (no content or download URL available)' })
  }

  const startExport = async () => {
    try {
      state.isExporting = true
      state.showProgressDialog = true
      state.errorMessage = ''
      state.successMessage = ''
      const shouldDownload = exportOptions.value.download_after_export

      const dataType = exportOptions.value.data_type.value
      let apiEndpoint = getExportEndpoint(dataType)

      if (dataType === 'all') {
        // Request a ZIP blob containing each dataset in the chosen internal format
        const allOptions = buildAllApiOptions()
        const blob = await $fetch<Blob>(apiEndpoint, {
          method: 'POST',
          body: allOptions,
          responseType: 'blob'
        })

        if (shouldDownload && blob) {
          const ts = new Date().toISOString().slice(0, 10)
          const name = `verbatims-export-${ts}.zip`
          downloadContentBlob(blob, name)
        }

        state.successMessage = 'Combined export generated successfully!'
        state.previewData = null
        await loadExportHistory()
        return
      }

      const apiOptions = convertToApiOptions()
      const response = await $fetch<ExportResult>(apiEndpoint, {
        method: 'POST',
        body: apiOptions
      })

      if (!response.success) {
        state.errorMessage = response.error || 'Unknown error occurred'
        showErrorToast(null, { title: 'Export Failed', fallback: state.errorMessage })
        return
      }

      if (shouldDownload) startDownload(response.data)

      state.successMessage = `Export generated successfully! ${response.data.record_count} records exported.`
      useToast().toast({
        title: 'Export Generated',
        description: shouldDownload
          ? `Successfully exported ${response.data.record_count} records. Download started.`
          : `Export is ready. You can download it from the history panel.`,
        toast: 'soft-success',
      })

      state.previewData = null
      loadExportHistory()

    } catch (error: any) {
      console.error('Export failed:', error)
      const errorMsg = error.data?.message || 'Export failed'
      state.errorMessage = errorMsg
      showErrorToast(error, 'Export Failed')
    } finally {
      state.isExporting = false
      state.showProgressDialog = false
    }
  }

  const clearMessages = () => {
    state.successMessage = ''
    state.errorMessage = ''
  }

  const closeProgressDialog = () => {
    state.showProgressDialog = false
  }

  const setDataType = (dataType: { label: string; value: ExportDataType; available?: boolean }) => {
    if (dataType?.available === false) return
    exportOptions.value.data_type = { label: dataType.label, value: dataType.value }
    state.previewData = null
    clearMessages()
  }

  const getIncludeRelationsLabel = () => {
    const dataType = exportOptions.value.data_type.value as ExportDataType
    switch (dataType) {
      case 'all':
        return 'Include related data in each file'
      case 'quotes':
        return 'Include related data (author, reference, tags)'
      case 'references':
        return 'Include quotes count'
      case 'authors':
        return 'Include quotes count'
      case 'users':
        return 'Include collection data'
      default:
        return 'Include related data'
    }
  }

  const init = async () => {
    const eo = exportOptions.value
    const fmt = (formatOptions).find((f) => f.value === savedExportOptions.value.format)
    if (fmt) eo.format = fmt as { label: string; value: ExportFormat }

    const dt = (savedExportOptions.value.data_type || 'quotes') as ExportDataType
    const dtLabel: Record<ExportDataType, string> = {
      quotes: 'Quotes',
      references: 'References',
      authors: 'Authors',
      users: 'Users',
      tags: 'Tags',
      all: 'Everything'
    }
    
    eo.data_type = { label: dtLabel[dt], value: dt }

    eo.include_relations = savedExportOptions.value.include_relations
    eo.include_user_data = savedExportOptions.value.include_user_data
    eo.include_moderation_data = savedExportOptions.value.include_moderation_data
    eo.include_analytics = savedExportOptions.value.include_analytics
    eo.include_metadata = savedExportOptions.value.include_metadata
    eo.download_after_export = !!savedExportOptions.value.download_after_export
    eo.limit = savedExportOptions.value.limit

    quotesFilters.value      = { ...(quotesFilters.value), ...(savedQuotesFilters.value) }
    referencesFilters.value  = { ...(referencesFilters.value), ...(savedReferencesFilters.value) }
    authorsFilters.value     = { ...(authorsFilters.value), ...(savedAuthorsFilters.value) }
    usersFilters.value       = { ...(usersFilters.value), ...(savedUsersFilters.value) }
    tagsFilters.value        = { ...(tagsFilters.value), ...(savedTagsFilters.value) }

    await loadExportHistory()
  }

  // Auto-initialize on client mount to restore persisted options/filters
  const initialized = ref(false)
  onMounted(async () => {
    if (initialized.value) return
    initialized.value = true
    await init()
  })

  // Persist exportOptions primitives
  watch(
    () => ({ ...exportOptions.value }),
    (opts) => {
      savedExportOptions.value = {
        format: opts.format?.value || 'json',
        data_type: (opts.data_type?.value || 'quotes'),
        include_relations: !!opts.include_relations,
        include_user_data: !!opts.include_user_data,
        include_moderation_data: !!opts.include_moderation_data,
        include_analytics: !!opts.include_analytics,
        include_metadata: !!opts.include_metadata,
        download_after_export: !!(opts as any).download_after_export,
        limit: Number(opts.limit || 0)
      }
    },
    { deep: true }
  )

  // Persist each filter group
  watch(() => ({ ...quotesFilters.value }),     v => { savedQuotesFilters.value     = v as QuoteExportFilters }, { deep: true })
  watch(() => ({ ...referencesFilters.value }), v => { savedReferencesFilters.value = v as ReferenceExportFilters }, { deep: true })
  watch(() => ({ ...authorsFilters.value }),    v => { savedAuthorsFilters.value    = v as AuthorExportFilters }, { deep: true })
  watch(() => ({ ...usersFilters.value }),      v => { savedUsersFilters.value      = v as UserExportFilters }, { deep: true })
  watch(() => ({ ...tagsFilters.value }),       v => { savedTagsFilters.value       = v as TagExportFilters }, { deep: true })

  const resetFilters = (opts?: { clearStorage?: boolean }) => {
    const defaultFmt = (formatOptions as any[]).find((f: any) => f.value === 'json') || (formatOptions as any[])[0]
    exportOptions.value = {
      format: defaultFmt,
      data_type: { label: 'Quotes', value: 'quotes' },
      include_relations: true,
      include_user_data: false,
      include_moderation_data: false,
      include_analytics: true,
      include_metadata: false,
      download_after_export: true,
      limit: 0
    }

    quotesFilters.value = {
      status: [],
      language: [],
      author_name: '',
      date_range: { start: '', end: '' },
      search: '',
      featured_only: false,
      min_views: 0,
      min_likes: 0
    }

    referencesFilters.value = {
      primary_type: [],
      search: '',
      date_range: { start: '', end: '' },
      min_views: 0,
      min_quotes: 0
    }

    authorsFilters.value = {
      search: '',
      is_fictional: undefined,
      job: '',
      date_range: { start: '', end: '' },
      birth_date_range: { start: '', end: '' },
      death_date_range: { start: '', end: '' },
      birth_location: '',
      death_location: '',
      min_views: 0,
      min_likes: 0,
      min_quotes: 0
    }

    usersFilters.value = {
      search: '',
      role: [],
      email_verified: undefined,
      is_active: undefined,
      date_range: { start: '', end: '' },
      last_login_range: { start: '', end: '' },
      language: [],
      location: '',
      job: '',
      min_quotes: 0,
      min_collections: 0
    }

    state.previewData = null
    state.errorMessage = ''
    state.successMessage = ''

    if (opts?.clearStorage && typeof window !== 'undefined') {
      const keys = [
        STORAGE_KEYS.options,
        STORAGE_KEYS.quotes,
        STORAGE_KEYS.references,
        STORAGE_KEYS.authors,
        STORAGE_KEYS.users
      ]
      try {
        keys.forEach(k => window.localStorage.removeItem(k))
      } catch {}
      // Reset mirrors
      savedExportOptions.value = {
        format: 'json',
        data_type: 'quotes',
        include_relations: true,
        include_user_data: false,
        include_moderation_data: false,
        include_analytics: true,
        include_metadata: false,
        download_after_export: true,
        limit: 0
      }
      savedQuotesFilters.value = { ...quotesFilters.value } as any
      savedReferencesFilters.value = { ...referencesFilters.value } as any
      savedAuthorsFilters.value = { ...authorsFilters.value } as any
      savedUsersFilters.value = { ...usersFilters.value } as any
      savedTagsFilters.value = { ...tagsFilters.value } as any
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const downloadContent = (content: string, filename: string, mimeType: string) => {
    downloadBlob(new Blob([content], { type: mimeType }), filename)
  }

  const downloadContentBlob = downloadBlob

  const isAllSelected = computed(() => exportOptions.value.data_type.value === 'all')

  const loadExportHistory = async (page = 1) => {
    try {
      state.isLoadingHistory = true

      const response = await $fetch<ApiResponse<{ entries: any[]; pagination: any }>>('/api/admin/export/history-with-backups', {
        query: {
          page,
          limit: state.historyPagination.limit
        }
      })

      if (response.success && response.data) {
        state.exportHistory = response.data.entries
        state.historyPagination = {
          ...state.historyPagination,
          ...response.data.pagination
        }
      }

    } catch (error: any) {
      console.error('Failed to load export history:', error)
      state.errorMessage = 'Failed to load export history'
    } finally {
      state.isLoadingHistory = false
    }
  }

  const downloadExport = async (exportId: string) => {
    try {
      window.open(`/api/admin/export/download/${exportId}`, '_blank')
    } catch (error: any) {
      console.error('Failed to download export:', error)
      state.errorMessage = 'Failed to download export'
      showErrorToast(error, 'Failed to Export')
    }
  }

  const deleteExportHistoryEntry = async (exportId: string) => {
    try {
      const response = await $fetch<ApiResponse<unknown>>('/api/admin/export/history', {
        method: 'DELETE',
        body: { exportId }
      })

      if (!response.success) throw new Error(response.message || 'Failed to delete export history entry')
      
      state.exportHistory = state.exportHistory.filter(entry => entry.id !== exportId)

      if (state.exportHistory.length === 0 && state.historyPagination.page > 1) {
        await loadExportHistory(state.historyPagination.page - 1)
        return
      }

      // Recalculate pagination
      state.historyPagination.total = Math.max(0, state.historyPagination.total - 1)
      state.historyPagination.totalPages = Math.ceil(state.historyPagination.total / state.historyPagination.limit)
    } catch (error: any) {
      console.error('Failed to delete export history entry:', error)
      state.errorMessage = error.data?.message || 'Failed to delete export history entry'
      showErrorToast(error, 'Clear Failed')
    }
  }

  const clearAllExportHistory = async () => {
    try {
      const response = await $fetch<ApiResponse<unknown>>('/api/admin/export/history/clear', {
        method: 'DELETE',
        body: { confirm: true }
      })

      if (response.success) {
        state.exportHistory = []
        state.historyPagination = {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      }
    } catch (error: any) {
      console.error('Failed to clear export history:', error)
      state.errorMessage = error.data?.message || 'Failed to clear export history'
      showErrorToast(error, 'Download Failed')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFormatColor = (format: string) => {
    const colors = {
      json: 'blue',
      csv: 'green',
      xml: 'orange'
    }
    return colors[format as keyof typeof colors] || 'gray'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string | undefined) => {
    if (!expiresAt) return true
    return new Date(expiresAt) <= new Date()
  }

  const getBackupStatusLabel = (status: string) => {
    const labels = {
      'uploading': 'Uploading',
      'stored': 'Stored',
      'failed': 'Failed',
      'expired': 'Expired'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getBackupStatusColor = (status: string) => {
    const colors = {
      'uploading': '#0046FF',
      'stored': '#78C841',
      'failed': '#FB4141',
      'expired': '#D7D7D7'
    }
    return colors[status as keyof typeof colors] || '#D7D7D7'
  }

  const downloadBackup = async (backupId: number) => {
    try {
      const downloadUrl = `/api/admin/backup/download/${backupId}`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error: any) {
      console.error('Backup download error:', error)
      showErrorToast(error, 'Download Failed')
    }
  }

  // Debounced preview trigger and auto-preview watchers
  const triggerPreviewUpdate = useDebounceFn(async () => {
    if (!exportOptions.value.format?.value) return
    if (state.isExporting) return
    await validateExport()
  }, 600)

  const autoPreviewStarted = ref(false)
  const startAutoPreview = () => {
    if (autoPreviewStarted.value) return
    autoPreviewStarted.value = true

    // Watch export option changes (format, data_type, include flags, limit)
    watch(
      () => ({ ...exportOptions.value }),
      () => {
        triggerPreviewUpdate()
      },
      { deep: true }
    )

    // Watch filters per data type; only trigger when relevant for current selection or when 'all'
    watch(
      () => ({ ...quotesFilters.value }),
      () => {
        const dt = exportOptions.value.data_type.value
        if (dt === 'quotes' || dt === 'all') triggerPreviewUpdate()
      },
      { deep: true }
    )

    watch(
      () => ({ ...referencesFilters.value }),
      () => {
        const dt = exportOptions.value.data_type.value
        if (dt === 'references' || dt === 'all') triggerPreviewUpdate()
      },
      { deep: true }
    )

    watch(
      () => ({ ...authorsFilters.value }),
      () => {
        const dt = exportOptions.value.data_type.value
        if (dt === 'authors' || dt === 'all') triggerPreviewUpdate()
      },
      { deep: true }
    )

    watch(
      () => ({ ...usersFilters.value }),
      () => {
        const dt = exportOptions.value.data_type.value
        if (dt === 'users' || dt === 'all') triggerPreviewUpdate()
      },
      { deep: true }
    )

    // Watch tags filters for preview update
    watch(
      () => ({ ...tagsFilters.value }),
      () => {
        const dt = exportOptions.value.data_type.value
        if (dt === 'tags' || dt === 'all') triggerPreviewUpdate()
      },
      { deep: true }
    )
  }

  return {
    // State
    state,
    exportOptions,
    quotesFilters,
    referencesFilters,

	    tagsFilters,

    authorsFilters,
    usersFilters,

    // Options
    formatOptions,
    statusOptions,
    languageOptions,
    primaryTypeOptions,

    // Methods
    getCurrentFilters,
    validateExport,
    startExport,
    resetFilters,
    clearMessages,
    closeProgressDialog,
    setDataType,
    getIncludeRelationsLabel,
    init,
    loadExportHistory,
    downloadExport,
    deleteExportHistoryEntry,
    clearAllExportHistory,

    // Utilities
    formatFileSize,
    getFormatColor,
    formatDate,
    isExpired,
    isAllSelected,

    // Backup utilities
    getBackupStatusLabel,
    getBackupStatusColor,
  downloadBackup,

  // Auto preview API
  triggerPreviewUpdate,
  startAutoPreview
  }
}
