# Les pièges de Drizzle ORM sur Cloudflare D1

Drizzle ORM est un choix naturel pour D1, mais le comportement diffère
parfois entre le développement local (libsql) et la production (D1).
Voici les pièges qu'on a rencontrés.

## 1. `returning()` inclut `id` avec `NULL`

```ts
// ❌ Échoue sur D1, marche en dev
db.insert(table).values({ name: "test" }).returning()

// SQL généré :
// INSERT INTO t (id, name, ...) VALUES (NULL, ?, ...) -- D1 rejette NULL pour id
```

**Pourquoi ?** Drizzle liste toutes les colonnes de la table dans l'INSERT
y compris l'autoincrement `id` avec `NULL`. libsql le tolère, D1 non.

**Solution :**
```ts
// ✅ Préciser les colonnes à retourner
db.insert(table).values({ name: "test" }).returning({ id: schema.table.id }).get()

// ✅ Ou utiliser db.run(sql`INSERT INTO t (name) VALUES (${name})`)
```

## 2. `count()` sans argument

```ts
// Peut échouer sur D1 selon le contexte
db.select({ total: count() })
```

`count()` sans argument génère `COUNT(*)`. Dans certains contextes (après
des LEFT JOIN complexes notamment), D1 peut refuser la requête.

**Solution :** utiliser `count(colonne_explicite)` ou `.all()` + `.length`.

## 3. LIKE patterns trop longs

```sql
-- ❌ LIKE or GLOB pattern too complex (code 7500)
WHERE name LIKE '%Déclaration des droits de l\'homme et du citoyen (1789)%'
```

D1 rejette les patterns LIKE de plus de ~40 caractères avec `%` aux deux
extrémités.

**Solution :** utiliser `=` pour les correspondances exactes, ou `INSTR()`
si une recherche partielle est vraiment nécessaire.

## 4. WHERE id IN (...) avec trop de valeurs

Avec des JOINs complexes (4+ tables) et un `IN` de 100+ IDs, D1 peut
rejeter la requête.

**Solution :** découper en batches de 50 IDs, exécuter en parallèle
avec `Promise.all`, fusionner les résultats.

## 5. Différence entre dev et prod

| Aspect | Dev (libsql) | Prod (D1) |
|--------|-------------|-----------|
| `INSERT ... VALUES (NULL)` pour `id` | Accepté | Refusé |
| `LIKE '%long pattern%'` | Accepté | Refusé >40 chars |
| `COUNT(*)` dans sous-requêtes | OK | Parfois refusé |
| Messages d'erreur | Clairs | "Failed query:" générique |

## Conclusion

Toujours tester les requêtes sur D1 via wrangler AVANT de déployer.
`npx wrangler d1 execute <db> --remote --command "SELECT ..."` donne
les vrais codes d'erreur (ex: 7500 pour LIKE). Ce qui marche en dev
peut échouer en prod sans raison apparente — la cause est presque
toujours une différence de driver entre libsql et D1.
