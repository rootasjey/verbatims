# Cahier des charges — thèmes éditoriaux Verbatims

**Version :** 1.0 — élaborée à partir du pilote de novembre 2026
**Périmètre :** choix, préparation, programmation et création des visuels d’un thème éditorial.
**Statut :** processus éditorial documenté; la configuration en production et toute évolution de schéma sont des décisions séparées.

## 1. Objectif

Préparer des thèmes cohérents et sourcés, publiables en français et en anglais, avec une programmation compréhensible et des visuels adaptés. Le thème doit aider à découvrir les citations et leur contexte, sans réduire la collection à la citation mise en avant.

## 2. Principes éditoriaux

- Rechercher en priorité un thème lié à un événement, une commémoration, une saison ou un repère culturel pertinent pour la période.
- Évaluer le thème selon sa cohérence éditoriale, son intérêt pour les lecteurs, la disponibilité de citations vérifiables et sa capacité à être traité dans les deux langues.
- Préparer une version française et une version anglaise distinctes. Chaque version utilise des textes originaux dans la langue concernée ou identifie explicitement le traducteur lorsque l’on retient une traduction.
- Éviter de reprendre les citations et les œuvres du thème précédent. Quelques auteurs peuvent revenir si les œuvres et les extraits sont distincts et si la répétition est éditorialement justifiée.
- Viser environ 12 citations par thème et par langue. Les sélections FR et EN sont des collections indépendantes; une langue ne complète pas le quota de l’autre.
- Écarter une citation qui n’est pas intelligible ou pertinente sans une explication disproportionnée. Ne pas retenir un extrait uniquement parce qu’il est célèbre.

## 3. Sélection et vérification des citations

Pour chaque citation candidate, consigner dans le dossier de campagne :

1. la formulation exacte, la ponctuation, les coupes et la langue;
2. le nom de l’auteur, du locuteur ou de l’organisme responsable du texte;
3. l’œuvre ou le document, sa date et un repère précis (chapitre, article, page, paragraphe ou vers);
4. un lien vers une source primaire ou une reproduction institutionnelle fiable;
5. l’état de vérification et les éventuelles réserves éditoriales;
6. un contexte lecteur séparé de la référence bibliographique.

Vérifier les citations ajoutées et leurs attributions dans le texte primaire, pas seulement sur un site de citations. Comparer l’extrait au témoin retenu et garder la graphie historique lorsqu’elle est pertinente. La traduction, son attribution et son statut sont vérifiés séparément. Ne pas modifier l’instantané TOML de production pour y enregistrer une campagne candidate : ce registre reste réservé aux citations présentes en production.

### Prérequis de fiabilisation avant toute saisie en production

La recherche documentaire et la qualification des données font partie de la préparation du thème; ce sont des prérequis à l’ajout des citations, auteurs et références dans l’application. Le dossier de campagne doit permettre de distinguer ce qui a été vérifié, ce qui reste incertain et ce qui ne s’applique pas. Une information manquante ne doit jamais être complétée par déduction présentée comme un fait.

Pour chaque citation retenue, préparer et contrôler :

- le texte exact dans la langue publiée, les coupes et la ponctuation;
- l’auteur ou le locuteur, en distinguant l’auteur d’une œuvre, le personnage, le narrateur, l’intervenant et l’organisme lorsque nécessaire;
- l’œuvre ou le document, son titre exact, son type, sa langue d’origine et sa date de publication ou de prononciation lorsqu’elle est établie;
- une source primaire ou un témoin institutionnel fiable, un lien consultable et un repère précis dans le document (page, chapitre, vers, article, paragraphe, scène ou horodatage);
- une vérification distincte du texte, de l’attribution et de la traduction. La présence d’un lien de source ne suffit pas à confirmer automatiquement l’attribution;
- un contexte lecteur bref et localisé, rattaché à l’occurrence concernée.

Pour chaque auteur individuel et chaque référence, rechercher les données pertinentes et les consigner avec leurs sources :

- auteur : dates de naissance et de décès, lieux associés, fonction ou activité, biographie courte en français et en anglais, et liens fiables (site officiel, institution, notice d’autorité ou encyclopédie de référence);
- référence : titre, type, langue d’origine, date de publication ou de création, description utile au lecteur et liens bibliographiques ou institutionnels;
- image : visuel adapté et effectivement consultable, texte alternatif descriptif, crédit, URL de provenance, licence et éventuelles limites de territoire ou de réutilisation.

Ne pas remplir artificiellement les champs inapplicables : une entité collective n’a pas de portrait ni de dates de vie; une référence peut ne pas avoir de date certaine ou de description utile. Dans ces cas, laisser le champ vide et noter « non applicable » ou la raison de l’absence dans l’inventaire de campagne. Pour une donnée recherchée mais non confirmée, inscrire explicitement la réserve dans les métadonnées et conserver le statut de vérification approprié.

Les statuts de provenance de l’application doivent être employés avec précision et séparément pour l’attribution et la source : `externally_verified`, `manually_verified`, `unverified` ou `disputed`. Ne pas marquer une attribution comme vérifiée parce que le texte seul a été retrouvé; ne pas marquer une source comme vérifiée parce que son URL est renseignée. Une attribution non vérifiée ou contestée peut rester une candidate éditoriale si elle est clairement signalée, accompagnée des éléments disponibles et validée explicitement avant publication. Ne jamais reformuler une réserve dans une note tout en laissant un statut contradictoire.

Avant l’enregistrement en production, faire une revue de complétude par citation, auteur et référence. Tous les champs applicables doivent être renseignés ou accompagnés d’une raison documentée; chaque exception doit être visible dans la fiche de campagne et dans les métadonnées de l’entité concernée. Le dossier final conserve les liens, localisateurs, crédits et réserves afin qu’un autre éditeur puisse refaire les vérifications.

### Contexte destiné au lecteur

Le contexte lecteur explique brièvement qui parle, à qui, quand et dans quelle situation, ainsi que le sens que l’extrait prend dans l’œuvre ou le document. Il est rédigé dans la langue de la page et rattaché à l’occurrence de citation concernée. Pour une voix poétique, décrire la voix et la scène du poème sans attribuer automatiquement ces paroles à la biographie de l’auteur.

Le contexte lecteur doit rester distinct de la note de source : la note identifie et localise le témoin; le contexte rend l’extrait compréhensible. Toute évolution d’un champ public dans le produit, son nom, sa localisation exacte dans le modèle et sa prise en charge bilingue sont à cadrer et valider séparément avant toute migration.

## 4. Cadre de droit d’auteur

L’exception française de courte citation peut s’appliquer à certaines citations incorporées dans une œuvre à caractère critique, polémique, pédagogique, scientifique ou d’information, sous réserve d’indiquer clairement le nom de l’auteur et la source. La finalité informative de Verbatims et ses explications peuvent donc être pertinentes; elles ne constituent pas à elles seules une autorisation générale. Évaluer chaque extrait, son ampleur, son intégration et chaque format de diffusion. Les traductions, éditions et images de fac-similés font l’objet de vérifications distinctes. Les boutons de signalement facilitent le traitement d’une réclamation, mais ne remplacent pas cette évaluation préalable.

Référence : [Code de la propriété intellectuelle, article L. 122-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048603495/2026-05-13).

## 5. Programmation

- Définir pour chaque thème une date de début, une date de fin, un fuseau horaire et une priorité.
- Garder un thème de base actif pendant sa fenêtre. Programmer les thèmes ponctuels avec une priorité supérieure afin qu’ils remplacent le thème de base aux dates concernées.
- N’afficher qu’un seul thème principal à la fois. Vérifier que le thème de repli cesse d’être éligible après sa date de fin.
- Définir à l’avance une citation à la une par jour et par langue; éviter les sélections aléatoires.
- Garder la collection complète accessible sur la page du thème, même si une seule citation est mise en avant. Après la période, conserver les thèmes ponctuels dans les archives.
- Contrôler les dates et priorités des thèmes déjà en production pour repérer tout conflit avant d’enregistrer une nouvelle programmation.

## 6. Visuels et templates

- Faire l’inventaire des templates existants et confirmer leur format, leurs champs et leurs contraintes avant création.
- Maintenir au moins trois compositions réutilisables lorsque le besoin de publication le justifie; distinguer les formats destinés aux réseaux sociaux des planches éditoriales, par exemple Dribbble.
- Pour une planche Dribbble de thème, utiliser `docs/design/dribbble/templates/homepage.html` avec une capture réelle de la page d’accueil sous le thème choisi. Créer et prévisualiser d’abord le thème dans l’environnement local; ne pas remplacer la capture par une composition auteur/référence ou une illustration seule.
- Préparer des livrables français et anglais avec textes, attributs accessibles, dates, noms, citations et crédits localisés. Une illustration sans texte peut être partagée entre les langues.
- Produire les captures de page d’accueil et les cartes sociales dans les deux langues. Les cartes sociales utilisent leur propre template `docs/design/social/templates/theme.html`; ne pas confondre ce format carré avec la planche Dribbble homepage.
- Garder les illustrations sans citation intégrée afin que le texte reste modifiable et vérifiable. Ajouter les crédits d’illustration dans la légende ou les métadonnées selon le format.
- Ne jamais écraser les visuels déjà validés : produire une version datée ou nommée séparément et conserver la V1 comme référence.
- Vérifier les dimensions et inspecter chaque rendu PNG pour confirmer que la citation, l’attribution, les titres et le logo ne sont ni tronqués ni superposés.

## 7. Étapes de validation et de mise en production

1. Proposer deux ou trois thèmes pertinents et documenter leurs dates possibles.
2. Faire choisir le thème et confirmer le calendrier, les priorités et le thème de repli.
3. Inventorier le contenu existant et les citations déjà utilisées afin de limiter les reprises.
4. Rechercher, vérifier et contextualiser les citations FR et EN; compléter les réserves jusqu’à la cible définie et appliquer la revue de complétude des citations, auteurs, références et images décrite en section 3.
5. Présenter les sélections, références, contextes et rotations quotidiennes pour validation éditoriale.
6. Créer les visuels localisés avec les templates retenus, puis inspecter les PNG.
7. Présenter un dossier de campagne final : sources primaires et localisateurs, statuts séparés du texte/de l’attribution/de la source, biographies et dates recherchées, références, crédits/licences des images, calendrier, réserves, visuels et limites connues.
8. N’enregistrer en production qu’après validation explicite du contenu et du calendrier. Traiter les éventuelles migrations de schéma comme une tâche technique distincte avec son propre contrôle.

## 8. Livrables d’une campagne

- une fiche de thème FR et une fiche de thème EN;
- un calendrier avec priorités, une citation à la une par date et une règle d’archive;
- environ 12 citations candidates par thème et par langue, avec sources primaires et état de vérification;
- un contexte lecteur localisé pour chaque citation retenue;
- des réserves et les raisons d’exclusion ou de remplacement;
- les visuels exportés et leurs sources éditables, séparés par langue lorsque le contenu affiché diffère;
- une note de validation précisant ce qui reste brouillon, ce qui est approuvé et ce qui n’a pas été déployé.

## 9. Pilote de novembre 2026

Le dossier [`docs/design/campaigns/november-2026/`](../design/campaigns/november-2026/) applique ce processus aux thèmes *Brumes de la nuit*, *Mémoire, paix et réconciliation* et *Tolérance, voix plurielles*. Il documente la fenêtre du 3 au 16 novembre, les réserves FR/EN, le choix d’une citation quotidienne, les contextes lecteur et les premières déclinaisons visuelles bilingues. Les fichiers du dossier constituent un brouillon éditorial local; ils ne configurent pas la production.
