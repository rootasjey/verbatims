---
target: dialogue d’édition de tags sur la page de citation
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/rootasjey/GitHub/verbatims/app/components/EditQuoteTagsDialog.vue"
target_fingerprint: "sha256:24ed8a36e28ccf64b3a92bc95c618ac26a6ee3fca846915bf9ab0eca224320cb"
target_path: /Users/rootasjey/GitHub/verbatims/app/components/EditQuoteTagsDialog.vue
timestamp: 2026-10-26T21-31-18Z
slug: app-components-editquotetagsdialog-vue
---
Method: dual-agent (A: /root/edit_tags_assessment_a · B: /root/edit_tags_assessment_b)

# Revue du dialogue « Modifier les tags »

## Verdict de spécificité
Le dialogue reprend quelques codes de Verbatims — titre serif, espace généreux, tags identifiés par couleur — mais il reste assez générique par rapport à la DA éditoriale. Le titre s’intègre bien à la fiche de citation; les contrôles bleus et la coche sans libellé donnent davantage l’impression d’un formulaire standard.

## Score d’utilisabilité

| Heuristique | Note / 4 | Observation |
|---|---:|---|
| Visibilité de l’état | 2 | Chargement et erreurs existent, mais les mutations donnent peu de confirmation. |
| Correspondance avec le monde réel | 3 | « Ajouter un tag » et « Tags actuels » sont compréhensibles; la coche reste ambiguë. |
| Contrôle et liberté | 2 | Le dialogue se ferme, mais le retrait d’un tag est immédiat et sans annulation. |
| Cohérence et standards | 3 | Les composants sont familiers et les tags existants restent visibles. |
| Prévention des erreurs | 2 | L’ajout est déclenché par un bouton sans libellé explicite. |
| Reconnaissance plutôt que mémorisation | 3 | Les tags actuels sont visibles; les marqueurs de suggestion restent à découvrir. |
| Flexibilité et efficacité | 3 | Recherche et navigation clavier disponibles; édition tag par tag. |
| Esthétique et minimalisme | 3 | Composition calme, mais l’accent bleu vif et les petits libellés s’accordent moins à la DA. |
| Récupération après erreur | 2 | Une erreur peut s’afficher, mais le retrait n’est pas réversible. |
| Aide et documentation | 1 | La différence entre suggestion et création, et les marqueurs, ne sont pas expliqués dans le dialogue. |
| **Total** | **24/40 — Acceptable** | Fonctionnel, avec des ambiguïtés évitables. |

## Charge cognitive et parcours
La charge cognitive est faible : **1 échec sur 8 critères**. Lorsque les suggestions s’affichent, on peut avoir cinq choix plus une option de création au même endroit. C’est le seul point qui dépasse les quatre options recommandées.

L’ouverture est rassurante : le dialogue est simple et montre les tags déjà associés. La saisie rend la tâche directe, mais la coche oblige à deviner son effet. Le retrait immédiat crée le principal risque de frustration; il faut ensuite retrouver et réajouter le tag.

## Ce qui fonctionne
- Le titre serif et l’espace autour des groupes gardent un lien avec l’identité éditoriale.
- Les tags associés restent visibles pendant l’édition; leurs couleurs aident à les reconnaître.
- Recherche, suggestions et navigation clavier rendent la curation plus rapide.

## Problèmes prioritaires
1. **[P1] La coche n’explique pas son action.** Elle peut lancer l’ajout ou la création, mais son nom accessible est aussi limité à l’icône. Ajouter un libellé d’action explicite, par exemple « Ajouter », avec le même nom accessible.
2. **[P2] Le bleu générique prend trop de place.** Le contour cyan du champ et le bouton bleu dominent les teintes chaudes et neutres de l’interface. Le détecteur navigateur a aussi signalé un contraste de **4,4:1** pour du texte, juste sous son seuil de 4,5:1. Garder les couleurs propres aux tags, mais calmer les contrôles génériques et renforcer le texte concerné.
3. **[P2] Le retrait n’a pas de retour arrière.** Une suppression involontaire oblige à refaire la recherche et l’ajout. Prévoir une annulation discrète ou rendre l’édition réversible jusqu’à la fermeture.
4. **[P2] Suggestions et création se concurrencent.** Les marqueurs de popularité et de correspondance ne sont expliqués qu’au survol; cinq suggestions et la création peuvent apparaître ensemble. Séparer visuellement les résultats de l’option de création et rendre les marqueurs compréhensibles sans survol.
5. **[P2] Les changements manquent de retour visible.** La liste actualisée aide, mais l’état de l’action reste discret. Ajouter un retour bref et accessible au moment de l’ajout ou du retrait.

## Signaux par profil
- **Alex, curateur expérimenté :** la recherche et les flèches clavier aident, mais il doit modifier les tags un par un.
- **Jordan, première visite :** la coche ne précise pas si elle recherche, ajoute un tag existant ou crée le texte saisi.
- **Sam, clavier ou lecteur d’écran :** les suggestions sont des `div` cliquables, et le bouton d’ajout ne porte pas de nom d’action explicite.

## Observations mineures
Sur `/quotes/2472`, dialogue ouvert à **1260 × 780** : le rendu montre le titre serif, les tags colorés, le contour bleu du champ et la coche isolée. Le détecteur statique ne relève aucune anomalie (`[]`), tandis que son overlay navigateur signale **8 annotations** sur la vue : deux problèmes d’interligne, cinq de contraste et une bordure fine avec ombre large. Parmi celles qui concernent le dialogue : contraste du champ, interligne du titre et traitement bordure/ombre. L’injection a fonctionné dans l’espace de vérification, mais il n’y a pas de vue `[Human]` disponible pour présenter cet overlay.

## Questions à considérer
- La coche est-elle le meilleur symbole pour l’ajout?
- Le retrait doit-il être annulable?
- Les marqueurs de suggestion doivent-ils être visibles sans survol?
