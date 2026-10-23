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
3. Choisir l’auteur temporaire créé dans le parcours ci-dessous.
4. Enregistrer comme brouillon.
5. Dans `/admin/quotes/drafts`, retrouver le brouillon de test, ouvrir son menu,
   choisir **Delete Draft**, puis confirmer.
6. Vérifier que le brouillon disparaît et que le compteur revient à sa valeur
   précédente.

### Création, mise à jour et suppression d’un auteur temporaire

1. Dans `/admin/authors`, choisir **Add New Author** et créer un auteur dont le
   nom indique clairement qu’il s’agit d’une donnée temporaire de smoke test.
2. Rechercher cet auteur, ouvrir son menu, puis **Edit Author**.
3. Modifier sa description et enregistrer. Vérifier la confirmation de succès.
4. Après suppression du brouillon qui lui est attribué, rouvrir le menu de
   l’auteur, choisir **Delete Author**, puis confirmer.
5. Vérifier que l’auteur n’apparaît plus et que le compteur est revenu à sa
   valeur initiale.

## Nettoyage et résultats observés

Supprimer uniquement les enregistrements créés pour le parcours. Le 23 octobre
2026, la navigation, la recherche, le filtre, le tri, la création et la
suppression d’un brouillon, ainsi que la création, la mise à jour et la
suppression d’un auteur temporaire ont fonctionné sur la base locale. Les
compteurs d’auteurs et de brouillons sont revenus à leurs valeurs de départ.

Le brouillon de test a été affiché avec la langue **Latin** malgré son texte
anglais. C’est un résultat à examiner avant de considérer la création d’une
citation complètement vérifiée. À l’ouverture du dialogue UnaUI, la largeur
disponible du document est passée de 1245 à 1260 pixels pendant le verrouillage
du défilement ; la position et la largeur du menu de navigation du masthead sont
restées identiques dans la mesure effectuée. Vérifier aussi visuellement le reste
de la page lors des futures mises à jour de la modale.

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
