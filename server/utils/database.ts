import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Initialize the database with the schema
 */
export async function initializeDatabase() {
  try {
    const db = hubDatabase()
    
    // Read the schema file
    const schemaPath = join(process.cwd(), 'database/migrations/schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    // Execute each statement
    for (const statement of statements) {
      await db.exec(statement)
    }
    
    console.log('Database initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize database:', error)
    return false
  }
}

/**
 * Seed the database with initial data
 */
export async function seedDatabase() {
  try {
    const db = hubDatabase()
    
    // Check if we already have data
    const existingQuotes = await db.prepare('SELECT COUNT(*) as count FROM quotes').first()
    if (existingQuotes?.count > 0) {
      console.log('Database already seeded')
      return true
    }
    
    // Create sample authors
    const authors = [
      {
        name: 'Albert Einstein',
        is_fictional: false,
        birth_date: '1879-03-14',
        death_date: '1955-04-18',
        job: 'Theoretical Physicist',
        description: 'German-born theoretical physicist who developed the theory of relativity.'
      },
      {
        name: 'Maya Angelou',
        is_fictional: false,
        birth_date: '1928-04-04',
        death_date: '2014-05-28',
        job: 'Poet, Author',
        description: 'American poet, memoirist, and civil rights activist.'
      },
      {
        name: 'Yoda',
        is_fictional: true,
        job: 'Jedi Master',
        description: 'Legendary Jedi Master from the Star Wars universe.'
      }
    ]
    
    const authorIds: number[] = []
    for (const author of authors) {
      const result = await db.prepare(`
        INSERT INTO authors (name, is_fictional, birth_date, death_date, job, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        author.name,
        author.is_fictional,
        author.birth_date || null,
        author.death_date || null,
        author.job,
        author.description
      ).run()
      
      authorIds.push(result.meta.last_row_id as number)
    }
    
    // Create sample references
    const references = [
      {
        name: 'Star Wars: The Empire Strikes Back',
        primary_type: 'film',
        secondary_type: 'science fiction',
        release_date: '1980-05-21',
        description: 'The second film in the original Star Wars trilogy.'
      },
      {
        name: 'I Know Why the Caged Bird Sings',
        primary_type: 'book',
        secondary_type: 'autobiography',
        release_date: '1969-01-01',
        description: 'Maya Angelou\'s autobiographical work about her early years.'
      }
    ]
    
    const referenceIds: number[] = []
    for (const reference of references) {
      const result = await db.prepare(`
        INSERT INTO references (name, primary_type, secondary_type, release_date, description)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        reference.name,
        reference.primary_type,
        reference.secondary_type,
        reference.release_date,
        reference.description
      ).run()
      
      referenceIds.push(result.meta.last_row_id as number)
    }
    
    // Create admin user
    const adminResult = await db.prepare(`
      INSERT INTO users (email, name, role, is_active, email_verified)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'admin@verbatims.com',
      'Admin User',
      'admin',
      true,
      true
    ).run()
    
    const adminId = adminResult.meta.last_row_id as number
    
    // Create sample tags
    const tags = [
      { name: 'wisdom', color: '#3B82F6' },
      { name: 'inspiration', color: '#10B981' },
      { name: 'science', color: '#8B5CF6' },
      { name: 'life', color: '#F59E0B' },
      { name: 'force', color: '#EF4444' }
    ]
    
    const tagIds: number[] = []
    for (const tag of tags) {
      const result = await db.prepare(`
        INSERT INTO tags (name, color) VALUES (?, ?)
      `).bind(tag.name, tag.color).run()
      
      tagIds.push(result.meta.last_row_id as number)
    }
    
    // Create sample quotes
    const quotes = [
      {
        name: 'Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world, stimulating progress, giving birth to evolution.',
        author_id: authorIds[0], // Einstein
        user_id: adminId,
        status: 'approved',
        moderator_id: adminId,
        language: 'en',
        tags: [tagIds[0], tagIds[2]] // wisdom, science
      },
      {
        name: 'There is no greater agony than bearing an untold story inside you.',
        author_id: authorIds[1], // Maya Angelou
        reference_id: referenceIds[1], // I Know Why the Caged Bird Sings
        user_id: adminId,
        status: 'approved',
        moderator_id: adminId,
        language: 'en',
        tags: [tagIds[1], tagIds[3]] // inspiration, life
      },
      {
        name: 'Do or do not, there is no try.',
        author_id: authorIds[2], // Yoda
        reference_id: referenceIds[0], // Star Wars
        user_id: adminId,
        status: 'approved',
        moderator_id: adminId,
        language: 'en',
        tags: [tagIds[0], tagIds[4]] // wisdom, force
      }
    ]
    
    for (const quote of quotes) {
      const result = await db.prepare(`
        INSERT INTO quotes (name, author_id, reference_id, user_id, status, moderator_id, moderated_at, language)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `).bind(
        quote.name,
        quote.author_id,
        quote.reference_id || null,
        quote.user_id,
        quote.status,
        quote.moderator_id,
        quote.language
      ).run()
      
      const quoteId = result.meta.last_row_id as number
      
      // Add tags to quote
      for (const tagId of quote.tags) {
        await db.prepare(`
          INSERT INTO quote_tags (quote_id, tag_id) VALUES (?, ?)
        `).bind(quoteId, tagId).run()
      }
    }
    
    console.log('Database seeded successfully')
    return true
  } catch (error) {
    console.error('Failed to seed database:', error)
    return false
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const db = hubDatabase()
    
    const stats = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM quotes WHERE status = ?').bind('approved').first(),
      db.prepare('SELECT COUNT(*) as count FROM authors').first(),
      db.prepare('SELECT COUNT(*) as count FROM references').first(),
      db.prepare('SELECT COUNT(*) as count FROM users').first(),
      db.prepare('SELECT COUNT(*) as count FROM tags').first()
    ])
    
    return {
      quotes: stats[0]?.count || 0,
      authors: stats[1]?.count || 0,
      references: stats[2]?.count || 0,
      users: stats[3]?.count || 0,
      tags: stats[4]?.count || 0
    }
  } catch (error) {
    console.error('Failed to get database stats:', error)
    return null
  }
}
