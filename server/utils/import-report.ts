import { uploadBackupFile } from '~/server/utils/backup-storage'
import { createBackupFile } from '~/server/utils/backup-database'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export interface ImportFailureEntry {
  index: number
  reason: string
  item?: any
}

export interface ImportReportHandle {
  addFailure(entry: ImportFailureEntry): void
  addWarning(message: string): void
  finalize(): Promise<{
    fileKey: string
    filePath: string
    backupId?: number
  } | null>
  failureCount(): number
}

/**
 * Create an import report writer that batches failure entries and writes them as NDJSON or CSV to R2.
 * The function returns a handle with addFailure/addWarning and finalize().
 */
export function createImportReport(
  importId: string,
  dataType: 'quotes' | 'references' | 'authors' | 'tags' | 'users' | 'all' = 'quotes',
  format: 'ndjson' | 'csv' = 'ndjson',
) : ImportReportHandle {
  const failures: ImportFailureEntry[] = []
  const warnings: string[] = []

  return {
    addFailure(entry: ImportFailureEntry) {
      failures.push(entry)
    },
    addWarning(message: string) {
      warnings.push(message)
    },
    failureCount() { return failures.length },
    async finalize() {
      try {
        // Nothing to write
        if (failures.length === 0 && warnings.length === 0) return null

        // Build content
        let content = ''
        let filename = `import_${importId}_${dataType}_report.${format}`
        if (format === 'ndjson') {
          for (const f of failures) {
            content += JSON.stringify({ kind: 'failure', ...f }) + '\n'
          }
          for (const w of warnings) {
            content += JSON.stringify({ kind: 'warning', message: w }) + '\n'
          }
        } else {
          // csv
          const escape = (v: any) => {
            if (v == null) return ''
            const s = typeof v === 'string' ? v : JSON.stringify(v)
            if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'
            return s
          }
          const header = 'kind,index,reason,item\n'
          content += header
          for (const f of failures) {
            content += `failure,${f.index},${escape(f.reason)},${escape(f.item)}\n`
          }
          for (const w of warnings) {
            content += `warning,,${escape(w)},\n`
          }
        }

        // Upload into R2 with our existing backup utilities
        const up = await uploadBackupFile(content, filename, dataType, format)

        // Link into backup_files table and associate to import_logs row if present
        try {
          const row = await db.select({ id: schema.importLogs.id })
            .from(schema.importLogs)
            .where(eq(schema.importLogs.importId, importId))
            .limit(1)
            .get()
          const importLogId = row?.id

          const backupId = await createBackupFile({
            file_key: up.fileKey,
            export_log_id: undefined,
            import_log_id: importLogId,
            filename,
            file_path: up.filePath,
            file_size: up.fileSize,
            compressed_size: up.compressedSize,
            content_hash: up.contentHash,
            compression_type: up.compressionType,
            retention_days: 30,
            metadata: JSON.stringify({ kind: 'import-report', import_id: importId, data_type: dataType, format })
          })
          return { fileKey: up.fileKey, filePath: up.filePath, backupId }
        } catch {
          return { fileKey: up.fileKey, filePath: up.filePath }
        }
      } catch (e) {
        console.warn('Failed to persist import report:', e)
        return null
      }
    }
  }
}
