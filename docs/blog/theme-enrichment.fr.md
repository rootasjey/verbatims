# Comment on a enrichi un thème 14 Juillet

Créer un thème pour le 14 Juillet semblait simple : on demande à l'IA
de suggérer des auteurs et des citations, on valide, c'est fini. La
réalité a été plus… instructive.

## Phase 1 : Les suggestions IA

Premier constat : l'IA propose des noms créatifs et des descriptions
évocatrices, mais elle **hallucine** les données. Elle suggère des tags
comme "liberté", "égalité", "fraternité" qui n'existent pas dans la base.
Elle associe "George Bernard Shaw" à la Révolution française parce que
c'est un auteur populaire.

**Leçon** : ne jamais faire confiance aux filtres générés par l'IA sans
les valider contre la base de données.

## Phase 2 : Le pipeline d'enrichissement

On a construit un système en 3 passes :

1. **Pass 1 (synchrone)** : l'IA génère des suggestions → l'utilisateur
   choisit → le thème est créé
2. **Pass 2 (asynchrone)** : un job en arrière-plan valide chaque filtre
   contre la DB, supprime les hallucinations
3. **Pass 3 (review)** : les filtres hallucinés deviennent des suggestions
   d'entités à créer (tags, auteurs, références) avec une UI accept/reject

Le Pass 2 a d'abord été trop agressif : il ajoutait automatiquement des
filtres "connexes" par cooccurrence. Résultat : Satoshi Nakamoto,
The 4-Hour Workweek, "sadness" et "fear" atterrissaient dans un thème
sur la Révolution française. Nous avons désactivé cet auto-enrichissement
pour ne garder que la validation et les suggestions.

## Phase 3 : Les données réelles

Pour enrichir vraiment le thème, on a ajouté :

- **Auteurs** : Robespierre, Rousseau, Voltaire, Olympe de Gouges, Danton
- **Références** : Déclaration des droits de l'homme, Du Contrat Social,
  Les Misérables
- **Citations** (14, toutes vérifiées et sourcées) : de la DDHC à Danton
  en passant par Voltaire

Le thème "Le Serment de l'Aube" a maintenant 25 filtres et des citations
réelles qui les matchent.

## Enseignements

- Une suggestion IA sans validation DB n'est qu'une hallucination élégante
- L'enrichissement automatique par cooccurrence crée du bruit, pas du signal
- Les données réelles (même en petite quantité) valent mieux que des
  suggestions abondantes mais fausses
- Le processus asynchrone (création immédiate + enrichissement différé)
  est le bon compromis entre vitesse et qualité
