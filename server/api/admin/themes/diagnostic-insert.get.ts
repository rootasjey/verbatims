import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const slug = 'diagnostic-test-' + Date.now()

    // Test 0: Basic connectivity
    let pingOk = false
    let pingError: any = null
    try {
      await db.run(sql`SELECT 1`)
      pingOk = true
    } catch (e) {
      pingError = (e as Error).message
    }

    let tableOk = false
    let tableError: any = null
    try {
      const r = await db.select().from(schema.themes).limit(1).all()
      tableOk = true
    } catch (e) {
      tableError = (e as Error).message
    }

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

    // Test 4: sql.raw() with inline escaped values (current fix)
    let rawSqlRawError: any = null
    try {
      await db.run(sql.raw(
        `INSERT INTO themes (slug, name, priority) VALUES ('rawraw-${slug}', 'RawRaw Test', 0)`
      ))
    } catch (e) {
      const err = e as any
      const allProps: Record<string, any> = {}
      try { for (const k of Object.getOwnPropertyNames(err)) allProps[k] = typeof err[k] === 'string' ? err[k] : '<<non-string>>' } catch {}
      allProps._stack = (err.stack || '').split('\n').slice(0, 8).join('\n')
      rawSqlRawError = allProps
    }

    if (!rawSqlRawError) {
      await db.run(sql`DELETE FROM themes WHERE slug = ${'rawraw-' + slug}`)
    }

    // Test 5: sql.raw() with all columns including nullable ones using 'NULL' string
    let rawSqlNullError: any = null
    try {
      await db.run(sql.raw(
        `INSERT INTO themes (slug, name, description, language, config, is_active, is_default, scheduled_start, scheduled_end, priority) VALUES ('nullraw-${slug}', 'NullRaw Test', 'Testing sql.raw() NULL strings', 'en', '{}', ${0}, ${0}, NULL, NULL, ${0})`
      ))
    } catch (e) {
      rawSqlNullError = { message: (e as Error).message, name: (e as Error).name }
    }

    if (!rawSqlNullError) {
      await db.run(sql`DELETE FROM themes WHERE slug = ${'nullraw-' + slug}`)
    }

    return {
      success: true,
      data: {
        ping: { ok: pingOk, error: pingError },
        table_read: { ok: tableOk, error: tableError },
        drizzle_error: drizzleError,
        raw_sql_error: rawSqlError,
        null_binding_error: nullBindingError,
        raw_sql_raw_error: rawSqlRawError,
        raw_sql_null_error: rawSqlNullError,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: { message: error?.message, name: error?.name, stack: error?.stack?.split('\n').slice(0, 5).join('\n') },
    }
  }
})
