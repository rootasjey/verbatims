---
target: la page /tags/[name]
total_score: 30
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 0
timestamp: 2026-09-22T07-19-56Z
slug: app-pages-tags-name-vue
---
# Revue de design — `/tags/[name]`

⚠️ DEGRADED: single-context (le second sous-agent n’a pas pu démarrer : `agent thread limit reached`). L’évaluation visuelle a été réalisée par l’agent Curie; l’évaluation du détecteur et les vérifications navigateur ont été faites séquentiellement dans le contexte principal.

## Design Health Score

| # | Heuristique | Score | Point à noter |
|---|---|---:|---|
| 1 | Visibilité de l’état | 3/4 | Compteur, chargement, erreurs et réessai sont prévus ; l’annonce du chargement initial peut être renforcée. |
| 2 | Correspondance avec le monde réel | 3/4 | Tag et description sont clairs ; la catégorie « growth » reste en anglais sur la page française. |
| 3 | Contrôle et liberté | 3/4 | Retour, langue et tri sont accessibles, y compris dans la sticky bar mobile. |
| 4 | Cohérence et conventions | 3/4 | La structure s’accorde avec les pages éditoriales d’auteurs et de références. |
| 5 | Prévention des erreurs | 3/4 | Les filtres sont explicites et l’état est synchronisé avec l’URL. |
| 6 | Reconnaissance plutôt que mémorisation | 3/4 | Le contexte du tag réapparaît dans la sticky bar pendant la lecture. |
| 7 | Flexibilité et efficacité | 3/4 | Langue, tri, ordre et chargement progressif couvrent les principaux besoins. |
| 8 | Esthétique et sobriété | 3/4 | La direction paraît juste ; les détails pixel-perfect n’ont pas pu être confirmés en capture. |
| 9 | Récupération après erreur | 3/4 | Des actions de réessai existent pour les erreurs de chargement. |
| 10 | Aide et documentation | 3/4 | Les commandes sont nommées et compréhensibles ; une aide dédiée ne semble pas nécessaire. |
| **Total** | | **30/40 — Good** | Socle solide, finitions de contenu et d’accessibilité restantes. |

## Design Specificity Verdict

La page est bien ancrée dans l’identité éditoriale de Verbatims : grand titre serif, repère chromatique discret propre au tag, description et citations en premier plan. Elle ne ressemble plus à une grille générique de contenus. Je ne recommande pas une autre refonte visuelle.

Le scan automatique du composant n’a retourné aucune règle ni faux positif (`[]`). La mutation préliminaire de la page a réussi, mais le serveur d’overlay a expiré au démarrage ; aucun overlay n’a été injecté ni rendu visible.

## Overall Impression

La page est équilibrée et cohérente avec les pages d’auteurs et de références. La meilleure prochaine passe est éditoriale et accessibilité, pas une modification de structure des cartes.

## What’s Working

- Le titre serif donne à chaque tag une vraie identité, tandis que le point coloré reste un accent discret.
- L’attribution et les liens vers l’auteur ou la référence enrichissent les citations sans transformer la page en tableau de bord.
- À 390 × 844 avec défilement, la sticky bar expose « Back », « Change », le compteur, la langue et le tri.

## Priority Issues

- **[P2] Harmoniser la langue de la catégorie.** Sur `/tags/change?lang=fr`, la description et le compteur sont en français, mais la catégorie affichée est `growth`. Si la catégorie est destinée à être lue comme un libellé, traduire la taxonomie ; si c’est volontairement un vocabulaire canonique, l’afficher de manière cohérente dans toutes les langues. **Pourquoi :** l’alternance de langue affaiblit la finition éditoriale. **Commande suggérée :** `$impeccable clarify`.
- **[P2] Rendre la vue vide fidèle au filtre actif.** Le texte actuel affirme qu’aucune citation n’est associée au tag. Si la langue sélectionnée n’a simplement aucun résultat, cela peut faire croire qu’il n’existe aucune citation du tout. Reformuler en « aucune citation dans cette langue » et, si utile, proposer de voir toutes les langues. Voir `app/pages/tags/[name].vue`, lignes 209–213. **Pourquoi :** le message doit distinguer un résultat filtré vide de l’absence globale de contenu. **Commande suggérée :** `$impeccable clarify`.
- **[P3] Annoncer explicitement le chargement initial aux lecteurs d’écran.** Le spinner et son texte sont visibles, et le compteur dispose d’une région `aria-live`; ajouter `role="status"` au bloc de chargement initial rendrait la transition plus explicite. Voir `app/pages/tags/[name].vue`, lignes 3–5. **Pourquoi :** l’état de chargement ne devrait pas dépendre uniquement de la perception visuelle. **Commande suggérée :** `$impeccable audit`.

## Cognitive Load

Charge faible, 0 échec sur les 8 points : une tâche principale (explorer les citations du tag), informations regroupées, hiérarchie claire, contrôles liés rassemblés, décisions séquentielles, moins de quatre options simultanées, peu de mémorisation inter-écran et complexité secondaire dévoilée dans la sticky bar.

## Emotional Journey

Le visiteur arrive sur une « étagère » thématique clairement nommée, peut choisir un angle (langue/tri), puis lire. Les erreurs disposent d’un chemin de réessai. La cohérence de langue et l’exactitude de la vue vide sont les deux détails qui risquent le plus de briser ce sentiment de curation.

## Persona Red Flags

- **Sam, utilisateur de lecteur d’écran :** le bloc de chargement initial pourrait annoncer son état plus explicitement ; le compteur live aide ensuite.
- **Casey, lecteur sur téléphone :** le snapshot à 390 × 844 montre les contrôles et le contexte dans la sticky bar. Sa place verticale exacte n’a pas pu être jugée, faute de capture pixel.
- **Lecteur-curateur occasionnel (contexte Verbatims) :** une catégorie anglaise dans une page française peut sembler accidentelle, et le texte vide peut confondre absence dans la langue et absence globale.

## Minor Observations

Les citations gardent une largeur de lecture maîtrisée et l’attribution est cliquable. Le contexte tag + retour dans la sticky bar mobile paraît utile plutôt que redondant, puisque l’en-tête principal sort du viewport.

## Questions to Consider

- La catégorie `growth` est-elle un libellé traduit pour l’utilisateur ou un vocabulaire canonique voulu en anglais partout ?
- Dans une vue vide filtrée par langue, veut-on proposer directement « voir toutes les langues » ou simplement clarifier le message ?
