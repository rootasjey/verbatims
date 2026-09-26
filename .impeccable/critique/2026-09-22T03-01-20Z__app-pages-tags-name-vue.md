---
target: /tags/change tag detail page
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 1
timestamp: 2026-09-22T03-01-20Z
slug: app-pages-tags-name-vue
---
Method: dual-agent (A: 01a0c70b-b649-7222-9ac1-ebe30f7436c1 · B: 01a0c70b-c0a2-78c0-afee-c805a7419226)

## Revue de `/tags/change`

### Design Health Score

Échelle de 0 à 4 ; 4 signifie que le point est particulièrement bien traité.

| # | Heuristique | Score | Point principal |
|---|---|---:|---|
| 1 | Visibilité de l’état | 2/4 | Le compteur affiche brièvement `0 quotes` pendant le chargement, avant le vrai total. |
| 2 | Correspondance avec le monde réel | 3/4 | Le tag, sa catégorie et sa description donnent un bon contexte. |
| 3 | Contrôle et liberté | 3/4 | Tri, langue et chargement progressif sont présents. |
| 4 | Cohérence et standards | 3/4 | Les contrôles sont familiers, mais le tri diffère entre desktop et mobile. |
| 5 | Prévention des erreurs | 2/4 | Une erreur réseau peut être prise pour une catégorie réellement vide. |
| 6 | Reconnaissance plutôt que mémorisation | 2/4 | Le bouton d’ordre expose un nom accessible technique, issu de son icône. |
| 7 | Flexibilité et efficacité | 2/4 | Le changement de tri desktop semble déclencher deux chargements. |
| 8 | Esthétique et sobriété | 3/4 | La hiérarchie tag → description → citations est claire ; l’harmonie visuelle reste à confirmer sur capture. |
| 9 | Aide à la récupération d’erreur | 1/4 | Pas de message d’erreur ni de possibilité de réessayer après un échec réseau. |
| 10 | Aide et documentation | 3/4 | Peu d’aide dédiée est nécessaire pour cette page de découverte. |
| **Total** |  | **24/40** | **Acceptable — des améliorations ciblées sont indiquées.** |

### Spécificité du design

La page contient des informations propres à Verbatims — tag, couleur/catégorie et citations associées — mais son en-tête centré et son très grand titre en capitales paraissent moins éditoriaux que les pages `/authors`, `/references` et la grille `/tags`. Je le considère comme une piste de cohérence plutôt qu’un défaut établi : les captures d’écran Ego Browser ont échoué, donc je n’ai pas pu juger précisément les proportions et le rendu visuel.

Le détecteur Impeccable a relevé **un avertissement** `border-accent-on-rounded` sur le spinner de chargement dans `app/pages/tags/[name].vue:5`. C’est un faux positif probable : la règle a confondu la bordure du spinner arrondi avec celle d’une carte.

### Impression générale

La page remplit bien son rôle de point d’entrée vers les citations d’un thème. Les améliorations les plus utiles concernent la fiabilité des transitions et des états de chargement/erreur ; le principal travail visuel potentiel serait de rapprocher son en-tête du ton éditorial déjà établi ailleurs.

**Ce qui fonctionne**
- Le nom, la catégorie et la description identifient rapidement le tag.
- Les citations restent explorables avec langue, tri et chargement progressif.
- Le rendu mobile observé n’avait pas de débordement horizontal ; le panneau de tri s’ouvrait correctement.

### Points prioritaires

1. **[P1] La navigation d’un tag à un autre peut conserver le premier slug chargé.** L’URL de `useLazyFetch` est construite depuis `rawTagName.value` une seule fois, alors que le paramètre de route est surveillé séparément. Si Nuxt réutilise le composant pendant une navigation interne, le rafraîchissement pourrait rappeler l’ancienne URL. Rendre l’URL elle-même réactive, ou lancer explicitement la requête avec le nouveau paramètre. **Commande suggérée :** `$impeccable harden`.

2. **[P2] Une erreur de chargement ressemble à une liste vide.** L’échec de la requête est seulement écrit dans la console ; l’interface peut ensuite afficher « No approved quotes… ». Ajouter un état d’erreur distinct et une action de réessai. **Commande suggérée :** `$impeccable clarify`.

3. **[P2] Le compteur clignote à zéro pendant le chargement.** L’interface peut afficher `0 quotes` avant que les citations arrivent, ce qui laisse croire qu’il n’y a aucun résultat. Garder le dernier total, réserver la place au compteur ou afficher explicitement un état de chargement à cet endroit. **Commande suggérée :** `$impeccable polish`.

4. **[P2] Le contrôle d’ordre est peu accessible et le tri desktop semble lancer deux requêtes.** Son `aria-label` reprend l’identifiant d’icône (`i-ph-sort-descending`) ; par ailleurs, `@change` et le watcher de `sortBy` appellent tous deux `loadQuotes`. Donner un libellé décrivant l’action et n’avoir qu’un seul déclencheur de chargement. **Commande suggérée :** `$impeccable harden`.

### Personnes pour qui les irritants sont les plus concrets

- **Lecteur qui découvre les tags :** en naviguant entre deux tags, il risque de voir des citations qui ne correspondent plus au titre si le slug précédent est conservé.
- **Lecteur sur mobile :** le compteur provisoire à zéro peut ressembler à une absence de contenu ; il a toutefois pu ouvrir le panneau de tri.
- **Personne utilisant un lecteur d’écran :** le bouton d’ordre annonce un nom d’icône technique au lieu d’une action compréhensible.

### Notes secondaires

- Le navigateur a montré **22 citations associées** au tag et **17 citations dans la liste** lorsque le français était sélectionné. L’API du tag compte les citations approuvées toutes langues confondues ; la liste applique le filtre de langue. Les nombres sont donc compatibles, mais un libellé précisant « au total » et « dans cette langue » éviterait le doute.
- Le détecteur n’a rien trouvé d’autre que le faux positif du spinner.
- La revue du code et l’inspection sémantique en direct ont été faites sur desktop et mobile ; la capture pixel et l’overlay n’ont pas pu être obtenus. L’overlay n’a pas été injecté : la config live Impeccable était absente, et le serveur d’overlay a expiré au démarrage. Le serveur de développement `localhost:3002` n’a pas été arrêté ; mon onglet de revue et les altérations temporaires du titre ont été nettoyés.
