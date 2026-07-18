import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const slug = 'diagnostic-test-' + Date.now()

    // Test 1: Drizzle insert
    let drizzleError: any = null
    try {
      await db.insert(schema.themes).values({
        slug,
        name: 'Diagnostic Test',
        description: 'Testing D1 insert',
        language: 'en',
        config: '{}',
        isActive: false,
        isDefault: false,
        priority: 0,
      }).all()
    } catch (e) {
      drizzleError = { message: (e as Error).message, name: (e as Error).name, stack: (e as Error).stack?.split('\n').slice(0, 3).join('\n') }
    }

    // Cleanup if Drizzle insert succeeded
    if (!drizzleError) {
      await db.delete(schema.themes).where(eq(schema.themes.slug, slug))
    }

    // Test 2: Raw SQL with exact same pattern as POST handler
    let rawSqlError: any = null
    try {
      const scheduledVal = null
      await db.run(sql`
        INSERT INTO themes (slug, name, description, language, config, is_active, is_default, scheduled_start, scheduled_end, priority)
        VALUES (${'raw-' + slug}, ${'Raw SQL Test'}, ${'Testing raw SQL nulls'}, ${'en'}, ${'{}'}, ${0}, ${0}, ${scheduledVal ? new Date(scheduledVal).getTime() : sql`NULL`}, ${scheduledVal ? new Date(scheduledVal).getTime() : sql`NULL`}, ${0})
      `)
    } catch (e) {
      rawSqlError = { message: (e as Error).message, name: (e as Error).name }
    }

    // Cleanup if raw SQL succeeded
    if (!rawSqlError) {
      await db.run(sql`DELETE FROM themes WHERE slug = ${'raw-' + slug}`)
    }

    // Test 3: Raw SQL with null bindings (old pattern)
    let nullBindingError: any = null
    try {
      await db.run(sql`
        INSERT INTO themes (slug, name, description, language, config, is_active, is_default, scheduled_start, scheduled_end, priority)
        VALUES (${'null-' + slug}, ${'Null Binding Test'}, ${'Testing null bindings'}, ${'en'}, ${'{}'}, ${0}, ${0}, ${null}, ${null}, ${0})
      `)
    } catch (e) {
      nullBindingError = { message: (e as Error).message, name: (e as Error).name }
    }

    if (!nullBindingError) {
      await db.run(sql`DELETE FROM themes WHERE slug = ${'null-' + slug}`)
    }

    return {
      success: true,
      data: {
        drizzle_error: drizzleError,
        raw_sql_error: rawSqlError,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: { message: error?.message, name: error?.name, stack: error?.stack?.split('\n').slice(0, 5).join('\n') },
    }
  }
})
