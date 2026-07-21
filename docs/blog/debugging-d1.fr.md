# Stacktrace 001 : L'échec de la création de thèmes pour Verbatims sur D1 Cloudflare

> Ou comment 10 déploiements, 3 nuits blanches et une poignée de
> `ALTER TABLE` nous ont appris à déboguer Cloudflare D1.

C'était le [mardi 14 juillet 2026](https://verbatims.cc/?theme=le-serment-de-laube). On venait de créer un thème pour l'ocassion
sur Verbatims, une plateforme de citations. Rien de sorcier : une requête
`INSERT INTO themes`. En local, ça marchait. En production, 500 : 
"Failed query". Pas de code, pas de stack trace, pas de pourquoi.

On a passé la soirée à modifier le code, déployer, test, fail,
recommencer. Le genre de boucle qui rend fou. Le lendemain matin,
toujours rien (oui, j'ai peu dormi). Le message d'erreur avait changé deux fois, mais le
résultat était le même : un thème qu'on ne pouvait pas créer.

Voici ce qu'on a appris.

## "Failed query :" et autres silences

Le premier choc : D1 ne donne pas ses raisons. Là où PostgreSQL vous
balance un `column "language" of relation "themes" does not exist`
avec le numéro de ligne, D1 répond sobrement :

```
Failed query: insert into "themes" ("id", "slug", ...) values (null, ? ...)
params: ...
```

C'est tout. Pas de "NOT NULL constraint failed", pas de "column not found".
Le message d'erreur, c'est la requête elle-même. Vous devez deviner ce qui a planté
en regardant le SQL.

La première chose qu'on apprend : **un message d'erreur vague ne signifie
pas que la cause est vague**. C'est juste que D1 ne vous dit pas ce qui
ne va pas. Il faut devenir enquêteur.

## Leçon n°1 : Drizzle + returning() = guet-apens

On utilisait Drizzle ORM, comme dans toute l'app. La création d'un thème
ressemblait à ça :

```ts
await db.insert(themes).values({ slug, name, ... }).returning()
```

En local (libsql), ça marche parfaitement. En production (D1), ça plante.
Pourquoi ?

Drizzle génère ce SQL :

```sql
INSERT INTO themes (id, slug, name, ...) VALUES (NULL, ?, ?, ...)
```

Oui, `id` avec `NULL`. Drizzle liste toutes les colonnes de la table,
y compris l'autoincrement `id`, et lui donne `NULL`. libsql tolère ça.
D1 non.

Le fix a été long à trouver parce qu'on ne regardait pas au bon endroit.
On a modifié le handler une demi-douzaine de fois avant de comprendre
que le problème n'était pas dans notre code mais dans le SQL que Drizzle
génère.

La solution : ne pas utiliser `.returning()` sans préciser les colonnes,
et utiliser `db.run(sql\`INSERT ...\`)` pour les inserts sensibles.

## Leçon n°2 : La colonne fantôme

Deuxième plantage, deuxième mystère. Après avoir corrigé `returning()`,
la création de thème plantait encore. Le message : toujours "Failed query:".

Un test systématique avec 3 colonnes fonctionnait. Avec 4, ça plantait.
La colonne incriminée ? `language`.

On regarde le schéma Drizzle : il est là — `language: text('language')`.
On regarde `schema.sql` : il est là aussi. On regarde la migration qui
a créé la table en production : **il n'y était pas**.

La colonne `language` avait été ajoutée au `schema.sql` consolidé (utilisé
pour les nouvelles installations), mais aucune migration `ALTER TABLE`
numérotée ne l'avait ajoutée aux bases existantes. La table en production
n'avait tout simplement pas cette colonne.

```
schema.sql (consolidé)     : CREATE TABLE themes (..., language TEXT, ...)
0014_create_themes_table.sql : CREATE TABLE themes (...)  ← PAS de language
```

Deux semaines plus tard, dans une session de debugging, on a enfin
compris le pattern : **le fichier `schema.sql` n'est pas une source
fiable pour les migrations**. Il sert pour les déploiements frais.
Les bases existantes évoluent via les fichiers numérotés. Point.

Depuis, on compare systématiquement `schema.sql` avec la somme des
migrations appliquées. Si un champ est dans l'un mais pas dans l'autre,
c'est un ticket.

## Leçon n°3 : LIKE or GLOB pattern too complex

Celle-ci nous a coûté une soirée entière. Le feed d'un thème renvoyait
500. On avait 25 filtres et une requête qui collectait les IDs des
citations via des `LIKE`. La requête individuelle pour un filtre
ressemblait à ça :

```sql
SELECT quotes.id FROM quotes
INNER JOIN quote_references ON ...
WHERE name LIKE '%Déclaration des droits de l\'homme et du citoyen (1789)%'
```

Wrangler (le CLI de Cloudflare) nous a enfin donné la vraie erreur :

```
LIKE or GLOB pattern too complex: SQLITE_ERROR [code: 7500]
```

Le pattern, avec ses 54 caractères et ses accents, était trop complexe
pour D1. Solution : utiliser `=` au lieu de `LIKE` quand on connaît
la valeur exacte. Dans notre cas, le nom de la référence était connu,
donc pas besoin de recherche partielle.

## Leçon n°4 : Trop d'IDs dans le IN

Cette même requête de feed, après avoir corrigé le LIKE, plantait
encore. Le `WHERE id IN (1, 2, 3, ..., 100)` avec 100 IDs et des
LEFT JOINs était trop lourd pour D1.

Solution : collecter les IDs, les découper en paquets de 50, exécuter
les requêtes en parallèle, fusionner les résultats.

```ts
const batches = chunk(allIds, 50)
const results = await Promise.all(batches.map(runQuery))
const merged = results.flat().sort(shuffle).slice(0, 50)
```

Ça a l'air évident rétrospectivement, mais sur le moment, avec le
message "Failed query:" tronqué, on a passé du temps à se demander
si le problème était dans les JOINs, le GROUP BY, ou l'ORDER BY avant
de tester l'hypothèse du IN.

## La méthode qui nous a sauvés

Après des heures à tourner en rond, on a formalisé un processus :

1. **Tester avec wrangler** : `npx wrangler d1 execute <nom> --remote --command "SELECT 1"`
   donne le vrai message d'erreur avec le code SQLITE. Utiliser ça en
   premier, pas un déploiement.
2. **Isoler** : avec un `SELECT` ou `INSERT` minimal (3 colonnes). Si ça
   marche, ajouter les colonnes une par une.
3. **Colonne par colonne** : ça semble archaïque, mais c'est ce qui nous
   a fait trouver le `LIKE` et la colonne manquante.
4. **Ne pas masquer** : on a essayé de wrapper le feed dans un try-catch
   géant. Mauvaise idée : on ne voyait plus les erreurs. Il faut
   comprendre la cause, pas l'absorber.

## Ce qu'on aurait fait différemment

1. Utiliser wrangler AVANT de déployer. Ça semble évident mais sur le
   moment, on était focus sur "modifier le code → déployer → tester".
   wrangler nous aurait épargné 3 déploiements inutiles.
2. Comparer `schema.sql` avec les migrations dès le premier 500. La colonne manquante aurait été trouvée en 5 minutes.
3. Réduire le problème. Tester avec 1 filtre, puis 2, puis 5 au lieu
   de lancer la requête complète à 25 filtres.

Les erreurs D1 ne sont pas magiques. Elles sont juste silencieuses.
Avec une méthode, elles deviennent prévisibles.

Cette stacktrace rédactionnelle est là pour me souvenir des chemins alternatifs à explorer plus tôt en cas de problème sur D1 de Cloudflare.
