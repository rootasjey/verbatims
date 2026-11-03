# Campagnes éditoriales — novembre 2026 (brouillon)

Document de validation locale, séparé de l’instantané TOML d’audit de production. Aucun contenu de cette fiche n’est enregistré en production.

Le processus réutilisable est décrit dans le [cahier des charges des thèmes éditoriaux](../../../editorial/theme-campaign-spec.md).

## Calendrier proposé

| Priorité | Thème | Fenêtre, heure de Paris | Résolution attendue |
| ---: | --- | --- | --- |
| 1 | Brumes de la nuit | 3–16 novembre inclus | Versions française et anglaise distinctes à préparer. |
| 2 | Mémoire, paix et réconciliation | 11 novembre seulement | Versions française et anglaise distinctes à préparer; remplace le thème de base ce jour-là. |
| 2 | Tolérance, voix plurielles | 16 novembre seulement | Versions française et anglaise distinctes à préparer; remplace le thème de base ce jour-là. |

Un seul thème visible à la fois. Les programmations ponctuelles priment sur la programmation de base; les valeurs par défaut actuelles servent de repli avant le 3 et après le 16. Halloween se termine le 2 novembre inclus. Chaque thème doit avoir deux réserves distinctes : une française et une anglaise, avec des formulations idiomatiques dans chaque langue. Ne pas mêler les langues dans une même réserve. Si une traduction est retenue, créditer le traducteur, vérifier la formulation dans cette traduction et évaluer séparément son statut ou l’application de la courte citation.

## Templates existants et contraintes constatées

Ces trois templates ont déjà des rendus datés dans `docs/design/dribbble/`.

| Template utilisé | Preuve d’usage | Format et contraintes |
| --- | --- | --- |
| `author.html` | `docs/design/dribbble/2026-10-28/mary-shelley.png` | Board fixe 1600 × 1200; portrait vertical 570 × 790 cadré `object-fit: cover`; colonne éditoriale; citation; trois petites couvertures; crédit en pied. Les titres de section sont anglais dans le template. |
| `reference.html` | `docs/design/dribbble/2026-10-28/frankenstein.png` | Board fixe 1600 × 1200; visuel de référence 570 × 790; citation et attribution; chaîne de trois voix; crédit en pied. Les champs `headlineLines` et `voices.items` pilotent le contenu. |
| `homepage.html` | `docs/design/dribbble/2026-10-25/desktop-board.png` | Board fixe 1600 × 1200; image pleine largeur dans un cadre de 1440 × 870; titre, court texte descriptif et crédit en pied. Pas de champ citation dédié : la citation doit tenir dans le titre ou le descriptif. |
| `theme.html` (social) | `docs/design/social/2026-10-27/halloween-theme-announcement-2026.png` et version anglaise | Carte fixe 1200 × 1200; marge 32 px; image de 1136 × 930 à coins arrondis; titre Fraunces sur deux lignes maximum, date facultative et mot-symbole au pied. Aucun crédit d’image sur la carte. |

Le workflow Dribbble est `bun run dribbble:render -- <content.json>`; il écrit HTML et PNG 1600 × 1200 à côté du JSON et attend le chargement des images et polices. Le workflow social est `bun run social:render -- <content.json>`; il écrit une carte PNG 1200 × 1200. Les trois layouts Dribbble déclarent `lang="en"`; le template auteur contient aussi un libellé de section anglais. Pour ces brouillons seulement, les HTML générés ont été ajustés après rendu en `lang="fr"` et le libellé a été francisé; une nouvelle exécution du renderer les réinitialiserait. Les illustrations de campagne sont générées, sans texte incorporé; les citations restent du texte HTML.

Les trois cartes sociales ci-dessous ont été créées avec `theme.html`, son CSS et le renderer existants, au format 1200 × 1200. Le template prévoit un titre limité à deux lignes et une seule ligne secondaire facultative; celle-ci porte l’auteur et la date sur chaque carte. Les tables de citations ci-dessous relient chaque attribution à l’œuvre, au locator et au témoin primaire. Pour garder la citation entière d’Olympe de Gouges avec son attribution visible, le cadre image des trois cartes est réduit à 880 px dans leurs HTML générés, afin de préserver la même composition. Cet ajustement local ne modifie ni le template ni le CSS partagé.

Le renderer social exige une URL `http(s)` pour l’image, tandis que ces illustrations sont locales. Elles ont été servies temporairement pendant le rendu; les JSON de campagne conservent ensuite le chemin relatif local. Pour relancer ces rendus, il faut fournir temporairement une URL HTTP locale. Les HTML générés pointent vers le CSS partagé avec un chemin relatif adapté au dossier de campagne. Le renderer et les templates applicatifs n’ont pas été modifiés.

## État de contrôle et déduplication

La réserve Halloween de comparaison est celle de [`docs/editorial/halloween-2026-citations.md`](../../../editorial/halloween-2026-citations.md), IDs 2507–2518. Aucune formulation ni œuvre exacte de cette réserve n’est reprise. Coleridge est le seul auteur partagé avec Halloween : l’extrait de Brumes vient d’un poème différent de *The Rime of the Ancient Mariner*. Les répétitions d’auteurs entre les trois nouvelles réserves sont conservées quand elles figurent dans les listes sourcées; elles ne sont pas présentées comme une déduplication.

Les réserves par langue ci-dessous reprennent les extraits et repères des témoins primaires indiqués. La cible de travail est d’environ 12 contenus par thème et par langue. Les lignes présentes sont des candidates sourcées, pas une validation de publication. Les lacunes sont signalées pour la prochaine passe plutôt que comblées par des citations non sourcées. Toute traduction doit indiquer son traducteur; son statut ou l’application de la courte citation se vérifie séparément, et un témoin primaire ne documente pas à lui seul les droits d’une image de l’édition.

### Cadre d’utilisation des citations

Verbatims est un site informatif qui accompagne les citations d’explications, d’attributions et de références. Ce contexte éditorial peut relever de l’exception de courte citation en droit français : chaque extrait doit rester bref et justifié par le propos, avec le nom de l’auteur et la source clairement indiqués. Ce n’est pas une autorisation générale pour tout extrait ou tout format. Les traductions et les images de fac-similés se vérifient séparément. Les boutons de signalement permettent de recevoir et traiter une réclamation; ils ne remplacent pas l’évaluation éditoriale préalable. [Code de la propriété intellectuelle, art. L. 122-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048603495/2026-05-13).

## Brumes de la nuit — réserve française (12 candidates sourcées)

| # | Citation exacte proposée | Auteur / voix | Œuvre et locator | Source primaire | État et note de contexte / droits |
| ---: | --- | --- | --- | --- | --- |
| 1 | « Les sanglots longs / Des violons / De l’automne » | Paul Verlaine / voix poétique | « Chanson d’automne », *Poèmes saturniens*, éd. Vanier, 1902, p. 33–34 | [Témoin de 1902](https://fr.wikisource.org/wiki/Po%C3%A8mes_saturniens/Chanson_d%E2%80%99automne) | **Sourcée**; garder les coupes en vers. |
| 2 | « La lune blanche / Luit dans les bois » | Paul Verlaine / voix poétique | « La lune blanche », *La Bonne Chanson*, éd. Vanier, 1891, p. 13–14 | [Édition Vanier](https://fr.wikisource.org/wiki/La_Bonne_Chanson_(1891)/La_lune_blanche) | **Sourcée**; extrait exact. |
| 3 | « Le soir ramène le silence » | Alphonse de Lamartine / voix poétique | « Le Soir », *Méditations poétiques*, éd. 1860, p. 95–97 | [Œuvres complètes, tome I](https://fr.wikisource.org/wiki/%C5%92uvres_compl%C3%A8tes_de_Lamartine_(1860)/Tome_1/Le_Soir) | **Sourcée**; premier vers. |
| 4 | « Un soir, t’en souvient-il ? nous voguions en silence » | Alphonse de Lamartine / voix poétique | « Le Lac », *Méditations poétiques*, éd. 1860, p. 157–159 | [Édition 1860](https://fr.wikisource.org/wiki/M%C3%A9ditations_po%C3%A9tiques/%C3%89dition_de_1860/Le_Lac) | **Sourcée**; respecter l’apostrophe et la ponctuation du témoin. |
| 5 | « Je restais un soir à veiller / Dans notre salle solitaire » | Alfred de Musset / voix poétique | « La Nuit de Décembre », *Nuits*, éd. 1911, p. 33–46 | [Édition 1911](https://fr.wikisource.org/wiki/Nuits_(Musset)/03) | **Sourcée**; début du récit du poète. |
| 6 | « Quand la lune apparaît dans la brume des plaines » | Victor Hugo / voix poétique | « Quand la lune apparaît », *Toute la lyre*, IV, p. 94, fac-similé du tome XII | [Page du fac-similé](https://fr.wikisource.org/wiki/Page%3AHugo_-_%C5%92uvres_compl%C3%A8tes,_Impr._nat.,_Po%C3%A9sie,_tome_XII.djvu/100) | **Sourcée**; le poème invite une personne aimée à marcher sous les étoiles et à transformer les tourments en amour; vers confirmé dans le témoin numérisé. |
| 7 | « La tranquille odeur du silence » | Anna de Noailles / voix poétique | « Poésie des soirs », *Les Forces éternelles*, éd. revue, 1920, p. 150–151 | [Témoin indiqué](https://fr.wikisource.org/wiki/Les_Forces_%C3%A9ternelles/Po%C3%A9sie_des_soirs) | **Sourcée**; extrait bref à garder avec attribution, source et contexte éditorial. |
| 8 | « Un voile sombre / Ramène l’ombre » | Marceline Desbordes-Valmore / voix poétique | « Le Soir », *Poésies*, éd. 1822, p. 127–128 | [Témoin de 1822](https://fr.wikisource.org/wiki/Po%C3%A9sies_(Desbordes-Valmore,_1822)/Le_Soir) | **Sourcée**; conserver l’extrait en deux vers. |
| 9 | « Le couchant dardait ses rayons suprêmes / Et le vent berçait les nénuphars blêmes » | Paul Verlaine / voix poétique | « Promenade sentimentale », *Poèmes saturniens*, éd. Vanier, 1902, p. 29 | [Édition Vanier](https://fr.wikisource.org/wiki/Po%C3%A8mes_saturniens_(1902)/Promenade_sentimentale) | **Sourcée**; le poème associe le crépuscule, la brume et le deuil amoureux. |
| 10 | « Les sons et les parfums tournent dans l’air du soir » | Charles Baudelaire / voix poétique | « Harmonie du soir », *Les Fleurs du mal*, éd. 1857 | [Édition originale de 1857](https://fr.wikisource.org/wiki/Les_Fleurs_du_mal_(1857)/Texte_entier) | **Sourcée**; vers du refrain; la forme du poème évoque le crépuscule et le souvenir. |
| 11 | « Une atmosphère obscure enveloppe la ville, / Aux uns portant la paix, aux autres le souci » | Charles Baudelaire / voix poétique | « Recueillement », *Le Parnasse contemporain*, 1866 | [Témoin de 1866](https://fr.wikisource.org/wiki/Le_Parnasse_contemporain/1866/Texte_entier) | **Sourcée**; le poème s’adresse à la Douleur et mêle le soir urbain, le regret et la nuit. |
| 12 | « Ce soleil pâlissant, dont la foible lumière / Perce à peine à mes pieds l’obscurité des bois » | Alphonse de Lamartine / voix poétique | « L’Automne », *Méditations poétiques*, éd. originale, 1820 | [Édition originale](https://fr.wikisource.org/wiki/M%C3%A9ditations_po%C3%A9tiques_(%C3%A9d._originale_1820)/L%E2%80%99Automne) | **Sourcée**; conserver « foible » comme dans le témoin; le poème lie le crépuscule automnal à une méditation sur le deuil. |

## Brumes de la nuit — réserve anglaise (12 candidates sourcées)

Ces textes sont en anglais original; ils ne sont pas comptés dans la réserve française. Toute traduction française éventuelle formera une citation traduite distincte, avec traducteur et droits vérifiés.

| # | Citation exacte proposée | Auteur / voix | Œuvre et locator | Source primaire | Note |
| ---: | --- | --- | --- | --- | --- |
| 1 | “Out of the misty eastern cave” | Percy Bysshe Shelley / voix poétique | “To Night”, *Posthumous Poems*, éd. Mary Shelley, 1824 | [Texte et note éditoriale](https://en.wikisource.org/wiki/The_Complete_Poetical_Works_of_Percy_Bysshe_Shelley_(ed._Hutchinson,_1914)/To_Night) | Anglais original; invocation à la Nuit personnifiée, appelée « beloved Night » plus loin dans le poème; la candidate convient au thème nocturne. |
| 2 | “She walks in Beauty, like the night” | Lord Byron / voix poétique | “She Walks in Beauty”, 1814 | [Texte de Byron](https://en.wikisource.org/wiki/She_Walks_In_Beauty) | Anglais original. |
| 3 | “The night is darkening round me” | Emily Brontë / voix poétique | Poème daté de novembre 1837 | [Poème](https://en.wikisource.org/wiki/The_night_is_darkening_round_me) | Anglais original. |
| 4 | “Now sleeps the crimson petal, now the white;” | Alfred, Lord Tennyson / voix poétique | “Now Sleeps the Crimson Petal”, *The Princess: A Medley*, éd. E. Moxon, 1847 | [Texte et référence à l’édition de 1847, University of Toronto](https://rpo.library.utoronto.ca/content/princess-now-sleeps-crimson-petal) | Anglais original; chanson nocturne adressée à la personne aimée. |
| 5 | “Season of mists and mellow fruitfulness,” | John Keats / voix poétique | “To Autumn”, écrit en 1819, publié en 1820; première strophe | [Édition des œuvres poétiques complètes](https://en.wikisource.org/wiki/The_complete_poetical_works_and_letters_of_John_Keats/To_Autumn) | Anglais original; le commentaire de l’édition rattache le poème à une promenade automnale de Keats. |
| 6 | “It is a beauteous Evening, calm and free;” | William Wordsworth / voix poétique | Sonnet, *Poems, in Two Volumes*, vol. I, 1807 | [Édition de 1807](https://en.wikisource.org/wiki/Poems,_in_Two_Volumes_(Wordsworth,_1807)/Volume_1/It_is_a_beauteous_Evening,_calm_and_free) | Anglais original; scène de bord de mer au soleil couchant. |
| 7 | “Unhelp’d by any wind. The owlet’s cry / Came loud—and hark, again! loud as before.” | Samuel Taylor Coleridge / voix poétique | “Frost at Midnight”, version publiée dans *Fears in Solitude*, 1798, première strophe | [Témoin de 1798](https://en.wikisource.org/wiki/Fears_in_Solitude_(Coleridge)/Frost_at_Midnight) | Anglais original; méditation nocturne dans une maison silencieuse, près d’un enfant endormi. |
| 8 | “I see the lights of the village / Gleam through the rain and the mist” | Henry Wadsworth Longfellow / voix poétique | “The Day Is Done”, *The Complete Poetical Works*, éd. Household, 1902, section “Songs” | [Édition numérisée](https://www.gutenberg.org/files/1365/1365-h/1365-h.htm) | Anglais original; la pluie, la brume et les lumières encadrent une mélancolie que le poème cherche à apaiser par la lecture. |
| 9 | “Ah, distinctly I remember it was in the bleak December” | Edgar Allan Poe / narrateur poétique | “The Raven”, *The Raven and Other Poems*, 1845, strophe II | [Édition de 1845](https://en.wikisource.org/wiki/The_Raven_and_Other_Poems/The_Raven) | Anglais original; voix d’un homme endeuillé par Lenore; garder le contexte de chagrin et de récit fantastique. |
| 10 | “All night long in the dark and wet, / A man goes riding by.” | Robert Louis Stevenson / voix poétique | “Windy Nights”, *A Child’s Garden of Verses*, IX, 1885 | [Édition de 1885](https://en.wikisource.org/wiki/A_Child%27s_Garden_of_Verses/Windy_Nights) | Anglais original; poème d’enfance rythmé par le vent, la pluie et le passage répété d’un cavalier. |
| 11 | “No dawn—no dusk—no proper time of day—” | Thomas Hood / voix poétique | “November”, *The Poetical Works of Thomas Hood*, éd. 1844, p. 332 | [Fac-similé, p. 332](https://en.wikisource.org/wiki/Page:The_poetical_works_of_Thomas_Hood_..._Two_volumes_in_one_(IA_poeticalworksoft02hood).pdf/368) | Anglais original; caricature du brouillard londonien en novembre, avec un ton comique plutôt que mélancolique. |
| 12 | “When Frost was spectre-gray, / And Winter’s dregs made desolate / The weakening eye of day.” | Thomas Hardy / voix poétique | “The Darkling Thrush”, strophe I | [Texte du poème](https://en.wikisource.org/wiki/The_Darkling_Thrush) | Anglais original; le poème s’ouvre sur un crépuscule de fin de siècle puis fait entendre un chant porteur d’un espoir que le narrateur ne comprend pas. |

La citation de Coleridge « Mild Splendor of the various-vested Night! » est mise en réserve pour éviter deux extraits du même auteur dans cette sélection. Elle peut revenir si une autre candidate anglaise est écartée.

## Mémoire, paix et réconciliation — réserve française (12 candidates sourcées)

| # | Citation exacte proposée | Auteur / voix | Œuvre et locator | Source primaire | État et note de contexte / droits |
| ---: | --- | --- | --- | --- | --- |
| 1 | « Or, la loi de Dieu, ce n’est pas la guerre, c’est la paix. » | Victor Hugo / orateur | Discours d’ouverture du Congrès de la paix, 21 août 1849 | [Discours](https://fr.wikisource.org/wiki/Congr%C3%A8s_de_la_Paix_1849_DISCOURS_D%27OUVERTURE) | **Sourcée**; le discours développe explicitement une conception religieuse de la paix. |
| 2 | « Ma vengeance, c’est la fraternité ! » | Victor Hugo / orateur | Discours à l’Assemblée nationale, 1er mars 1871 | [Discours](https://fr.wikisource.org/wiki/Pendant_l%E2%80%99Exil_Tome_V_Discours_sur_la_guerre) | **Sourcée**; conserver le contexte politique du discours. |
| 3 | « Il aimait le vaincu sans haïr le vainqueur » | Victor Hugo / voix poétique | *L’Année terrible*, « Pendant que la mer gronde et que les vagues roulent », 1872 | [Texte de 1872](https://fr.wikisource.org/wiki/L%E2%80%99Ann%C3%A9e_terrible/Pendant_que_la_mer_gronde_et_que_les_vagues_roulent) | **Sourcée**; domaine public en France. |
| 4 | « La France veut la paix, sans humiliation et sans faiblesse, mais elle veut la paix. » | Jean Jaurès / journaliste | « Paix et revanche », texte du 31 décembre 1887, republié en 1899 | [*Action socialiste*](https://fr.wikisource.org/wiki/Action_socialiste/Paix_et_revanche) | **Sourcée**; la suite situe la phrase dans le débat sur la revanche et la politique française. |
| 5 | « la seule promesse d’une possibilité de paix ou d’un rétablissement de la paix » | Jean Jaurès / orateur | Discours de Lyon-Vaise, 25 juillet 1914; transcription publiée en 1919 | [Transcription de 1919](https://fr.wikisource.org/wiki/Jean_Jaur%C3%A8s_et_les_causes_de_la_guerre/Le_discours) | **Sourcée**; Jaurès appelle le mouvement socialiste international à unir les travailleurs européens pour éviter une guerre imminente; garder la date de prononcé distincte de celle de la transcription. |
| 6 | « Des fleurs s’élèvent où naguère / S’entre-tuaient les combattants » | Sully Prudhomme / voix poétique | « Fleurs de sang », *Poésies 1866–1872*, éd. 1872, p. 219 | [Œuvres poétiques](https://fr.wikisource.org/wiki/%C5%92uvres_de_Sully_Prudhomme/Po%C3%A9sies_1866-1872/Texte_entier) | **Sourcée**; ton de deuil; garder une mise en image sobre. |
| 7 | « L’humanité et la civilisation demandent impérieusement une œuvre comme celle qui est indiquée ici » | Henry Dunant / auteur | *Un souvenir de Solférino*, 1862, p. 36 de l’édition numérisée, conclusion | [Fac-similé, Gallica — BnF](https://gallica.bnf.fr/ark:/12148/bpt6k1060754.pdf) | **Sourcée**; la proposition vise la création de sociétés internationales de secours aux soldats blessés et s’inscrit dans l’appel à agir avant les guerres. |
| 8 | « Que l’homme approche l’homme, et qu’il boive aux deux bords ! » | Alphonse de Lamartine / voix poétique | « La Marseillaise de la Paix », *Œuvres complètes*, tome V, p. 95–100, vers 219–222 | [Poème](https://fr.wikisource.org/wiki/La_Marseillaise_de_la_paix) | **Sourcée**; le Rhin est présenté comme un lien entre peuples français et allemands; le poème répond aux tensions nationales. |
| 9 | « préférer la vie de vos peuples à une fausse gloire » | Fénelon / auteur d’une lettre à Louis XIV | Lettre à Louis XIV, témoin imprimé de 1825 | [Lettre](https://fr.wikisource.org/wiki/Lettre_de_F%C3%A9nelon_%C3%A0_Louis_XIV) | **Sourcée**; respecter la voix épistolaire et le contexte de critique de la guerre. |
| 10 | « terminer sans guerre tous leurs différends futurs » | Abbé de Saint-Pierre / auteur | *Projet pour rendre la paix perpétuelle en Europe*, 1713, préface, § 3 | [Édition numérique de Caen](https://www.unicaen.fr/puc/sources/castel/doc/Paix/paix_1713_1.xml.html) | **Sourcée**; vérifier la coupe au moment de la mise en forme. |
| 11 | « j’entrevois distinctement la fraternité universelle » | Victor Hugo / orateur | « L’Avenir de l’Europe », *Actes et paroles*, vol. VI, 20 septembre 1872, p. 61 | [Actes et paroles, volume VI](https://fr.wikisource.org/wiki/Actes_et_paroles%2C_volume_6) | **Sourcée**; auteur répété dans cette réserve, choix éditorial à faire sans prétendre dédupliquer les auteurs. |
| 12 | « dans cet immense et commun amour de la paix, les budgets de la guerre s’enflent et montent partout d’année en année » | Jean Jaurès / orateur | « L’Armée démocratique », séance de la Chambre des députés du 7 mars 1895, *Action socialiste*, 1899, p. 396–423 | [Discours retranscrit](https://fr.wikisource.org/wiki/Action_socialiste/L%E2%80%99arm%C3%A9e_d%C3%A9mocratique) | **Sourcée**; extrait critique de l’écart entre le désir de paix et la course aux armements. |

L’extrait de Rousseau « les hommes s’unir & s’aimer » et le fragment de Lamartine « La fraternité n’en a pas ! » sont retirés des contenus publiables : isolés, ils restent obscurs. La nouvelle citation de Lamartine conserve le même poème, avec un passage plus explicite sur le rapprochement des peuples.

## Mémoire, paix et réconciliation — réserve anglaise (12 candidates sourcées)

Ces textes sont en anglais original; ils ne sont pas comptés dans la réserve française. La cible de travail d’environ 12 contenus anglais est atteinte; les candidates restent à valider éditorialement.

| # | Citation exacte proposée | Auteur / voix | Œuvre et locator | Source primaire | Note |
| ---: | --- | --- | --- | --- | --- |
| 1 | “With malice toward none, with charity for all” | Abraham Lincoln / président et orateur | Second Inaugural Address, 4 March 1865, concluding paragraph | [Manuscrit numérisé, Library of Congress](https://www.loc.gov/resource/mal.4361300/?st=text) | Anglais original; citation recoupée avec la [transcription Yale Avalon](https://avalon.law.yale.edu/19th_century/lincoln2.asp); la suite appelle à panser les blessures de la nation et à bâtir une paix juste et durable. |
| 2 | “shall never be sought except by pacific means” | États signataires / traité international | General Treaty for the Renunciation of War, article II, signé à Paris le 27 août 1928 | [Texte du traité, Yale Avalon](https://avalon.law.yale.edu/20th_century/kbpact.asp) | Anglais original; clause qui engage les parties à régler leurs différends par des moyens pacifiques. |
| 3 | “We are not enemies, but friends. We must not be enemies.” | Abraham Lincoln / président et orateur | First Inaugural Address, 4 March 1861, closing paragraph | [Transcription Yale Avalon](https://avalon.law.yale.edu/19th_century/lincoln1.asp) | Anglais original; conclusion de son discours inaugural, alors que la sécession menace l’Union; les phrases suivantes invoquent les « mystic chords of memory » et les « better angels » pour appeler à renouer les liens nationaux. |
| 4 | “Any war or threat of war, whether immediately affecting any of the Members of the League or not, is hereby declared a matter of concern to the whole League” | League of Nations / pacte international | Covenant of the League of Nations, article 11, adopté en 1919 | [Texte du Covenant, Yale Avalon](https://avalon.law.yale.edu/20th_century/leagcov.asp) | Anglais original; disposition institutionnelle de prévention des conflits, adoptée après la Première Guerre mondiale. |
| 5 | “That since wars begin in the minds of men, it is in the minds of men that the defences of peace must be constructed” | États membres de l’UNESCO / déclaration collective | Préambule de la Constitution de l’UNESCO, adoptée en 1945 | [Constitution de l’UNESCO](https://www.unesco.org/en/legal-affairs/constitution) | Anglais original; phrase fondatrice du préambule sur l’éducation, la culture et la paix. |
| 6 | “to save succeeding generations from the scourge of war, which twice in our lifetime has brought untold sorrow to mankind” | Nations Unies / déclaration collective | Préambule de la Charte des Nations Unies, 1945 | [Charte, texte intégral de l’ONU](https://www.un.org/en/about-us/un-charter/full-text) | Anglais original; fait explicitement référence aux deux guerres mondiales vécues par les signataires. |
| 7 | “For my enemy is dead, a man divine as myself is dead” | Walt Whitman / voix poétique | “Reconciliation”, *Drum-Taps*, repris dans *Leaves of Grass*, éd. 1882 | [Édition de 1882](https://en.wikisource.org/wiki/Leaves_of_Grass_(1882)/Drum-Taps/Reconciliation) | Anglais original; poème de la guerre de Sécession qui conduit le locuteur au cercueil de son ennemi et reconnaît leur humanité commune. |
| 8 | “Observe good faith and justice towards all nations; cultivate peace and harmony with all.” | George Washington / président et auteur | Farewell Address, 19 septembre 1796, paragraphe sur les relations extérieures | [Discours, Yale Avalon](https://avalon.law.yale.edu/18th_century/washing.asp) | Anglais original; conseil de politique étrangère dans un discours de départ; garder le cadre historique de la jeune république. |
| 9 | “It is that the world be made fit and safe to live in; and particularly that it be made safe for every peace-loving nation” | Woodrow Wilson / président et orateur | Address to Congress on the Fourteen Points, 8 janvier 1918, passage sur les buts de guerre | [Discours, Yale Avalon](https://avalon.law.yale.edu/20th_century/wilson14.asp) | Anglais original; déclaration formulée pendant la Première Guerre mondiale pour exposer les objectifs américains de paix. |
| 10 | “All human beings are born free and equal in dignity and rights” | Nations Unies / déclaration collective | Universal Declaration of Human Rights, article 1, 1948 | [Texte officiel de l’ONU](https://www.un.org/en/about-us/universal-declaration-of-human-rights) | Anglais original; principe adopté après la Seconde Guerre mondiale et complémentaire du cadre de mémoire et de reconstruction. |
| 11 | “You shoot a fellow down / You’d treat if met where any bar is” | Thomas Hardy / narrateur poétique, soldat | “The Man He Killed”, dernière strophe | [Texte du poème](https://en.wikisource.org/wiki/The_Man_He_Killed) | Anglais original; ironie d’un soldat qui reconnaît qu’il aurait aidé l’homme tué s’ils s’étaient rencontrés en temps de paix. |
| 12 | “Peace hath her victories / No less renown’d than war.” | John Milton / voix poétique | “Sonnet XVI: To the Lord General Cromwell”, composé en mai 1652, vers 10–11; imprimé en 1694 | [Texte et contexte, University of Toronto](https://rpo.library.utoronto.ca/content/sonnet-xvi-lord-general-cromwell) | Anglais original; le sonnet salue les victoires militaires de Cromwell puis appelle à poursuivre la lutte pour la liberté de conscience. Ne pas présenter l’extrait comme un pacifisme sans nuance. |

## Tolérance, voix plurielles — réserve française (12 candidates sourcées)

| # | Citation exacte proposée | Auteur / voix | Œuvre et locator | Source primaire | État et note de contexte / droits |
| ---: | --- | --- | --- | --- | --- |
| 1 | « chaque homme porte la forme entiere de l’humaine condition » | Michel de Montaigne / auteur | *Essais*, III, 2, fac-similé de l’exemplaire de Bordeaux, p. 15 | [Fac-similé](https://fr.wikisource.org/wiki/Page:Montaigne_-_Essais,_%C3%89d_de_Bordeaux,_3.djvu/15) | **Sourcée**; orthographe de l’édition conservée. |
| 2 | « La libre communication des pensées et des opinions » | Déclaration des droits de l’homme et du citoyen / texte collectif | DDHC, article 11, 1789 | [Légifrance, article 11](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006527437) | **Sourcée**; l’article complet prévoit la responsabilité en cas d’abus définis par la loi. |
| 3 | « Nul ne doit être inquiété pour ses opinions » | Déclaration des droits de l’homme et du citoyen / texte collectif | DDHC, article 10, 1789 | [Légifrance, article 10](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006527436) | **Sourcée**; la qualification relative à l’ordre public est indissociable du texte complet. |
| 4 | « chacun a le droit de penser ce qu’il veut » | Baruch Spinoza / traduction d’Émile Saisset | *Traité théologico-politique*, chapitre XX, traduction française de 1861 | [Chapitre XX](https://fr.wikisource.org/wiki/Trait%C3%A9_th%C3%A9ologico-politique/Chapitre_20) | **Sourcée**; créditer le traducteur et vérifier l’étendue exacte de la phrase dans cette traduction. |
| 5 | « La Femme naît libre et demeure égale à l’homme en droits » | Olympe de Gouges / autrice | *Déclaration des droits de la femme et de la citoyenne*, article I, 1791 | [Déclaration](https://fr.wikisource.org/wiki/D%C3%A9claration_des_droits_de_la_femme_et_de_la_citoyenne) | **Sourcée**; l’article poursuit sur les distinctions fondées sur l’utilité commune. |
| 6 | « un des droits les plus précieux de la femme » | Olympe de Gouges / autrice | *Déclaration des droits de la femme et de la citoyenne*, article XI, 1791 | [Déclaration, article XI](https://fr.wikisource.org/wiki/D%C3%A9claration_des_droits_de_la_femme_et_de_la_citoyenne) | **Sourcée**; l’article traite aussi de la liberté d’expression des femmes et de la filiation; le fragment doit rester contextualisé. |
| 7 | « ce n’est pas même la tolérance que je réclame, c’est la liberté » | Rabaut de Saint-Étienne / orateur | *Discours sur la liberté des opinions religieuses*, 1789, fac-similé p. 10 | [Fac-similé](https://fr.wikisource.org/wiki/Page:Discours_sur_la_libert%C3%A9_des_opinions_religieuses_(Rabaut_Saint-Etienne,_1789).djvu/10) | **Sourcée**; conserver la formulation complète de la proposition. |
| 8 | « L’erreur, Messieurs, n’est point un crime » | Rabaut de Saint-Étienne / orateur | Même discours, fac-similé p. 10 | [Fac-similé](https://fr.wikisource.org/wiki/Page:Discours_sur_la_libert%C3%A9_des_opinions_religieuses_(Rabaut_Saint-Etienne,_1789).djvu/10) | **Sourcée**; relire la phrase autour de l’extrait pour préserver son argument. |
| 9 | « Comme la diversité de la nature est infinie, la diversité de l’imitation peut l’être de même » | Louis de Jaucourt / encyclopédiste | *Encyclopédie*, 1re éd., tome IV, 1751, « Diversité (Peinture) » | [Article de l’Encyclopédie](https://fr.wikisource.org/wiki/L’Encyclop%C3%A9die/1re_%C3%A9dition/DIVERSIT%C3%89) | **Sourcée**; métaphore de diversité dans le contexte de la peinture. |
| 10 | « les femmes ayant ces mêmes qualités, ont nécessairement des droits égaux » | Nicolas de Condorcet / auteur | « Sur l’admission des femmes au droit de cité », 1790 | [Texte](https://fr.wikisource.org/wiki/Sur_l%E2%80%99admission_des_femmes_au_droit_de_cit%C3%A9) | **Sourcée**; citation politique sur l’égalité des droits. |
| 11 | « la diversité d’opinions n’est pas un mal mais un bien » | John Stuart Mill / traduction de Charles Brook Dupont-White | *De la liberté*, chapitre III, traduction française de 1860 | [Texte intégral](https://fr.wikisource.org/wiki/De_la_libert%C3%A9/Texte_entier) | **Sourcée**; créditer le traducteur et contextualiser l’extrait dans son argument. |
| 12 | « Quelle plus grande leçon de nous tolérer dans nos disputes, & de nous humilier dans tout ce que nous n’entendons pas ? » | Voltaire / auteur | *Traité sur la tolérance*, éd. 1763, chapitre XIII | [Édition de 1763](https://fr.wikisource.org/wiki/Trait%C3%A9_sur_la_tol%C3%A9rance/%C3%89dition_1763/Texte_entier) | **Sourcée**; conclusion d’un passage sur les divergences des premiers chrétiens; graphie et esperluette du témoin conservées. |

La citation de Montesquieu « Comment peut-on être Persan ? » est retirée du lot : elle ne convient pas au contexte de cette campagne.

## Tolérance, voix plurielles — réserve anglaise (12 candidates sourcées)

Ces textes sont en anglais original; ils ne sont pas comptés dans la réserve française. La cible reste d’environ 12 contenus anglais pour ce thème.

| # | Citation exacte proposée | Auteur / voix | Œuvre et locator | Source primaire | Note |
| ---: | --- | --- | --- | --- | --- |
| 1 | “the right of the people peaceably to assemble, and to petition the Government for a redress of grievances” | United States Congress / texte constitutionnel | First Amendment, ratifié en 1791; transcription officielle du Bill of Rights | [National Archives, transcription](https://www.archives.gov/founding-docs/bill-of-rights-transcript) | Anglais original; fragment de l’article troisième de la transcription, qui inclut aussi les libertés de religion, de parole et de presse. |
| 2 | “Everyone has the right to freedom of opinion and expression” | Nations Unies / déclaration collective | Universal Declaration of Human Rights, article 19, 1948 | [Texte officiel de l’ONU](https://www.un.org/en/about-us/universal-declaration-of-human-rights) | Anglais original; l’article inclut aussi le droit de chercher, recevoir et communiquer des informations sans considération de frontières. |
| 3 | “Give me the liberty to know, to utter, and to argue freely according to conscience, above all liberties.” | John Milton / auteur | *Areopagitica*, 1644, passage contre la censure préalable | [Texte de 1644](https://en.wikisource.org/wiki/Areopagitica_(1644)) | Anglais original; l’argument porte sur la liberté de publier sans autorisation préalable. |
| 4 | “He who knows only his own side of the case, knows little of that.” | John Stuart Mill / auteur | *On Liberty*, 1859, chapitre II, « Of the Liberty of Thought and Discussion » | [Chapitre II](https://en.wikisource.org/wiki/On_Liberty/Chapter_2) | Anglais original; le paragraphe défend l’écoute des arguments opposés pour éprouver une opinion. |
| 5 | “free to profess . . . their opinions in matters of Religion” | Virginia General Assembly / loi | Act for Establishing Religious Freedom, 16 January 1786, clause de liberté de conscience | [Dossier et document, Library of Virginia](https://www.lva.virginia.gov/collections/educator-resources/dbva/items/show/180) | Anglais original; le dossier de l’archive donne le contexte de la loi et cite l’extrait du texte adopté. |
| 6 | “All possess alike liberty of conscience and immunities of citizenship” | George Washington / lettre présidentielle | Lettre à la Hebrew Congregation de Newport, 18 août 1790 | [Lettre, Founders Online — National Archives](https://founders.archives.gov/documents/Washington/05-06-02-0135) | Anglais original; réponse à une congrégation juive; garder le contexte de liberté civique et les limites de l’application historique de ces droits. |
| 7 | “I do not wish them to have power over men; but over themselves.” | Mary Wollstonecraft / autrice | *A Vindication of the Rights of Woman*, 1792, chapitre IV | [Texte de 1792, Project Gutenberg](https://www.gutenberg.org/cache/epub/3420/pg3420-images.html) | Anglais original; argument pour l’autonomie et l’éducation des femmes; la phrase répond à une citation de Rousseau dans le paragraphe. |
| 8 | “It would, methinks, become all men to maintain peace, and the common offices of humanity and friendship, in the diversity of opinions” | John Locke / auteur | *An Essay Concerning Humane Understanding*, 1690, livre IV, chapitre XVI | [Texte, livre IV, chapitre XVI](https://en.wikisource.org/wiki/An_Essay_Concerning_Humane_Understanding/Book_IV/Chapter_16) | Anglais original; le passage invite à maintenir la paix et l’amitié malgré les désaccords; préserver l’orthographe historique de l’édition. |
| 9 | “But it does me no injury for my neighbor to say there are twenty gods, or no God.” | Thomas Jefferson / auteur | *Notes on the State of Virginia*, Query XVII, publié en anglais en 1785 | [Édition numérisée des écrits de Jefferson](https://www.gutenberg.org/files/56313/56313-h/56313-h.htm) | Anglais original; argument sur les limites des pouvoirs civils en matière de conscience et de religion. |
| 10 | “This freedom arises from that multiplicity of sects, which pervades America” | James Madison / délégué à la Convention de ratification de Virginie | Intervention sur la religion, 12 juin 1788 | [Transcription, The Founders’ Constitution](https://press-pubs.uchicago.edu/founders/documents/amendI_religions49.html) | Anglais original; le paragraphe soutient que la pluralité religieuse protège contre la persécution d’une minorité par une majorité. |
| 11 | “that all men and women are created equal” | Elizabeth Cady Stanton / autrice et oratrice | “Declaration of Sentiments”, Seneca Falls, 19–20 juillet 1848 | [Document et transcription, New-York Historical Society](https://wams.nyhistory.org/primary-source/declaration-of-rights-and-sentiments/) | Anglais original; déclaration collective pour l’égalité des droits des femmes; conserver le contexte de la convention. |
| 12 | “my country is the world, and my religion is to do good” | Thomas Paine / auteur | *Rights of Man*, Part II, Chapter V, 1792 | [Texte de *Rights of Man*, Pepperdine University](https://publicpolicy.pepperdine.edu/academics/research/faculty-research/french-revolution/tpaine.htm) | Anglais original; phrase cosmopolite dans un chapitre sur les moyens d’améliorer la condition de l’Europe; ne pas la présenter comme un traité religieux. |

La seconde citation de James Madison, tirée de “Memorial and Remonstrance against Religious Assessments”, est mise en réserve; la citation de Madison sur la « multiplicity of sects » est retenue dans cette sélection.

## Citation à la une et accès aux collections

La citation à la une suit un ordre fixe. Pour chaque date, la page affiche la candidate française ou anglaise qui correspond à la langue du lecteur. Le reste des citations demeure accessible dans la collection du thème; la page peut en montrer quelques-unes puis proposer « Voir les 12 ». Après leur fenêtre d’activité, Mémoire et Tolérance restent accessibles dans les archives. Les numéros ci-dessous renvoient aux réserves FR et EN.

| Date | Thème à la une | Candidate FR | Candidate EN |
| --- | --- | ---: | ---: |
| 3 novembre | Brumes de la nuit | 3 | 6 |
| 4 novembre | Brumes de la nuit | 2 | 5 |
| 5 novembre | Brumes de la nuit | 9 | 8 |
| 6 novembre | Brumes de la nuit | 8 | 2 |
| 7 novembre | Brumes de la nuit | 10 | 4 |
| 8 novembre | Brumes de la nuit | 11 | 10 |
| 9 novembre | Brumes de la nuit | 4 | 11 |
| 10 novembre | Brumes de la nuit | 5 | 1 |
| 11 novembre | Mémoire, paix et réconciliation | 1 | 8 |
| 12 novembre | Brumes de la nuit | 6 | 7 |
| 13 novembre | Brumes de la nuit | 1 | 3 |
| 14 novembre | Brumes de la nuit | 12 | 9 |
| 15 novembre | Brumes de la nuit | 7 | 12 |
| 16 novembre | Tolérance, voix plurielles | 1 | 8 |

Cette rotation utilise une fois chacune des 12 candidates de Brumes par langue. Le 11 et le 16 novembre, les thèmes ponctuels ont chacun une citation à la une par langue; leurs 11 autres candidates restent dans leurs pages d’archive. La sélection conserve un seul extrait de Coleridge dans Brumes anglais (Frost at Midnight) et un seul de Madison dans Tolérance anglais (multiplicity of sects); le fragment elliptique de Lamartine est remplacé par un vers plus explicite du même poème.

### Contextes lecteur proposés pour les citations à la une

Ces textes sont des brouillons localisés à afficher près de la citation, distincts de la note de source. Pour une voix poétique, ils décrivent le poème sans prétendre que l’auteur parle de sa propre vie.

| Date | Contexte français | Reader context (English) |
| --- | --- | --- |
| 3 novembre | Dans « Le Soir », le narrateur contemple la nuit depuis des rochers déserts. Le rayon lunaire devient une présence à laquelle il demande consolation et paix. | Walking by the sea with a young girl, Wordsworth turns the quiet evening into a reflection on nature’s sacred presence; the child’s lack of solemn thought does not make her less divine. |
| 4 novembre | Sous la lune, le poète observe l’étang et ses reflets, puis invite sa bien-aimée à rêver avec lui. | Keats addresses autumn as the sun’s close companion. The opening celebrates mist, ripening fruit and the season’s abundance. |
| 5 novembre | Le narrateur marche seul près d’un étang après le coucher du soleil; la brume et les oiseaux font écho à la blessure qu’il porte. | As evening falls, the speaker feels an unnamed sadness and asks for music and poetry to bring comfort and quiet the day’s cares. |
| 6 novembre | La voix du poème attend le soir pour retrouver un être aimé; l’ombre apporte à la fois du repos et l’impatience de la rencontre. | The speaker compares a woman’s beauty to a clear, starry night, praising the balance of dark and light in her face. It is a portrait, not a night-time journey. |
| 7 novembre | Baudelaire transforme le soir en une valse mélancolique où fleurs, parfums, sons et violon reviennent comme un refrain. | The speaker addresses a beloved as the garden and lake settle into night; the final stanzas turn the scene into an intimate love invitation. |
| 8 novembre | Le poète s’adresse à sa Douleur tandis que le soir descend sur la ville; il s’éloigne de la foule pour se tourner vers les souvenirs et les regrets. | A childlike speaker imagines a rider crossing a wet, windy night and wonders where he is going; the repeated rhythm gives the poem a nursery-rhyme feel. |
| 9 novembre | Le poète se souvient d’une traversée silencieuse en barque et de la voix aimée qui demande au temps de s’arrêter; le souvenir est marqué par la perte. | Hood turns November’s dimness into a comic litany: sun, moon, dawn and dusk all seem to disappear. |
| 10 novembre | Le narrateur revient à une veillée de son enfance : un enfant vêtu de noir, qui lui ressemble, vient s’asseoir près de lui. | Shelley personifies Night as a beloved presence summoned from the misty East and asks it to travel over the world, bringing its dreams. |
| 11 novembre | Au Congrès de la paix de 1849, Hugo présente la paix comme la loi de Dieu et l’horizon vers lequel l’humanité doit avancer. | In his Farewell Address, Washington gives the young republic guidance on foreign relations and urges justice, peace and harmony with all nations. |
| 12 novembre | Le poème invite une personne aimée à marcher sous les étoiles et à transformer les tourments de la vie en amour. | At midnight, Coleridge sits awake beside a dying fire while frost settles outside and his infant sleeps nearby; he hopes the child will grow up close to nature. |
| 13 novembre | Verlaine fait passer le poème des violons de l’automne au souvenir des jours anciens, puis à une voix emportée comme une feuille morte. | The speaker watches night close in as wind and snow intensify; despite feeling bound in place, the voice insists it cannot leave. |
| 14 novembre | La lumière qui baisse et les bois obscurs font écho à la douleur du poète et à sa conscience de la mortalité. | Grieving Lenore, the narrator reads alone on a bleak December night; a tapping at his door begins the encounter with the raven. |
| 15 novembre | Ce vers d’Anna de Noailles condense une sensation du soir : le silence y est évoqué comme une présence presque perceptible. | Hardy’s speaker watches the old century’s winter dusk and hears a thrush sing; the poem leaves open whether the song carries hope. |
| 16 novembre | Dans « Du repentir », Montaigne réfléchit à la diversité de l’expérience humaine; ce vers invite à reconnaître une condition commune, plutôt qu’à énoncer directement un principe moderne de tolérance. | In a chapter on degrees of belief, Locke argues that disagreement is unavoidable and urges people to preserve peace, humanity and friendship across differences of opinion. |

### Contextes proposés pour les citations conservées en archive

Ces notes concernent les 11 autres citations de chaque thème spécial. Elles situent l’extrait sans en faire une citation de une.

#### Mémoire, paix et réconciliation — français

| Candidate | Contexte lecteur proposé |
| ---: | --- |
| 2 | Dans son discours de 1871 sur la guerre, Hugo retourne l’idée de vengeance : il appelle à répondre à la haine par la fraternité, dans le contexte de la défaite et de ses suites politiques. |
| 3 | Dans *L’Année terrible*, Hugo évoque un homme capable de compassion pour le vaincu sans haïr le vainqueur; le poème oppose cette attitude aux réflexes de revanche. |
| 4 | Dans « Paix et revanche », Jaurès intervient dans le débat français né de la défaite de 1870 et de l’idée de revanche; il défend une paix qui n’humilie pas la France. |
| 5 | Voir le contexte de la citation à la une du 11 novembre : le discours de 1914 appelle les travailleurs européens à agir contre une guerre imminente. |
| 6 | Dans « Fleurs de sang », le paysage garde la trace des combats; les fleurs qui repoussent ne font pas disparaître le deuil des soldats tués. |
| 7 | À partir de Solférino, Dunant propose des sociétés de secours organisées à l’avance pour soigner les blessés de toutes les armées. |
| 8 | Dans sa Marseillaise de la Paix, Lamartine imagine le Rhin reliant les peuples français et allemand et les invite à se rapprocher sur ses deux rives. |
| 9 | Dans cette lettre adressée à Louis XIV, Fénelon met en garde le roi contre le coût humain et politique de la guerre et lui recommande de préférer la vie de ses peuples à la gloire. |
| 10 | Le projet de paix perpétuelle de l’abbé de Saint-Pierre propose une organisation européenne où les États règlent leurs différends par accord plutôt que par la guerre. |
| 11 | Dans « L’Avenir de l’Europe », prononcé après la guerre franco-prussienne, Hugo défend un avenir européen fondé sur le rapprochement et la fraternité entre peuples. |
| 12 | À la Chambre des députés en 1895, Jaurès dénonce le contraste entre le désir de paix exprimé par les peuples et la hausse des budgets militaires. |

#### Mémoire, paix et réconciliation — anglais

| Candidate | Reader context (draft) |
| ---: | --- |
| 1 | In his second inaugural address near the end of the Civil War, Lincoln asks the country to rebuild without hatred and to care for those harmed by the conflict. |
| 2 | The 1928 Kellogg–Briand Pact commits its signatories to reject war as an instrument of national policy and to settle disputes peacefully. |
| 3 | In his first inaugural address, Lincoln speaks as several Southern states are leaving the Union and urges Americans to preserve their national bonds without bloodshed. |
| 4 | Article 11 of the League of Nations Covenant makes threats of war a concern for the whole League, not only for the states directly involved. |
| 5 | The UNESCO Constitution, adopted after the Second World War, places the work of building peace in education and in people’s minds. |
| 6 | The UN Charter’s preamble looks back on two world wars and presents the organization as a promise to protect future generations from war. |
| 7 | In “Reconciliation,” Whitman approaches the body of a former enemy from the Civil War and recognizes a shared humanity in death. |
| 9 | Wilson presents his Fourteen Points to Congress during the First World War, describing a peace settlement intended to make the world safer for nations that seek peace. |
| 10 | Article 1 of the Universal Declaration of Human Rights sets out a postwar principle of equal dignity and rights for every person. |
| 11 | Hardy’s speaker imagines a soldier explaining that the man he killed might have been his drinking companion in another circumstance; the poem exposes the absurdity of war. |
| 12 | Addressing Cromwell after military victories, Milton says peace can win honors too, then turns to the continuing struggle for religious liberty. |

#### Tolérance, voix plurielles — français

| Candidate | Contexte lecteur proposé |
| ---: | --- |
| 2 | L’article 11 de la Déclaration de 1789 protège la libre communication des pensées et des opinions, tout en prévoyant une responsabilité pour les abus définis par la loi. |
| 3 | L’article 10 de la Déclaration de 1789 protège les opinions, y compris religieuses, sous réserve qu’elles ne troublent pas l’ordre public établi par la loi. |
| 4 | Dans le chapitre XX du *Traité théologico-politique*, Spinoza défend la liberté de penser et de s’exprimer dans un État qui garantit la paix civile. |
| 5 | L’article I de la Déclaration des droits de la femme et de la citoyenne reprend la promesse d’égalité et la confronte aux distinctions faites entre les sexes. |
| 6 | À l’article XI, Olympe de Gouges défend la liberté d’expression des femmes et relie cette liberté à leur droit de faire connaître la vérité sur la filiation. |
| 7 | Dans son discours de 1789 sur les opinions religieuses, Rabaut de Saint-Étienne réclame la liberté de conscience plutôt qu’une tolérance accordée par une autorité. |
| 8 | Rabaut de Saint-Étienne soutient que l’erreur de croyance ne constitue pas un crime justifiant la contrainte ou la persécution. |
| 9 | Jaucourt parle de diversité dans la peinture : l’extrait est une réflexion esthétique sur les formes de l’imitation, pas une déclaration politique sur les croyances. |
| 10 | Dans son essai de 1790, Condorcet conteste l’exclusion des femmes de la citoyenneté et demande que leurs droits civiques soient reconnus. |
| 11 | Dans *De la liberté*, Mill soutient que des opinions différentes peuvent faire progresser la recherche de la vérité; la formulation française est celle du traducteur Dupont-White. |
| 12 | Au chapitre XIII du *Traité sur la tolérance*, Voltaire invite à l’humilité face aux désaccords religieux, en évoquant les disputes des premiers chrétiens. |

#### Tolérance, voix plurielles — anglais

| Candidate | Reader context (draft) |
| ---: | --- |
| 1 | The First Amendment protects several freedoms; this passage is its closing protection for peaceful assembly and petitions to the government. |
| 2 | Article 19 of the Universal Declaration of Human Rights protects freedom of opinion and expression, including the right to seek, receive and share information across borders. |
| 3 | In *Areopagitica*, Milton argues against prior licensing of books and makes the case for the freedom to seek and express truth. |
| 4 | In *On Liberty*, Mill argues that hearing opposing views helps people test their beliefs and understand the reasons behind them. |
| 5 | Virginia’s 1786 statute protects religious conscience from civil coercion; the ellipsis marks words omitted from the original clause. |
| 6 | In a 1790 letter to Newport’s Jewish congregation, Washington answers a request for assurances of religious liberty and civic inclusion; the historical limits of those promises should remain visible. |
| 7 | Wollstonecraft argues that women should have authority over their own lives, in a book that challenges assumptions about women’s education and dependence. |
| 9 | In *Notes on the State of Virginia*, Jefferson argues that a neighbor’s religious belief should not injure or govern another person’s civil rights. |
| 10 | During Virginia’s 1788 ratifying convention, Madison argues that the country’s many religious groups make it harder for one majority to persecute another. |
| 11 | The Declaration of Sentiments, written for the 1848 Seneca Falls convention, adapts the language of the Declaration of Independence to demand equal rights for women. |
| 12 | In *Rights of Man*, Paine expresses a cosmopolitan ideal of serving humanity; the phrase appears in a chapter on improving Europe, not as a claim about religious doctrine. |

## Plan de déduplication et prochaine passe éditoriale

1. Choisir les citations finales et conserver les repères, la voix, la ponctuation et les coupes de l’édition liée.
2. La comparaison au registre Halloween ne trouve aucun texte exact ni aucune œuvre commune. Coleridge est le seul auteur partagé avec Halloween, pour un poème différent. Les auteurs peuvent se répéter entre les nouvelles réserves : Victor Hugo et Olympe de Gouges apparaissent plusieurs fois; aucun quota d’auteurs distincts n’est revendiqué.
3. Maintenir des réserves séparées FR et EN. État de travail : les trois thèmes comptent chacun 12 candidates FR et 12 EN. La cible d’environ 12 est par thème et par langue; aucune ligne EN ne compte dans un lot FR, et inversement.
4. Les six réserves atteignent la cible d’environ 12 candidates sourcées par thème et par langue. L’ordre reste provisoire; les candidates retenues restent à valider avant publication.
5. Les lignes Spinoza/Saisset et Mill/Dupont-White sont des textes français en traduction : garder le crédit du traducteur et évaluer l’usage de chaque extrait dans son contexte informatif. Les citations courtes et les reproductions de fac-similés sont deux usages distincts; les images d’éditions ne sont pas couvertes automatiquement par l’analyse de la citation textuelle.
6. Les planches et cartes françaises restent la V1. Les visuels anglais ont été ajoutés séparément après validation des sélections; ils réutilisent les illustrations sans texte de la V1 et localisent citation, attribution, contexte, dates et métadonnées. Les PNG sont accompagnés de leurs SVG sources.
7. Pour la mise en œuvre, programmer une citation à la une par jour et par langue selon le tableau; garder toute la collection accessible, puis conserver Mémoire et Tolérance dans les archives après leurs journées spéciales.

## État des planches et cartes — brouillons à reprendre

La capture de référence `docs/design/dribbble/2026-10-25/desktop-board.png` correspond au template Dribbble `homepage.html` : il encadre une capture réelle de la page d’accueil Verbatims sous le thème choisi. Les planches françaises et anglaises actuellement dans ce dossier sont des études de contenu et de composition; elles ne reprennent pas ce template et ne sont pas les planches Dribbble finales. Les planches françaises sont donc elles aussi à refaire.

Pour obtenir les planches attendues, créer d’abord les trois thèmes comme brouillons locaux, avec leur version FR/EN, image, couleurs, texte d’accueil, filtres et citation à la une; prévisualiser chaque thème dans l’application dans les deux langues, capturer la page d’accueil, puis fournir cette capture à `homepage.html`. Le code sait prévisualiser un thème par son slug sans l’activer (`/?theme=<slug>`); aucun de ces brouillons ne doit être créé ou activé en production dans cette étape.

Les cartes sociales forment un livrable distinct et doivent utiliser le template social `theme.html`. Les cartes françaises présentes sont les V1 de campagne. Les cartes anglaises actuelles sont des études SVG; elles ne sont pas encore rendues avec le template partagé et devront être refaites ou re-rendues dans cette passe. Les citations à mettre en avant restent celles du calendrier ci-dessus : Wordsworth le 3, Washington le 11 et Locke le 16 novembre.

| Thème | Étude de planche anglaise (à remplacer) | Étude de carte anglaise (à re-rendre) |
| --- | --- | --- |
| Mists of the Night | `brumes-de-la-nuit-en.png` et `.svg` | `brumes-de-la-nuit-social-en.png` et `.svg` |
| Memory, Peace & Reconciliation | `memoire-paix-reconciliation-en.png` et `.svg` | `memoire-paix-reconciliation-social-en.png` et `.svg` |
| Tolerance, Many Voices | `tolerance-voix-plurielles-en.png` et `.svg` | `tolerance-voix-plurielles-social-en.png` et `.svg` |

Les fichiers `.html` ouvrent les SVG sources à taille fixe; les `.content.json` conservent les métadonnées des études sociales. Les illustrations existantes restent une première version commune aux deux langues; de nouvelles illustrations pourront les remplacer dans une prochaine passe sans écraser les fichiers actuels.

## Aperçus locaux actuels

### Reproductions d’œuvres candidates — V2 à créer

Les illustrations générées des premières maquettes restent la V1. Les reproductions ci-dessous sont des sources visuelles réelles pour une future déclinaison des thèmes; elles ne remplacent pas les fichiers V1 et ne sont pas encore intégrées aux planches finales. Les notices de droits ci-dessous sont à conserver avec tout nouvel export.

| Thème | Œuvre et adéquation éditoriale | Reproduction locale et crédit | Source et droits |
| --- | --- | --- | --- |
| Brumes de la nuit | Caspar David Friedrich, *Mondaufgang am Meer* (*Moonrise over the Sea*), 1822, Alte Nationalgalerie. Le musée décrit les reflets lunaires, les trois personnes réunies au bord de l’eau et les navires au retour; l’œuvre fut conçue comme un paysage du soir porteur d’espoir. | [`brumes-source-artwork.jpg`](brumes-source-artwork.jpg). Reproduction créditée à Zeno.org, ID 20004019253, via Wikimedia Commons. | [Notice des Staatliche Museen zu Berlin](https://search.smb.museum/object/obj-959550?doc_types=Bild&materials=%C3%96l+auf+Leinwand&page=15) — la reproduction du musée est indiquée Public Domain Mark 1.0; [fiche de la reproduction utilisée](https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_031.jpg) — fichier marqué domaine public. |
| Mémoire, paix et réconciliation | Edward Hicks, *Peaceable Kingdom*, vers 1834, National Gallery of Art, accession 1980.62.15. La scène associe animaux en paix et rencontre entre colons quakers et Lenapes. La présenter comme une vision historique de coexistence, avec son cadrage colonial, pas comme un récit neutre de réconciliation accomplie. | [`memoire-source-artwork.jpg`](memoire-source-artwork.jpg). Média officiel téléchargé depuis la National Gallery of Art. | [Notice et politique Open Access de la NGA](https://www.nga.gov/artworks/59908-peaceable-kingdom) — le média de cet objet est indiqué libre et dans le domaine public. |
| Tolérance, voix plurielles | Anicet-Charles-Gabriel Lemonnier, *Lecture de la tragédie « L’Orphelin de la Chine » de Voltaire dans le salon de Madame Geoffrin*, 1812. La lecture à voix haute et l’assemblée de penseurs donnent une entrée visuelle à l’échange d’idées. Il s’agit d’une reconstitution peinte en 1812 d’une scène située en 1755. | [`tolerance-source-artwork.jpg`](tolerance-source-artwork.jpg). Reproduction de Wikimedia Commons, fichier *Salon de Madame Geoffrin.jpg*. | [Fiche de la reproduction et licence](https://commons.wikimedia.org/wiki/File:Salon_de_Madame_Geoffrin.jpg) — Public Domain Mark 1.0; [notice POP/Joconde](https://pop.culture.gouv.fr/notice/joconde/50110002799) pour l’identification de l’œuvre et la scène représentée. |

La scène de Lemonnier évoque un salon lettré et une lecture, mais ne constitue pas à elle seule une illustration littérale des voix plurielles contemporaines. Garder cette réserve de sens dans la future direction artistique.

- **Brumes de la nuit** — [étude de planche FR](brumes-de-la-nuit.png) · [étude de planche EN](brumes-de-la-nuit-en.png) · [carte sociale FR](brumes-de-la-nuit-social.png) · [étude de carte EN](brumes-de-la-nuit-social-en.png)
- **Mémoire, paix et réconciliation** — [étude de planche FR](memoire-paix-reconciliation.png) · [étude de planche EN](memoire-paix-reconciliation-en.png) · [carte sociale FR](memoire-paix-reconciliation-social.png) · [étude de carte EN](memoire-paix-reconciliation-social-en.png)
- **Tolérance, voix plurielles** — [étude de planche FR](tolerance-voix-plurielles.png) · [étude de planche EN](tolerance-voix-plurielles-en.png) · [carte sociale FR](tolerance-voix-plurielles-social.png) · [étude de carte EN](tolerance-voix-plurielles-social-en.png)

Les illustrations `*-art.png` ont été créées pour ces brouillons et ne sont pas des photographies documentaires; vérifier séparément les conditions de réutilisation de l’outil avant tout usage public. Les cartes sociales françaises sont la V1 issue du template social. Les planches françaises et anglaises et les cartes anglaises restent des études, à reprendre avec leurs templates respectifs; aucune n’est publiée ni enregistrée en production.
