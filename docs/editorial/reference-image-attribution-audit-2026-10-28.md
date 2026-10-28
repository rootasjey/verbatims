# Audit des crédits et licences des images de références — 2026-10-28

## Périmètre et source

- Copie locale synchronisée depuis la production, auditée en lecture seule : 422 références, dont 379 avec image. La référence #284 a déjà été fusionnée dans #39; l’inventaire éditorial du 26 octobre conserve l’ancien état à 423 entrées.
- Inventaire et justifications éditoriales : [`reference-enrichment-inventory-2026-10-26.json`](reference-enrichment-inventory-2026-10-26.json) et [`reference-enrichment-log.md`](reference-enrichment-log.md).
- Les statuts proposés ne modifient ni crédits, ni URL de source, ni texte de licence. Ils structurent l’état documenté actuellement.
- La CLI Wrangler ne pouvait pas s’authentifier le 28 octobre (jeton expiré), mais les lectures en lecture seule ont réussi dans la console D1 du tableau de bord Cloudflare.
- État production lu le 28 octobre : 422 références, 379 avec image, 110 avec au moins un champ d’attribution, 109 crédits, 107 URL de source et 108 textes de licence. Les signatures agrégées des attributions des 379 références avec image correspondent à la copie locale. La migration `0048` n’était pas encore appliquée en production au moment de la lecture.
- Les gardes du SQL ponctuel ont donc été générées à partir d’une copie recoupée avec ces agrégats de production. Elles vérifient chaque fiche et son nombre d’attributions; tout changement depuis la lecture fera ignorer l’UPDATE correspondant. Refaire le préflight après le déploiement de `0048` et avant toute exécution.

## Résultat du classement proposé

| Crédit | Fiches | Règle |
| --- | ---: | --- |
| `creator_known` | 29 | Créateur nommé explicitement dans les crédits vérifiés de l’inventaire. |
| `source_known` | 81 | Source/crédit présent, mais créateur non établi avec assez de certitude. |
| `unknown` | 269 | Aucun crédit ni URL de source enregistrés pour l’image. |

| Licence | Fiches | Règle |
| --- | ---: | --- |
| `documented` | 43 | Texte existant cite explicitement domaine public, CC, CC0, PDM ou autorisation de réutilisation. |
| `territory_limited` | 11 | Texte existant limite explicitement le constat territorialement ou mentionne des variations de territoire. |
| `undocumented` | 325 | Licence absente, non précisée, ou droits explicitement non vérifiés. |

Sur les 110 fiches avec au moins une valeur de crédit/source/licence, 58 ont une provenance d’image vérifiée ou corrigée dans l’inventaire et 52 ont une source/crédit indicatif mais des droits non établis. Ces 52 sont classées `source_known` / `undocumented`; le crédit textuel existant reste intact.

Les 269 fiches sans aucune métadonnée d’attribution sont `unknown` / `undocumented`. Aucune licence n’est inférée à partir d’une URL d’image, d’une page Wikipédia ou d’un hébergeur seul.

Les 29 fiches classées `creator_known` sont les références `16, 33, 209, 243, 257, 262, 295, 313, 330, 332, 350, 363, 366, 367, 369, 380, 407, 409, 410, 411, 413, 415, 416, 418, 420, 421, 422, 423, 427`. Les 81 autres fiches avec métadonnées d’attribution restent `source_known`, faute de créateur suffisamment établi.

## SQL one-shot préparé

Le script temporaire est [`verbatims-reference-attribution-status-oneshot.sql`](/private/tmp/verbatims-reference-attribution-status-oneshot.sql). Il ne fait pas partie des migrations. Il contient 379 mises à jour unitaires, toutes conditionnées par l’ID, l’URL d’image, les champs existants et le nombre d’attributions relevé dans la copie locale. Il ne touche pas aux fiches sans image.

Ordre prévu : déployer la migration de schéma `0048`, vérifier que les deux colonnes existent en production, contrôler les deux requêtes de préflight (379 images et zéro statut déjà renseigné), exécuter le fichier, puis vérifier le postflight (zéro statut manquant et totaux ci-dessus). Le script n’a pas été exécuté en production et aucune donnée de production n’a été modifiée pour cet audit.
