import { useLocalStorage, useDebounceFn } from '@vueuse/core'
/**
 * Data Export Composable
 * Handles export logic and state management for the admin export interface
 */
export const useDataExport = () => {
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

    // Only include non-empty arrays
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      cleaned.status = filters.status
    }
    if (filters.language && Array.isArray(filters.language) && filters.language.length > 0) {
      cleaned.language = filters.language
    }
    if (filters.primary_type && Array.isArray(filters.primary_type) && filters.primary_type.length > 0) {
      cleaned.primary_type = filters.primary_type
    }
    if (filters.role && Array.isArray(filters.role) && filters.role.length > 0) {
      cleaned.role = filters.role
    }

    // Only include non-empty strings
    if (filters.author_name && filters.author_name.trim()) {
      cleaned.author_name = filters.author_name.trim()
    }
    if (filters.search && filters.search.trim()) {
      cleaned.search = filters.search.trim()
    }
    if (filters.job && filters.job.trim()) {
      cleaned.job = filters.job.trim()
    }
    if (filters.birth_location && filters.birth_location.trim()) {
      cleaned.birth_location = filters.birth_location.trim()
    }
    if (filters.death_location && filters.death_location.trim()) {
      cleaned.death_location = filters.death_location.trim()
    }
    if (filters.location && filters.location.trim()) {
      cleaned.location = filters.location.trim()
    }

    // Only include date range if both start and end are provided
    if (filters.date_range && filters.date_range.start && filters.date_range.end) {
      cleaned.date_range = {
        start: filters.date_range.start,
        end: filters.date_range.end
      }
    }
    if (filters.birth_date_range && filters.birth_date_range.start && filters.birth_date_range.end) {
      cleaned.birth_date_range = {
        start: filters.birth_date_range.start,
        end: filters.birth_date_range.end
      }
    }
    if (filters.death_date_range && filters.death_date_range.start && filters.death_date_range.end) {
      cleaned.death_date_range = {
        start: filters.death_date_range.start,
        end: filters.death_date_range.end
      }
    }
    if (filters.last_login_range && filters.last_login_range.start && filters.last_login_range.end) {
      cleaned.last_login_range = {
        start: filters.last_login_range.start,
        end: filters.last_login_range.end
      }
    }

    // Only include boolean filters if they are true or explicitly false
    if (filters.featured_only === true) {
      cleaned.featured_only = true
    }
    if (filters.is_fictional !== undefined) {
      cleaned.is_fictional = filters.is_fictional
    }
    if (filters.email_verified !== undefined) {
      cleaned.email_verified = filters.email_verified
    }
    if (filters.is_active !== undefined) {
      cleaned.is_active = filters.is_active
    }

    // Only include numeric filters if they are greater than 0
    if (filters.min_views && filters.min_views > 0) {
      cleaned.min_views = filters.min_views
    }
    if (filters.min_likes && filters.min_likes > 0) {
      cleaned.min_likes = filters.min_likes
    }
    if (filters.min_quotes && filters.min_quotes > 0) {
      cleaned.min_quotes = filters.min_quotes
    }
    if (filters.min_collections && filters.min_collections > 0) {
      cleaned.min_collections = filters.min_collections
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

    useToast().toast({
      toast: "error",
      title: 'Download Export Failed',
      description: 'Failed to start download (no content or download URL available)',
    })
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
        useToast().toast({
          title: 'Export Failed',
          description: state.errorMessage,
        })
        return
      }

      if (shouldDownload) startDownload(response.data)

      state.successMessage = `Export generated successfully! ${response.data.record_count} records exported.`
      useToast().toast({
        title: 'Export Generated',
        description: shouldDownload
          ? `Successfully exported ${response.data.record_count} records. Download started.`
          : `Export is ready. You can download it from the history panel.`
      })

      state.previewData = null
      loadExportHistory()

    } catch (error: any) {
      console.error('Export failed:', error)
      const errorMsg = error.data?.message || 'Export failed'
      state.errorMessage = errorMsg

      useToast().toast({
        title: 'Export Failed',
        description: errorMsg,
      })
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

  const downloadContent = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const downloadContentBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const isAllSelected = computed(() => exportOptions.value.data_type.value === 'all')

  const loadExportHistory = async (page = 1) => {
    try {
      state.isLoadingHistory = true

      const response = await $fetch('/api/admin/export/history-with-backups', {
        query: {
          page,
          limit: state.historyPagination.limit
        }
      })

      if (response.success) {
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

      useToast().toast({
        title: 'Download Failed',
        description: 'Failed to start export download'
      })
    }
  }

  const deleteExportHistoryEntry = async (exportId: string) => {
    try {
      const response = await $fetch('/api/admin/export/history', {
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

      useToast().toast({
        title: 'Delete Failed',
        description: 'Failed to delete export history entry'
      })
    }
  }

  const clearAllExportHistory = async () => {
    try {
      const response = await $fetch('/api/admin/export/history/clear', {
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

      useToast().toast({
        title: 'Clear Failed',
        description: 'Failed to clear export history'
      })
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
      useToast().toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download backup file.',
        toast: 'error'
      })
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
