# Debugger Cloudflare D1 : le processus en 5 étapes

Quand une requête D1 échoue, le message d'erreur est souvent laconique :
`"Failed query:"` suivi de la requête SQL — sans code d'erreur, sans explication.
Voici le processus systématique qu'on a développé pour déboguer ces silences.

## Étape 1 : Confirmer la connectivité

Avant toute chose, vérifier que la base répond :

```sql
SELECT 1;
-- ou via Drizzle
await db.run(sql`SELECT 1`)
```

Si ça échoue, le problème est réseau/permissions, pas la requête.

## Étape 2 : Isoler avec un INSERT minimal

On écarte les colonnes une à une. Avec Drizzle, un INSERT basique inclut toutes
les colonnes — y compris `id` avec `NULL` — ce que D1 rejette :

```sql
-- Généré par Drizzle → échoue
INSERT INTO themes (id, slug, name, ...) VALUES (NULL, ?, ?, ...)

-- Solution : db.run(sql`INSERT INTO themes (slug, name) VALUES (${s}, ${n})`)
-- ou Drizzle : .returning({ id: schema.table.id }) au lieu de .returning()
```

**Enseignement** : Drizzle + `returning()` liste `id` dans l'INSERT avec `NULL`,
ce que D1 ne supporte pas.

## Étape 3 : Recherche binaire sur les colonnes

Si le minimal fonctionne mais que la requête complète échoue, on ajoute les
colonnes une par une avec `sql.raw()` :

```ts
// Test 1 : 3 colonnes ✓
await db.run(sql.raw(`INSERT INTO themes (slug, name, priority) VALUES (...)`))

// Test 2 : + language → ✗ colonne manquante en prod
await db.run(sql.raw(`INSERT INTO themes (slug, name, priority, language) VALUES (...)`))
```

**Cas réel** : la colonne `language` existait dans `schema.ts` (Drizzle) et
dans le `schema.sql` consolidé, mais aucune migration numérotée ne l'avait
ajoutée en production. `ALTER TABLE` a résolu le problème.

## Étape 4 : LIKE ou GLOB pattern too complex

```sql
-- Échoue si le pattern dépasse ~40 caractères
WHERE refs.name LIKE '%Déclaration des droits de l\'homme et du citoyen (1789)%'

-- Solution : utiliser = (égalité exacte) quand on connaît la valeur exacte
WHERE refs.name = 'Déclaration des droits de l\'homme et du citoyen (1789)'
```

D1 a une limite sur la complexité des patterns `LIKE` (code erreur 7500).
Les patterns longs avec `%` aux deux extrémités sont refusés.

## Étape 5 : IN clause overflow

```sql
-- 100 IDs dans IN → peut échouer selon la complexité des JOINs
WHERE id IN (1, 2, 3, ..., 100)

-- Solution : batcher par 50 IDs, exécuter en parallèle, fusionner
const chunkSize = 50
const batches = chunk(allIds, chunkSize)
const results = await Promise.all(batches.map(runQuery))
const merged = results.flat().sort(...).slice(0, 50)
```

## Le piège du schéma consolidé

Le fichier `schema.sql` est utilisé pour les déploiements frais, mais les bases
existantes sont modifiées via des migrations numérotées (`0001_*.sql`,
`0002_*.sql`, etc.). Si une colonne est ajoutée uniquement dans `schema.sql`
sans migration `ALTER TABLE` correspondante, la colonne n'existe pas en production.

**Vérification** : comparer `schema.sql` avec la somme de toutes les migrations
numérotées. Toute différence est un trou de migration.

## La méthode wrangler

Avant de déployer un correctif, tester la requête SQL directement via wrangler :

```bash
npx wrangler d1 execute verbatims --remote --command "SELECT ..."
```

Ça donne le vrai message d'erreur D1 (avec code) au lieu du générique
"Failed query:" du wrapper hub:db. Gain de temps considérable.

## Conclusion

Debugguer D1 demande une approche systématique parce que les messages d'erreur
ne sont pas toujours explicites. La méthode en 5 étapes — connectivité, insert
minimal, colonne par colonne, LIKE/IN, schéma — nous a sauvés à chaque fois.
