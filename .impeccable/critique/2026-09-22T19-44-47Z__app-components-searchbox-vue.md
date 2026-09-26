---
target: SearchBox global search dialog
total_score: 21
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-09-22T19-44-47Z
slug: app-components-searchbox-vue
---
⚠️ DEGRADED: single-context (Assessment A sub-agent spawn failed: collab spawn failed: agent thread limit reached; Assessment B ran in a separate agent)

## Santé ergonomique

| # | Heuristique | Score / 4 | Constat principal |
|---|---|---:|---|
| 1 | Visibilité de l’état | 2 | Chargement et compteur présents, mais une panne peut ressembler à « aucun résultat ». |
| 2 | Correspondance avec le monde réel | 2 | « Search Quotes » ne reflète pas la recherche d’auteurs/références ; les modes `@` et `/` sont cachés. |
| 3 | Contrôle et liberté | 3 | Échap, fermeture et effacement existent ; les filtres prennent toutefois beaucoup de place dans ce dialogue. |
| 4 | Cohérence et standards | 2 | L’ensemble paraît plus générique et dense que la direction éditoriale récente. |
| 5 | Prévention des erreurs | 3 | Les filtres bornent la recherche, mais le débordement mobile est un défaut concret. |
| 6 | Reconnaissance plutôt que mémorisation | 2 | Les filtres sont visibles ; les syntaxes de navigation et commandes ne le sont pas. |
| 7 | Flexibilité et efficacité | 3 | Raccourci clavier, flèches et Entrée sont utiles aux habitués. |
| 8 | Esthétique et sobriété | 2 | Trois sélecteurs, filtres actifs, groupes et métriques se disputent l’attention. |
| 9 | Récupération après erreur | 1 | Échec réseau et vraie absence de résultats ne sont pas différenciés, sans action de reprise. |
| 10 | Aide et documentation | 1 | Les touches sont indiquées, pas les modes `@` et `/`. |
| **Total** |  | **21/40** | **Acceptable, avec quelques défauts prioritaires** |

## Spécificité visuelle

Le contenu est bien propre à Verbatims — citations et métadonnées d’auteurs/références — mais la structure du dialogue ressemble encore à une boîte de recherche générique. Le principal manque est une hiérarchie éditoriale nette entre « trouver rapidement quelque chose » et « filtrer/explorer ».

Le scan statique a renvoyé **0 constat** pour le fichier ciblé. L’overlay navigateur, lui, a signalé **35 motifs génériques sur la page entière** (contraste faible, cartes imbriquées, etc.) : ce sont des observations à l’échelle de la page d’accueil, pas 35 défauts attribuables au dialogue. Les captures d’écran ont expiré ; je ne traite donc pas ces éléments comme une validation visuelle.

## Impression générale

Le dialogue est capable et efficace pour un utilisateur clavier régulier, mais trop chargé pour une recherche rapide. Je recommande de distinguer deux usages : une palette de recherche rapide, simple, et une page `/search` pour les filtres et l’exploration avancée.

## Ce qui fonctionne

- Une seule recherche peut trouver citations, auteurs et références.
- `Cmd/Ctrl+K`, les flèches et Entrée rendent le parcours clavier efficace.
- Les résultats sont groupés par type, ce qui aide à comprendre ce qui a été trouvé.

## Points prioritaires

**[P1] Les filtres débordent sur mobile.** À 390 × 844, le sélecteur Référence se termine à x=401, au-delà de la fenêtre (390 px) et du bord de la modale (x=374). Les trois contrôles sont forcés sur une rangée. **Correction :** retirer les filtres du dialogue rapide, ou les placer dans une section repliable/disposition empilée. Commande suggérée : `$impeccable layout`.

**[P1] Les résultats et le champ manquent de sémantique accessible.** Le champ n’a pas de nom accessible explicite ; les lignes de résultats sont des conteneurs cliquables plutôt que des liens/boutons avec état sélectionné communiqué aux technologies d’assistance. **Correction :** donner un libellé au champ et rendre les résultats navigables par liens/boutons, avec un modèle listbox/combobox correctement annoncé. Commande suggérée : `$impeccable harden`.

**[P2] Le dialogue cumule recherche, filtres, navigation et commandes sans rendre les modes évidents.** Son titre dit « Search Quotes » alors qu’il recherche aussi auteurs et références ; les préfixes `@` et `/` déclenchent des modes non signalés. **Correction :** le titre pourrait devenir « Search Verbatims » ou « Search anything » ; garder le dialogue centré sur la recherche rapide et déplacer les commandes/nav dans un espace clairement annoncé, ou afficher une aide courte. Commande suggérée : `$impeccable distill`.

**[P2] Les erreurs ressemblent à des résultats vides.** Les erreurs de requête sont rabattues sur zéro résultat, sans message distinct ni réessai. **Correction :** différencier état vide et erreur réseau, avec une action « Réessayer ». Commande suggérée : `$impeccable harden`.

**[P2] Le dialogue n’offre pas de passage clair vers l’exploration complète.** Les résultats sont limités à 20 et chaque sélection mène directement à une fiche ; aucun lien « Voir tous les résultats » n’est visible. **Correction :** ajouter « Voir tous les résultats » vers `/search?q=…`. Garder la recherche de la modale transitoire et sans synchronisation d’URL ; la page `/search` synchronise déjà `q`, ce qui est le bon endroit pour synchroniser aussi d’éventuels filtres avancés. Commande suggérée : `$impeccable shape`.

## Signaux par profil d’usage

- **Sur téléphone :** les trois filtres côte à côte font déborder le sélecteur Référence.
- **Au clavier :** le raccourci et les flèches sont bons, mais l’utilisateur doit deviner les modes `@` et `/`.
- **Avec lecteur d’écran :** le champ est sans nom explicite et les rangées cliquables n’annoncent pas clairement leur rôle ni la sélection courante.

## Observations secondaires

- Les compteurs de likes et de vues dans chaque résultat de citation attirent l’œil hors du texte recherché.
- Le compteur « 0 results » n’est pas une alternative suffisante à un vrai état d’erreur.
- Le titre « Search Quotes » devrait être cohérent avec la recherche multi-entités.

## Questions à trancher

La direction que je privilégierais : dialogue minimal pour rechercher rapidement, avec un lien vers `/search` pour filtres et résultats complets. **Veux-tu que je passe à cette proposition, ou préfères-tu conserver les filtres directement dans le dialogue et les réorganiser pour mobile ?**
