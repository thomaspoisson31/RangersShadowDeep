# Règles de Base : Rangers of Shadow Deep

Ce document synthétise les règles fondamentales de *Rangers of Shadow Deep* pour une consultation rapide en cours de partie ou lors du développement d'outils d'émulation et de jeu solo.

---

## 1. Vue d'Ensemble & Matériel

*Rangers of Shadow Deep* est un jeu d'aventure sur table coopératif ou solo où les joueurs incarnent des Rangers protégeant le royaume d'Alladore contre les incursions de l'Ombre (*Shadow Deep*). Les créatures ennemies sont gérées automatiquement par des règles déterministes.

### Matériel requis :
- **Figurines** : 1 figurine pour chaque Ranger et chaque compagnon (les « héros »), ainsi que des figurines pour les monstres de la mission.
- **Dés** : Dés à 20 faces (D20).
- **Cartes** : Un jeu de 52 cartes à jouer standard (utilisé pour les tirages d'événements).
- **Surface de jeu** : Généralement une table de 2,5 × 2,5 pieds (30 × 30 pouces) ou 3 × 3 pieds (36 × 36 pouces), agrémentée de décors spécifiques au scénario.
- **Réglette / Mètre** : Mesures en pouces (`"`).

---

## 2. Profils et Statistiques

Chaque figurine (héros ou monstre) est définie par six caractéristiques de base :

| Statistique | Abréviation | Rôle en jeu | Valeur de base d'un Ranger |
| :--- | :---: | :--- | :---: |
| **Move** | M | Distance de déplacement standard en pouces (`"`). | **6** |
| **Fight** | F | Modificateur appliqué lors d'un combat au corps à corps. | **+2** |
| **Shoot** | S | Modificateur appliqué lors d'une attaque à distance. | **+1** |
| **Armour** | A | Valeur défensive soustraite aux dégâts subis. | **10** |
| **Will** | W | Capacité mentale, résistance aux sorts, peur et poison. | **+4** |
| **Health** | H | Points de vie actuels et maximaux. | **18** |

*Note sur les Statistiques Dédoublées (Split Stats)* : Notées sous la forme `+2/+3`, le premier chiffre indique la valeur naturelle et le second la valeur temporaire effective (via magie, blessure, équipement).

---

## 3. Création du Ranger

À la création, un Ranger dispose de **10 Points de Construction (Build Points)** à répartir :
1. **Amélioration des Caractéristiques (Max 3 pts)** : 1 pt = +1 à une caractéristique (sauf l'Armure). Chaque caractéristique ne peut être augmentée qu'une seule fois.
2. **Capacités Héroïques & Sorts (Max 5 pts)** : 1 pt par capacité ou sort. Les capacités héroïques ne s'achètent qu'une fois ; un sort peut être pris plusieurs fois.
3. **Compétences (Skills)** : 1 pt = +1 dans huit compétences différentes. (Toutes les compétences débutent à +0).
4. **Points de Recrutement (RP)** : 1 pt = +10 RP de base (qui s'ajoutent aux 100 RP de base).

### Équipement initial :
- Le Ranger dispose de **6 emplacements d'objets** (*item slots*).
- À la création, il choisit jusqu'à 5 objets gratuits dans la liste d'équipement de base (épée, arc, dague, armure légère, etc.).

---

## 4. Recrutement des Compagnons

Les héros voyagent rarement seuls. Le Ranger recrute des alliés selon son total de Points de Recrutement (BRP = Base Recruitment Points) et le nombre de joueurs :

| Joueurs | Calcul des Points de Recrutement (Total RP) | Nombre Max de Compagnons |
| :---: | :---: | :---: |
| **1 (Solo)** | **BRP** (généralement 100) + Compétence *Leadership* | **7** |
| **2** | `(BRP × 0.5) - 10` + *Leadership* | **3** |
| **3** | `(BRP × 0.3)` + *Leadership* | **2** |
| **4** | `(BRP × 0.1)` + *Leadership* | **1** |

- Chaque compagnon a un coût en RP (ex. *Hound* : 5 RP, *Man-at-Arms* : 20 RP, *Knight* : 35 RP).
- Lors de son premier recrutement, chaque compagnon reçoit **+3 dans une compétence** de son choix.
- Les compagnons humanoïdes peuvent porter 2 objets supplémentaires en plus de leur équipement d'origine. Les animaux ne peuvent porter ni objets ni trésors.

---

## 5. Structure d'un Tour de Jeu

Chaque tour est divisé en **4 phases séquentielles strictes** :

```
┌─────────────────────────┐
│   1. PHASE DES RANGERS  │  Activation du Ranger + jusqu'à 2 compagnons à ≤ 3"
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│  2. PHASE DES CRÉATURES │  Activation de tous les monstres (ordre décroissant de PV)
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 3. PHASE DES COMPAGNONS │  Activation de tous les compagnons restants
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│   4. PHASE D'ÉVÉNEMENT  │  Tirage de carte(s) d'événement du scénario
└─────────────────────────┘
```

### Règles d'Activation :
- Chaque figurine dispose de **2 actions** lors de son activation.
- **Règle d'or du Mouvement** : Sur les 2 actions, **au moins une doit être un déplacement** (ou une action équivalente comme recharger une arbalète).
- L'ordre des actions est libre (ex. *Déplacement puis Attaque*, ou *Attaque puis Déplacement*).
- Deux actions de déplacement dans la même activation : le 1er déplacement est égal à `Move`, le 2nd déplacement est effectué à **demi-vitesse** (`Move / 2`).
- **Activation de groupe** : Durant la phase des Rangers, le Ranger et jusqu'à 2 compagnons à 3" peuvent faire une activation groupée : tous font d'abord leur action de mouvement, puis chacun effectue sa seconde action dans l'ordre souhaité.

---

## 6. Mouvement et Environnement

- **Orientation (Facing)** : Les figurines n'ont pas d'arc frontal. Elles voient et pivotent à 360° librement sans coût en mouvement.
- **Terrain Difficile (Rough Ground)** : Chaque pouce parcouru dans la boue, l'eau peu profonde ou les décombres coûte 2 pouces de mouvement.
- **Escalade** : Coûte le double de distance (souvent associé à un jet de *Climb*).
- **Saut horizontal** : Jusqu'à `(Move / 2) + 1` pouces (ex. 4" pour un Move de 6) si la figurine dispose du mouvement suffisant.
- **Chutes** :
  - Chute ≤ 3" : Aucun dégât.
  - Chute > 3" : Dégâts directs = `Distance tombée en pouces × 1.5` (arrondi à l'inférieur), déduits directement des PV (l'Armure ne protège pas). Jet d'*Acrobatics (TN10)* pour pouvoir continuer son activation.
- **Engagement au combat** : Dès qu'une figurine entre en contact socle à socle avec un ennemi, son mouvement s'arrête immédiatement et elle est engagée au corps à corps.

---

## 7. Résolution des Actions & Jets de Dés

### Tests de Caractéristiques et de Compétences (Stat & Skill Rolls)
- **Formule** : `1D20 + Modificateur (Stat ou Compétence) ≥ Target Number (TN)`.
- En cas d'absence de la compétence requise, on lance simplement 1D20 sans modificateur.
- Pour un jet de caractéristique, on utilise la valeur courante (ex. pour un jet de *Health*, on ajoute ses PV restants).
- **20 naturel** : Réussite automatique critique.
- **1 naturel** : Échec automatique critique.

### Nage (Swimming)
Dans l'eau profonde, une figurine doit réussir au début de son activation un jet de *Swim (TN5)* avec malus d'encombrement (-2 armure légère, -5 armure lourde, -1 bouclier, -2 port de trésor). En cas d'échec : perte de l'activation et dégâts de noyade égaux à la marge d'échec (sans armure).

---

## 8. Combat au Corps à Corps (Hand-to-Hand)

Le combat est un **jet opposé simultané** : les deux combattants peuvent infliger des dégâts, même le défenseur.

### Déroulement pas-à-pas :
1. Les deux adversaires lancent chacun **1D20**.
2. Chacun ajoute sa statistique de **Fight** + d'éventuels bonus (ex. figurines alliées en soutien).
3. **Vainqueur** : Le score le plus élevé remporte l'échange (en cas d'égalité, aucun dégât n'est infligé).
4. **Calcul des Dégâts** :
   $$\text{Dégâts} = \text{Score de Combat du Vainqueur} + \text{Modificateurs d'arme} - \text{Armure du Perdant}$$
   - *Exemples d'armes* : Arme à deux mains (+2 dégâts), Dague (-1 dégât).
   - Si le résultat est $> 0$, les points sont déduits de la Santé du perdant. Si $\le 0$, aucun dégât.
5. **Coup Critique** : Un **20 naturel** obtenu par un héros est une victoire automatique avec **+5 points de dégâts supplémentaires** (les monstres ne font pas de coups critiques).
6. **Choix du vainqueur** : Le vainqueur choisit de :
   - Rester au contact.
   - Repousser son adversaire de 1 pouce.
   - Reculer lui-même de 1 pouce pour se désengager.

---

## 9. Combat à Distance (Shooting)

Une figurine équipée d'une arme de tir peut dépenser 1 action pour tirer (maximum 1 tir par activation).
- **Conditions** : La cible doit être à portée (ex. Arc = 24", Arbalète = 24", Dague de jet = 4") et en ligne de vue (LoS).
- **Interdiction** : Une figurine engagée au corps à corps ne peut ni tirer ni recharger. On ne peut pas tirer sur une cible engagée au corps à corps (sauf si c'est la seule cible géante/large).

### Résolution :
- **Tireur** : Lance `1D20 + Shoot`.
- **Cible** : Lance `1D20 + Fight` + Modificateurs de couvert.

### Modificateurs au jet de défense de la cible :
- **Obstacle intermédiaire** : +1 par élément de décor traversé.
- **Couvert léger** : +2 (muret partiel, buissons).
- **Couvert lourd** : +4 (mur solide cachant la majorité du corps).
- **Tir précipité** : +1 si le tireur a déjà bougé pendant cette activation.
- **Cible large** : -2 si la cible a le trait *Large*.

Si `Score Tireur > Score Cible` : Dégâts = `Score Tireur + Modificateurs d'arme - Armure Cible`.  
Si `Score Tireur ≤ Score Cible` : Le tir rate (la cible ne riposte pas).

---

## 10. États Spéciaux & Magie

- **Poison** : Subir au moins 1 dégât d'une attaque venimeuse réduit la figurine à **1 seule action par activation** pour le reste du scénario.
- **Maladie (Disease)** : Réduit définitivement les caractéristiques jusqu'à traitement entre deux scénarios.
- **Capacités Héroïques** : Utilisables **1 fois par scénario** sans dépenser d'action (action gratuite). Maximum 1 capacité héroïque utilisée par activation de figurine.
- **Sorts** : Doivent être lancés durant l'activation du lanceur et **coûtent 1 action**. Chaque sort n'est utilisable qu'une seule fois par scénario (sauf s'il a été acheté en plusieurs exemplaires).
- **Jetons Trésors (Treasure Tokens)** : Ramassés avec 1 action en contact socle à socle. Une figurine portant un trésor divise son déplacement par deux et souffre de -1 en *Fight*.

---

## 11. Intelligence Artificielle des Créatures

Durant la Phase des Créatures, chaque monstre s'active du plus grand nombre de PV actuels vers le plus faible, selon l'arbre décisionnel suivant :

```
                        [Monstre s'active]
                                │
                   Est-il déjà au combat ?
                     ├── OUI ──► Action de Combat (reste au contact s'il gagne)
                     └── NON
                          │
             Y a-t-il un Héros en Ligne de Vue ?
               ├── OUI
               │    ├── A une arme de tir et à portée ──► Tir (Action 2: Recharge/Rien)
               │    └── Pas d'arme de tir ──────────────► Avance vers le héros le plus proche
               │                                          (Si contact: Combat en Action 2,
               │                                           Sinon: 2ème mouvement)
               └── NON
                    │
         Le scénario a-t-il un "Target Point" ?
           ├── OUI ──► Avance d'une action vers le Target Point (re-tester LoS)
           └── NON ──► Mouvement d'une action en direction aléatoire (re-tester LoS)
```

---

## 12. Fin de Scénario & Campagne

À la fin de chaque scénario, suivez ces 4 étapes dans l'ordre :

1. **Survie des Héros à 0 PV** :
   Lancez 1D20 sur la table de survie pour chaque figurine tombée :
   - *1-2* : Mort.
   - *3-6* : Blessure Permanente (*Permanent Injury Table* : perte d'œil, boiterie, etc.).
   - *7-12* : Grièvement blessé (*Badly Wounded*, -5 PV au prochain scénario).
   - *13-18* : Échappée belle (*Close Call*, perd l'équipement non standard).
   - *19-20* : Rétablissement complet (*Full Recovery*).
2. **Expérience et Montée de Niveau (XP)** :
   - Le Ranger accumule de l'XP selon les objectifs réussis du scénario.
   - Tous les 100 XP, le Ranger gagne 1 niveau et choisit une amélioration : Augmentation de carac, +5 points de compétences, +10 RP, ou nouvelle Capacité/Sort.
   - Les compagnons survivants gagnent 1 *Progression Point*.
3. **Tirage des Trésors** : Jets sur les tables d'objets magiques, potions, herbes et richesses.
4. **Réorganisation de la Compagnie** : Remplacement des pertes et sélection des compagnons pour la mission suivante.
