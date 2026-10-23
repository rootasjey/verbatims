# Parcours de vérification locale

Parcours court à rejouer après une mise à jour de Nuxt, UnaUI ou d’une dépendance
qui touche au rendu et aux interactions. Il vérifie quelques flux représentatifs
dans le navigateur ; il ne remplace ni les tests automatisés ni une recette
exhaustive.

## Préparation

1. Démarrer l’application locale avec `bun run dev` sur le port `3002`.
2. Ouvrir Ego Browser sur `http://localhost:3002/`.
3. Vérifier que les opérations de données restent locales. Ne pas synchroniser la
   base avec la production pendant le parcours.

## Parcours

### Navigation, recherche et filtres

1. Sur `/`, ouvrir **Explore**, puis choisir **Quotes**.
2. Rechercher `force` sur `/quotes` et attendre la mise à jour des résultats.
3. Choisir le filtre de langue **French**.
4. Inverser le tri avec le bouton de sens de tri.

Vérifier que la liste et son compteur réagissent à la recherche et au filtre, et
que le libellé du bouton de tri change de sens.

### Création et suppression d’une citation

1. Ouvrir **Contribute → Add Quote** depuis l’en-tête.
2. Saisir une citation synthétique réservée au test, puis passer à l’attribution.
3. Choisir l’auteur temporaire créé avant ce parcours.
4. Dans le champ de référence, saisir un titre unique réservé au test puis
   choisir **Create new reference**. Vérifier que la référence apparaît comme
   attribution de la citation.
5. Enregistrer comme brouillon et vérifier que la citation et la référence sont
   visibles dans le brouillon.
6. Dans `/admin/quotes/drafts`, retrouver le brouillon de test, ouvrir son menu,
   choisir **Delete Draft**, puis confirmer.
7. Vérifier que le brouillon disparaît et que le compteur revient à sa valeur
   précédente.

### Création, mise à jour et suppression d’un auteur et d’une référence temporaires

1. Dans `/admin/authors`, choisir **Add New Author** et créer un auteur dont le
   nom indique clairement qu’il s’agit d’une donnée temporaire de smoke test.
2. Créer la citation et sa référence temporaire dans le formulaire de citation,
   comme décrit ci-dessus.
3. Rechercher l’auteur, ouvrir son menu, puis **Edit Author**. Modifier sa
   description et enregistrer. Vérifier que la nouvelle description apparaît.
4. Dans `/admin/references`, rechercher la référence créée avec la citation,
   ouvrir son menu, puis **Edit Reference**. Modifier sa description et
   enregistrer. Vérifier que la mise à jour apparaît.
5. Supprimer d’abord le brouillon qui utilise ces deux enregistrements.
6. Supprimer ensuite la référence temporaire depuis `/admin/references`, puis
   l’auteur depuis `/admin/authors`, en confirmant chaque dialogue.
7. Vérifier que la citation, la référence et l’auteur ont disparu et que les
   compteurs reviennent à leurs valeurs de départ.

## Nettoyage et résultats observés

Supprimer uniquement les enregistrements créés pour le parcours. Le 23 octobre
2026, la navigation, la recherche, le filtre, le tri, la création et la
suppression d’un brouillon, ainsi que la création, la mise à jour et la
suppression d’un auteur temporaire ont fonctionné sur la base locale. La
création de la référence depuis le formulaire de citation, puis sa mise à jour
et sa suppression, ont également fonctionné. La référence est apparue sur la
citation avec un compteur de 1, puis à 0 après la suppression du brouillon. Le
brouillon et la référence ont disparu après suppression ; le compteur des
références est revenu à 402. L’auteur temporaire a lui aussi disparu de la
recherche après suppression.

Le brouillon anglais de test a été affiché une fois avec la langue **Latin**.
Le test n’a pas établi si la requête de détection était encore en cours ou si
c’était son résultat final. Après une mise à jour, attendre la fin de la requête
et vérifier de nouveau : si Latin persiste dans le résultat final, traiter cela
comme une possible erreur de détection et non comme un résultat intermédiaire.

Le premier contrôle du dialogue UnaUI avait montré une largeur du document qui
passait de 1245 à 1260 pixels pendant le verrouillage du défilement. Après le
correctif, une nouvelle vérification sur `/admin/authors` a conservé la largeur
utile à 1245 px, le masthead à x=0 et largeur 1245 px, ainsi que `scrollY=0`.

Ne pas utiliser le raccourci `Ctrl/Cmd+A` depuis les tableaux d’administration
pour ouvrir le formulaire de citation : dans ce contexte, il a aussi sélectionné
la page de lignes affichée. Utiliser le menu **Contribute → Add Quote** depuis
une page sans sélection de tableau.

## Avertissements examinés

Le 23 octobre 2026, les avertissements UnoCSS de l’entrée `none` et de la
variante `secondary` ont été supprimés par un alias de compatibilité et par
l’usage de la variante grise existante dans les états vides. Les clés anglaises
`nuxtSiteConfig.name`, `nuxtSiteConfig.description` et `home.theme_details` ont
été ajoutées. Le store d’en-tête expose maintenant ses références d’état
Pinia sans wrapper readonly, ce qui a supprimé les avertissements d’écriture
readonly pendant l’hydratation. Les derniers écarts SSR/client de Vue ont été
corrigés en attendant le montage avant d’afficher les contrôles dépendant du
thème côté client. Le verrouillage de scroll des dialogues ne modifie plus
`overflow` de `documentElement` : la gouttière stable garde la largeur utile et
le masthead en place. Vérification dans Ego Browser sur `/` et
`/admin/authors` : aucun avertissement Vue d’hydratation sur la page d’accueil ;
le formulaire auteur ouvert conserve la largeur utile de 1245 px et le masthead
(x=0, largeur 1245 px, hauteur 60 px), avec `scrollY` inchangé à 0.
