# Pipeline multi-pass : des hallucinations IA aux données fiables

Quand l'IA suggère des thèmes, elle invente des filtres qui n'existent pas
dans la base de données. Plutôt que de rejeter ces suggestions ou de les
appliquer aveuglément, on a conçu un pipeline en trois passes.

## Architecture

```
Pass 1 (rapide, synchrone)
  Suggestions IA → Choix d'un thème → Sauvegarde
  (avec hallucinations potentielles) + date d'activation
                    │
                    ▼ déclenchement asynchrone
Pass 2 (background, quelques secondes)
  Validation DB de chaque filtre
    → tag_name : existe dans la table tags ?
    → author_name : existe dans la table authors ?
    → reference_name : existe dans la table quote_references ?
  Suppression des hallucinations
  Création d'entité_suggestions pour les valeurs inconnues
                    │
                    ▼
Pass 3 (review humain)
  Interface accept/reject
  Accepté → création automatique de l'entité dans la DB
  Rejeté → ignoré
```

## Implémentation

### Table de suggestions

```sql
CREATE TABLE entity_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL,
  type TEXT CHECK (type IN ('tag', 'author', 'reference')),
  suggested_value TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  -- ...
);
```

### Validation

```ts
async function filterExists(type: string, value: string): Promise<boolean> {
  // tag_name → check tags table
  // author_name → check authors table
  // reference_name → check quote_references
  // keyword/language → always valid (free text)
}
```

### Création automatique sur accept

```ts
if (action === 'accepted') {
  switch (suggestion.type) {
    case 'tag': db.insert(tags).values({ name: value })
    case 'author': db.insert(authors).values({ name: value })
    case 'reference': db.insert(quoteReferences).values({ name: value, primaryType: 'other' })
  }
}
```

## Ce qu'on a appris

1. **L'auto-enrichissement par cooccurrence est du bruit** — on avait
   ajouté un système qui trouvait des filtres "connexes" (cooccurrence
   de tags, auteurs liés). Il ajoutait Satoshi Nakamura et "sadness"
   à un thème sur la Révolution française.

2. **Le try-catch généralisé cache les vrais problèmes** — on a essayé
   de wrapper tout le feed dans un try-catch pour éviter les 500.
   Résultat : on ne voyait plus les erreurs. Il faut traiter la cause,
   pas le symptôme.

3. **L'asynchrone est indispensable** — l'IA met 10-30 secondes à
   répondre. Le thème doit être créé immédiatement, l'enrichissement
   arrive ensuite. `scheduleBackground()` via `event.waitUntil`
   permet de lancer un job sans bloquer la réponse.

## Pour aller plus loin

Le système peut être étendu pour suggérer des citations complètes
(avec contenu, auteur, référence) au lieu de simples entités. Il
faudrait alors un appel IA dédié par thème pour générer des citations
pertinentes, avec validation humaine avant insertion.
