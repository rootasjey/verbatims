import type {
  QuoteExportFilters,
  ReferenceExportFilters,
  AuthorExportFilters,
  UserExportFilters,
  ExportResult,
  ExportOptions,
  UIExportOptions,
  ExportState // Uses ExportHistoryEntryWithBackup[] for exportHistory
} from '~/types/export'

/**
 * Data Export Composable
 * Handles export logic and state management for the admin export interface
 */
export const useDataExport = () => {
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

  // Options for selects
  const formatOptions = [
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

  const validateExport = async () => {
    try {
      state.errorMessage = ''

      const dataType = exportOptions.value.data_type.value
      const apiOptions = convertToApiOptions()

      let apiEndpoint = ''

      switch (dataType) {
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
        default:
          state.errorMessage = `Validation for ${dataType} export is not yet implemented. You can still proceed with the export.`
          return
      }

      const response = await $fetch(apiEndpoint, {
        method: 'POST',
        body: apiOptions
      }) as { success: boolean; data: any }

      state.previewData = response.data

      if (!response.data.valid) {
        state.errorMessage = 'Export validation failed. Please check the errors below.'
      }

    } catch (error: any) {
      console.error('Export validation failed:', error)
      state.errorMessage = error.data?.message || 'Failed to validate export'
    }
  }

  const startExport = async () => {
    try {
      state.isExporting = true
      state.showProgressDialog = true
      state.errorMessage = ''
      state.successMessage = ''

      const dataType = exportOptions.value.data_type.value
      let apiEndpoint = ''

      switch (dataType) {
        case 'quotes':
          apiEndpoint = '/api/admin/export/quotes'
          break
        case 'references':
          apiEndpoint = '/api/admin/export/references'
          break
        case 'authors':
          apiEndpoint = '/api/admin/export/authors'
          break
        case 'users':
          apiEndpoint = '/api/admin/export/users'
          break
        default:
          throw new Error('Invalid data type selected')
      }

      const apiOptions = convertToApiOptions()
      const response = await $fetch(apiEndpoint, {
        method: 'POST',
        body: apiOptions
      }) as ExportResult

      if (response.success) {
        if (response.data.content && response.data.mimeType) {
          downloadContent(response.data.content, response.data.filename, response.data.mimeType)
          state.successMessage = `Export completed successfully! ${response.data.record_count} records exported.`
          useToast().toast({
            title: 'Export Completed',
            description: `Successfully exported ${response.data.record_count} records`
          })
        } else {
          window.open(response.data.download_url, '_blank')
          state.successMessage = `Export completed successfully! ${response.data.record_count} records exported. Download started.`
          useToast().toast({
            title: 'Export Completed',
            description: `Successfully exported ${response.data.record_count} records. Download started.`
          })
        }

        state.previewData = null
        loadExportHistory()
      }

    } catch (error: any) {
      console.error('Export failed:', error)
      const errorMsg = error.data?.message || 'Export failed'
      state.errorMessage = errorMsg

      useToast().toast({
        title: 'Export Failed',
        description: errorMsg
      })
    } finally {
      state.isExporting = false
      state.showProgressDialog = false
    }
  }

  const resetFilters = () => {
    const dataType = exportOptions.value.data_type.value

    if (dataType === 'quotes') {
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
    } else if (dataType === 'references') {
      referencesFilters.value = {
        primary_type: [],
        search: '',
        date_range: { start: '', end: '' },
        min_views: 0,
        min_quotes: 0
      }
    } else if (dataType === 'authors') {
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
    }

    state.previewData = null
    state.errorMessage = ''
    state.successMessage = ''
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
        method: 'DELETE' as any,
        body: { exportId }
      })

      if (response.success) {
        state.exportHistory = state.exportHistory.filter(entry => entry.id !== exportId)

        if (state.exportHistory.length === 0 && state.historyPagination.page > 1) {
          await loadExportHistory(state.historyPagination.page - 1)
          return
        }

        // Recalculate pagination
        state.historyPagination.total = Math.max(0, state.historyPagination.total - 1)
        state.historyPagination.totalPages = Math.ceil(state.historyPagination.total / state.historyPagination.limit)
      }
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

  return {
    // State
    state,
    exportOptions,
    quotesFilters,
    referencesFilters,
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
    loadExportHistory,
    downloadExport,
    deleteExportHistoryEntry,
    clearAllExportHistory,

    // Utilities
    formatFileSize,
    getFormatColor,
    formatDate,
    isExpired,

    // Backup utilities
    getBackupStatusLabel,
    getBackupStatusColor,
    downloadBackup
  }
}
