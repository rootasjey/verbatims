---
target: /quotes
total_score: 23
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 1
timestamp: 2026-09-21T02-51-00Z
slug: app-pages-quotes-index-vue
---
⚠️ DEGRADED: single-context (l’agent d’évaluation A a bloqué ; son remplacement inline a commencé après l’arrivée du résultat B, donc l’indépendance stricte n’a pas été maintenue ; capture de p1 indisponible)

## Audit de /quotes

### Score de santé du design

| # | Heuristique | Score /4 | Constat principal |
|---|---|---:|---|
| 1 | Visibilité de l’état du système | 2 | Indicateur de chargement, mais pas de total de résultats ni de progression claire du flux. |
| 2 | Correspondance avec le monde réel | 3 | Les citations et leurs sources sont présentées dans un ordre de lecture naturel. |
| 3 | Contrôle et liberté | 2 | Bons contrôles sur desktop, aucun contrôle de recherche/tri local sur mobile. |
| 4 | Cohérence et standards | 2 | Les deux variantes ont des contrôles et des textes différents ; certaines chaînes mobiles restent codées en dur. |
| 5 | Prévention des erreurs | 3 | Les contrôles sont simples et le champ de recherche peut être effacé. |
| 6 | Reconnaissance plutôt que mémorisation | 2 | Les boutons à icône seule n’ont pas de nom accessible explicite. |
| 7 | Flexibilité et efficacité | 2 | Le tri et la recherche desktop sont utiles, mais absents de la page mobile. |
| 8 | Esthétique et minimalisme | 3 | Composition sobre, typographique et éditoriale ; la longue liste gagnerait à mieux indiquer son étendue. |
| 9 | Gestion des erreurs | 2 | Une vue vide existe, mais ses libellés sont cassés en anglais. |
| 10 | Aide et documentation | 2 | Page assez simple, sans aide contextuelle pour les contrôles moins évidents. |
| **Total** |  | **23/40** | **Acceptable — 57,5 %** |

### Verdict de spécificité

La page possède une vraie direction éditoriale : les citations dominent, et leur attribution garde auteur et référence à portée de lecture. Elle évite le tableau de bord générique. En revanche, la bande de thèmes et les contrôles forment une structure assez standard, et l’expérience mobile ressemble davantage à une liste « récente » qu’à un véritable outil d’exploration.

### Impression générale

La lecture est agréable et le contenu est bien mis en valeur. Le plus gros écart est fonctionnel : l’anglais expose des clés de traduction brutes, tandis que la version mobile retire les outils qui rendent le flux explorable.

### Ce qui fonctionne bien

- La hiérarchie titre / sous-titre / citation est claire et cohérente avec le style éditorial du site.
- Sur desktop, une citation conserve son contexte d’attribution sans détourner l’attention du texte.
- La liste mobile reste lisible et simple à parcourir, sans essayer de reproduire tous les contrôles desktop.

### Problèmes prioritaires

1. **[P1] Clés de traduction visibles et chaînes mobile non localisées.** En anglais, le champ affiche `desktop_quotes_grid.search_placeholder` et la vue vide expose aussi des clés techniques ; sur mobile, « Recent Quotes », « See All » et les textes de chargement sont codés en dur en anglais. Ajouter les traductions anglaises manquantes et passer ces chaînes mobiles par i18n. Le rendu desktop est visible dans DesktopQuotesGrid.vue:14 ; les chaînes mobiles sont dans MobileRecentQuotes.vue:9. Commande suggérée : `$impeccable harden`.

2. **[P2] Recherche et tri locaux absents sur mobile.** La page mobile présente le flux et les thèmes, mais aucun champ de recherche ni tri sur place. Pour retrouver une citation dans ce flux, l’utilisateur doit sortir de cette expérience. Ajouter au minimum une recherche compacte et un panneau de tri mobile. Commande suggérée : `$impeccable adapt`.

3. **[P2] « See All » renvoie à la page actuelle.** Sur /quotes, le bouton appelle `navigateTo('/quotes')` : c’est un lien sans effet, et l’en-tête « Recent Quotes » est redondant dans une page dédiée aux citations. Supprimer ce bouton ou remplacer sa fonction par une information utile, comme le nombre de résultats. Voir MobileRecentQuotes.vue:12. Commande suggérée : `$impeccable clarify`.

4. **[P2] Noms accessibles peu explicites pour les boutons à icône seule.** L’arbre d’accessibilité expose des noms tels que `i-ph-sort-descending` pour le tri ; le menu d’actions des citations suit le même motif. Fournir des `aria-label` localisés et, si utile, un tooltip. Voir DesktopQuotesGrid.vue:37 et QuoteTextEntry.vue:36. Commande suggérée : `$impeccable harden`.

### Signaux d’alerte par persona

- **Alex, utilisateur avancé :** sur mobile, il ne peut ni chercher dans le flux ni changer son ordre depuis cette page.
- **Sam, utilisateur de lecteur d’écran :** les boutons de tri et de menu d’action annoncent des classes d’icône plutôt que des actions parlantes.
- **Casey, utilisateur mobile pressé :** la liste est facile à lire, mais les nombreux thèmes défilants n’indiquent pas très clairement qu’il y en a d’autres, et « See All » ne mène nulle part.
- **Curateur occasionnel de citations :** l’attribution est utile lorsqu’elle est présente, mais les clés brutes et l’absence de recherche mobile nuisent à la découverte.

### Charge cognitive

**Faible, avec un point de friction.** Le flux lui-même est simple à lire ; toutefois, la rangée de thèmes offre de nombreux choix à la fois et son défilement horizontal est peu signalé. Une meilleure indication de débordement ou un regroupement des thèmes aiderait.

### Observations secondaires

- Le flux desktop n’affiche pas combien de citations sont chargées ; un petit « N citations affichées » rendrait l’effet des filtres et du chargement plus clair.
- Le débordement horizontal des thèmes est discret, surtout sur mobile.
- Les grands espacements entre les citations donnent du souffle, mais rendent le parcours d’un flux long plus lent.

### Questions à considérer

- La page mobile doit-elle devenir un vrai flux explorable — recherche et tri compris — ou rester une liste simplifiée ?
- Les thèmes sont-ils principalement des filtres ou une navigation de découverte ? Le traitement actuel ne tranche pas clairement.

### Parcours émotionnel

Curiosité devant une page accueillante → lecture fluide des citations → friction lorsque l’on veut chercher, trier ou utiliser la page en français/anglais selon le contexte.
