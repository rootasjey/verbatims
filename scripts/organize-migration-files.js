#!/usr/bin/env node

/**
 * Migration File Organization Script
 * Reorganizes existing migration files into the new modular structure
 * with proper naming conventions and directory organization.
 */

import { existsSync, mkdirSync, renameSync, copyFileSync, unlinkSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'

class FileOrganizer {
  constructor() {
    this.baseBackupDir = join(process.cwd(), 'server/database/backups')
    this.projectRoot = process.cwd()
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    this.movedFiles = []
    this.errors = []
  }

  async organize() {
    console.log('🗂️  Starting migration file organization...\n')
    
    try {
      // Create migration-specific directories
      this.createDirectories()
      
      // Move legacy files to new structure
      this.moveLegacyFiles()
      
      // Update file references in scripts
      this.updateScriptReferences()
      
      // Generate organization report
      this.generateReport()
      
      console.log('\n✅ File organization completed successfully!')
      
    } catch (error) {
      console.error('\n❌ File organization failed:', error.message)
      this.rollback()
      process.exit(1)
    }
  }

  createDirectories() {
    console.log('📁 Creating migration directories...')
    
    const directories = [
      join(this.baseBackupDir, 'references'),
      join(this.baseBackupDir, 'authors'),
      join(this.baseBackupDir, 'quotes'),
      join(this.baseBackupDir, 'references', 'archives'),
      join(this.baseBackupDir, 'authors', 'archives'),
      join(this.baseBackupDir, 'quotes', 'archives')
    ]
    
    directories.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
        console.log(`   ✅ Created: ${this.getRelativePath(dir)}`)
      } else {
        console.log(`   ℹ️  Exists: ${this.getRelativePath(dir)}`)
      }
    })
  }

  moveLegacyFiles() {
    console.log('\n📦 Moving legacy files to new structure...')
    
    const legacyMappings = [
      // Move test-results.json from project root to references directory
      {
        old: join(this.projectRoot, 'test-results.json'),
        new: join(this.baseBackupDir, 'references', `references-test-results-${this.timestamp}.json`),
        type: 'references'
      },
      
      // Move validation-report.md to references directory with new naming
      {
        old: join(this.baseBackupDir, 'validation-report.md'),
        new: join(this.baseBackupDir, 'references', `references-validation-report-${this.timestamp}.md`),
        type: 'references'
      },
      
      // Move transformed data files to references directory
      {
        old: join(this.baseBackupDir, 'transformed-references.json'),
        new: join(this.baseBackupDir, 'references', `transformed-references-${this.timestamp}.json`),
        type: 'references'
      },
      {
        old: join(this.baseBackupDir, 'transformed-references.csv'),
        new: join(this.baseBackupDir, 'references', `transformed-references-${this.timestamp}.csv`),
        type: 'references'
      },
      {
        old: join(this.baseBackupDir, 'transformed-references.sql'),
        new: join(this.baseBackupDir, 'references', `transformed-references-${this.timestamp}.sql`),
        type: 'references'
      }
    ]
    
    legacyMappings.forEach(mapping => {
      if (existsSync(mapping.old)) {
        try {
          // Create backup of original file
          const backupPath = `${mapping.old}.backup-${this.timestamp}`
          copyFileSync(mapping.old, backupPath)
          
          // Move to new location
          renameSync(mapping.old, mapping.new)
          
          this.movedFiles.push({
            from: this.getRelativePath(mapping.old),
            to: this.getRelativePath(mapping.new),
            backup: this.getRelativePath(backupPath),
            type: mapping.type
          })
          
          console.log(`   ✅ Moved: ${this.getRelativePath(mapping.old)} → ${this.getRelativePath(mapping.new)}`)
          
        } catch (error) {
          this.errors.push(`Failed to move ${mapping.old}: ${error.message}`)
          console.log(`   ❌ Failed: ${this.getRelativePath(mapping.old)} - ${error.message}`)
        }
      } else {
        console.log(`   ℹ️  Not found: ${this.getRelativePath(mapping.old)}`)
      }
    })
  }

  updateScriptReferences() {
    console.log('\n🔧 Updating script file references...')
    
    const scriptsToUpdate = [
      {
        file: 'scripts/validate-transformed-data.js',
        updates: [
          {
            old: "join(process.cwd(), 'server/database/backups/validation-report.md')",
            new: "join(process.cwd(), 'server/database/backups/references/references-validation-report-' + new Date().toISOString().replace(/[:.]/g, '-') + '.md')"
          }
        ]
      },
      {
        file: 'scripts/test-import-system.js',
        updates: [
          {
            old: "join(process.cwd(), 'test-results.json')",
            new: "join(process.cwd(), 'server/database/backups/references/references-test-results-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json')"
          }
        ]
      }
    ]
    
    scriptsToUpdate.forEach(script => {
      const scriptPath = join(this.projectRoot, script.file)
      
      if (existsSync(scriptPath)) {
        try {
          let content = readFileSync(scriptPath, 'utf-8')
          let updated = false
          
          script.updates.forEach(update => {
            if (content.includes(update.old)) {
              content = content.replace(update.old, update.new)
              updated = true
            }
          })
          
          if (updated) {
            // Create backup
            const backupPath = `${scriptPath}.backup-${this.timestamp}`
            copyFileSync(scriptPath, backupPath)
            
            // Write updated content
            writeFileSync(scriptPath, content)
            
            console.log(`   ✅ Updated: ${script.file}`)
          } else {
            console.log(`   ℹ️  No changes needed: ${script.file}`)
          }
          
        } catch (error) {
          this.errors.push(`Failed to update ${script.file}: ${error.message}`)
          console.log(`   ❌ Failed: ${script.file} - ${error.message}`)
        }
      } else {
        console.log(`   ⚠️  Not found: ${script.file}`)
      }
    })
  }

  generateReport() {
    console.log('\n📋 Generating organization report...')
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFilesMoved: this.movedFiles.length,
        errors: this.errors.length,
        directoriesCreated: 6
      },
      movedFiles: this.movedFiles,
      errors: this.errors,
      newStructure: {
        'server/database/backups/references/': 'References migration files',
        'server/database/backups/authors/': 'Authors migration files (future)',
        'server/database/backups/quotes/': 'Quotes migration files (future)',
        'server/database/backups/*/archives/': 'Archived old files'
      }
    }
    
    const reportPath = join(this.baseBackupDir, `file-organization-report-${this.timestamp}.json`)
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`   📄 Report saved: ${this.getRelativePath(reportPath)}`)
    
    // Also create a markdown summary
    const markdownReport = this.generateMarkdownReport(report)
    const markdownPath = join(this.baseBackupDir, `file-organization-report-${this.timestamp}.md`)
    writeFileSync(markdownPath, markdownReport)
    
    console.log(`   📝 Summary saved: ${this.getRelativePath(markdownPath)}`)
  }

  generateMarkdownReport(report) {
    let md = `# Migration File Organization Report\n\n`
    md += `**Generated:** ${report.timestamp}\n\n`
    
    md += `## Summary\n\n`
    md += `- **Files Moved:** ${report.summary.totalFilesMoved}\n`
    md += `- **Directories Created:** ${report.summary.directoriesCreated}\n`
    md += `- **Errors:** ${report.summary.errors}\n\n`
    
    if (report.movedFiles.length > 0) {
      md += `## Files Moved\n\n`
      report.movedFiles.forEach(file => {
        md += `- **${file.type}:** \`${file.from}\` → \`${file.to}\`\n`
        md += `  - Backup: \`${file.backup}\`\n`
      })
      md += `\n`
    }
    
    md += `## New Directory Structure\n\n`
    Object.entries(report.newStructure).forEach(([path, description]) => {
      md += `- **\`${path}\`** - ${description}\n`
    })
    
    if (report.errors.length > 0) {
      md += `\n## Errors\n\n`
      report.errors.forEach((error, index) => {
        md += `${index + 1}. ${error}\n`
      })
    }
    
    md += `\n## Next Steps\n\n`
    md += `1. Verify that all moved files are in their correct locations\n`
    md += `2. Test the migration scripts to ensure they work with the new file paths\n`
    md += `3. Update any remaining hardcoded file paths in the codebase\n`
    md += `4. Remove backup files once everything is verified to work correctly\n`
    
    return md
  }

  rollback() {
    console.log('\n🔄 Rolling back changes...')
    
    this.movedFiles.forEach(file => {
      try {
        if (existsSync(file.backup)) {
          renameSync(file.backup, join(this.projectRoot, file.from))
          console.log(`   ✅ Restored: ${file.from}`)
        }
      } catch (error) {
        console.log(`   ❌ Failed to restore: ${file.from} - ${error.message}`)
      }
    })
  }

  getRelativePath(absolutePath) {
    return absolutePath.replace(this.projectRoot + '/', '')
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const organizer = new FileOrganizer()
  organizer.organize()
}

export { FileOrganizer }
