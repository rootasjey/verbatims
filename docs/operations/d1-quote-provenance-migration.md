# D1 : migration des colonnes de provenance des citations

Ce runbook documente la suppression des anciennes colonnes de provenance de `quotes` et la surveillance qui suit l’opération.

## Contexte

Les colonnes suivantes ont été remplacées par `quote_attributions` et `quote_sources` :

- `quotes.author_id`
- `quotes.reference_id`
- `quotes.source_type`
- `quotes.source_url`

La migration est implémentée dans `server/db/migrations/sqlite/0034_rebuild_quotes_without_legacy_provenance.sql`.

## Contraintes D1 importantes

Ne pas reconstruire uniquement `quotes` en présence de dépendances `ON DELETE CASCADE`. Sur D1, `PRAGMA foreign_keys = OFF` et `defer_foreign_keys` ne constituent pas une protection suffisante contre les cascades lors d’une suppression de table.

La reconstruction doit donc copier `quotes` et toutes ses tables dépendantes, puis recréer les FK, index, contraintes, triggers et FTS5.

## Préparation

1. Vérifier l’accès Wrangler et la base ciblée avec `wrangler d1 info`.
2. Créer une base D1 de maintenance distincte.
3. Exporter les tables nécessaires de production. Les exports globaux peuvent échouer lorsqu’une table virtuelle FTS5 est présente ; exporter alors les tables physiques séparément.
4. Capturer un bookmark Time Travel juste avant chaque opération destructive.
5. Ne jamais exécuter une migration de test directement sur `verbatims`.

## Préflight obligatoire

Avant exécution, vérifier :

- `PRAGMA foreign_key_check` sans résultat ;
- aucune citation sans attribution ;
- exactement une attribution primaire par citation ;
- aucune attribution sans auteur ni référence ;
- chaque source rattachée à la bonne citation et attribution ;
- comptages, plages d’IDs et index documentés.

## Exécution

Tester d’abord sur la copie isolée :

```bash
bunx wrangler d1 execute verbatims-maintenance \
  --remote \
  --file=server/db/migrations/sqlite/0034_rebuild_quotes_without_legacy_provenance.sql
```

Après réussite sur la copie, capturer un bookmark de production immédiatement avant l’exécution, puis lancer la même commande sur `verbatims` dans une fenêtre de maintenance.

La migration doit être suivie d’un enregistrement dans `d1_migrations` si elle a été exécutée manuellement avec `d1 execute`, afin d’éviter une réexécution ultérieure par Wrangler.

## Audit post-migration

Répéter exactement les contrôles préflight et vérifier en plus :

- absence des quatre anciennes colonnes dans `PRAGMA table_info(quotes)` ;
- comptages et IDs inchangés ;
- index uniques partiels présents ;
- triggers FTS et triggers métier présents ;
- `count(quotes_fts) = count(quotes)` ;
- recherches FTS fonctionnelles ;
- `PRAGMA foreign_key_check` sans résultat.

## Tests fonctionnels

Sur la copie, utiliser des données temporaires pour vérifier :

- recherche FTS ;
- création, mise à jour et suppression d’une citation ;
- incrémentation/décrémentation des vues et likes ;
- rejet d’une attribution sans auteur/référence ;
- rejet d’une source rattachée à une mauvaise attribution ;
- cascades vers tags, vues, signalements, collections et file sociale.

## Restauration

Time Travel permet de restaurer la base à un bookmark récent :

```bash
bunx wrangler d1 time-travel restore verbatims --bookmark=<BOOKMARK_AVANT_MIGRATION>
```

La restauration écrase la base en place et annule les requêtes en cours. Conserver le bookmark retourné comme point permettant d’annuler la restauration si nécessaire. Les bookmarks sont temporaires ; pour une conservation longue, réaliser également un export indépendant lorsque cela est possible.

## Surveillance après déploiement

Pendant plusieurs jours après la migration :

1. surveiller les erreurs Worker/Nuxt et les logs de production ;
2. surveiller les endpoints de recherche et les erreurs FTS ;
3. vérifier périodiquement les pages `/`, `/quotes`, `/authors` et `/references` ;
4. surveiller les opérations de création/édition/modération de citations ;
5. surveiller les compteurs de vues et likes ;
6. surveiller les erreurs liées aux collections, tags, signalements et autopost ;
7. conserver la copie D1 de maintenance jusqu’à la fin de la période de surveillance.

En cas d’anomalie de données ou d’erreur systémique, suspendre les écritures si nécessaire, capturer l’état courant, puis restaurer au bookmark pré-migration.

## Clôture

Après la période de surveillance :

- confirmer que les recherches et parcours applicatifs sont stables ;
- vérifier que `0034` est bien suivie dans `d1_migrations` ;
- conserver le commit et le tag de version associés ;
- supprimer la copie D1 de maintenance et les artefacts temporaires uniquement après validation de l’équipe.
