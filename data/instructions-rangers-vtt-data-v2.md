# Documentation Technique & Spécifications d'Intégration
**Fichier associé :** `rangers-of-shadow-deep-complete-data-v2.json`  
**Application cible :** Émulateur Solo Web & Virtual Tabletop (VTT) pour *Rangers of Shadow Deep*

---

## 1. Vue d'ensemble de l'Architecture des Données

Le fichier `rangers-of-shadow-deep-complete-data-v2.json` fournit une représentation algorithmique complète et structurée pour piloter une application VTT autonome. Il permet d'instancier automatiquement les scénarios de jeu sur un canvas 2D (avec image de fond personnalisée), d'exécuter l'automate des phases de jeu, d'appliquer les règles de combat et d'arbitrage sans ambiguïté, et d'interfacer un assistant IA LLM en cours de partie.

### Arborescence Racine du Schéma

| Clé / Balise | Type | Rôle et Utilisation dans l'Application |
| :--- | :--- | :--- |
| `title`, `version`, `system` | `string` | Métadonnées d'identification du schéma et versionnement. |
| `format_specification` | `object` | Définition des formats de coordonnées, primitives géométriques et algorithmes de placement. |
| `core_rules_reference` | `object` | Règles fondamentales de combat D20, modificateurs d'armes, et arbre décisionnel de l'IA ennemie. |
| `bestiary` | `array` | Profils complets, statistiques et règles spéciales de toutes les créatures hostiles et neutres. |
| `companions_roster` | `array` | Catalogue des types de compagnons recrutables avec leurs statistiques et coûts en points de recrutement. |
| `random_tables` | `object` | Tables D20 canoniques : Survie, Blessures permanentes, Trésors, Herbes & Potions, Cartes de l'Ombre. |
| `missions` | `array` | Ensemble des missions de campagne (M01, M02, M03, Burning Light) et de leurs scénarios respectifs. |

---

## 2. Le Système de Coordonnées & Primitives Géométriques

Toutes les dimensions de jeu sont converties en **pouces réels** (*inches*).
* **Système d'axes :** Origine `(0, 0)` au coin supérieur gauche de la table de jeu.
  * Axe $X$ horizontal croissant vers la droite (Est).
  * Axe $Y$ vertical croissant vers le bas (Sud).
* **Facteur d'échelle canvas :** Calculé lors du calibrage de l'image de fond :
  $$\text{pixels\_per\_inch} = \frac{\text{distance\_mesurée\_en\_pixels}}{\text{distance\_en\_pouces}}$$
  Pour une table de $3 \times 3$ pieds : largeur = 36", longueur = 36".

### Formes Géométriques (`geometry`)

* **`box`** : `{ "width_inches": number, "length_inches": number }` — Bâtiments, salles, coffres, lits d'hôpital.
* **`circle`** : `{ "radius_inches": number }` — Arbres, brasiers, fontaines, trous d'insectes.
* **`line`** : `{ "width_inches": number }` — Cours d'eau, passerelles, ponts, escaliers rocheux.
* **`zone`** : Délimitation de surfaces ouvertes ou de zones d'effet.

---

## 3. Typologie des Variables de Positionnement des Décors (`table_setup.terrain[]`)

Chaque élément de décor est conçu pour être instancié de manière procédurale ou déterministe via 5 types d'algorithmes de positionnement :

### 1. `fixed_coordinates` (Position Cartésienne Absolue)
Positionnement déterministe au millimètre près.
```json
"position": {
  "type": "fixed_coordinates",
  "x_inches": 15.0,
  "y_inches": 15.0,
  "rotation_degrees": 0.0,
  "z_elevation_inches": 4.0
}
```
* **Consigne de calcul :** Positionner l'ancre centrale ou le coin du sprite aux coordonnées $(X, Y)$ spécifiées.

### 2. `radial_distribution` (Disposition Radiale autour d'un Point)
Utilisé pour répartir les bâtiments ou points d'intérêt en cercle autour d'un point central tout en maintenant une distance minimale de sécurité.
```json
"position": {
  "type": "radial_distribution",
  "origin": { "x_inches": 18.0, "y_inches": 18.0 },
  "radius_inches": 11.0,
  "angle_degrees": 45.0,
  "min_distance_to_heroes_inches": 6.0
}
```
* **Consigne de calcul :**
  $$X = \text{origin.x} + \text{radius\_inches} \times \cos(\text{angle\_degrees} \times \frac{\pi}{180})$$
  $$Y = \text{origin.y} + \text{radius\_inches} \times \sin(\text{angle\_degrees} \times \frac{\pi}{180})$$

### 3. `edge_offset` (Alignement et Décalage depuis un Bord de Table)
Positionne un élément par rapport à une bordure (`"north"`, `"south"`, `"east"`, `"west"`).
```json
"position": {
  "type": "edge_offset",
  "edge": "south",
  "distance_from_edge_inches": 1.0,
  "offset_along_edge_inches": 12.0
}
```
* **Consigne de calcul :**
  * Bord Sud : $X = \text{offset\_along\_edge\_inches}$, $Y = \text{table\_height} - \text{distance\_from\_edge\_inches}$.
  * Bord Nord : $X = \text{offset\_along\_edge\_inches}$, $Y = \text{distance\_from\_edge\_inches}$.

### 4. `line_segment` (Tracé de Lignes Continues)
Définit les rivières, sentiers, ponts et escaliers.
```json
"position": {
  "type": "line_segment",
  "start_point": { "x_inches": 0.0, "y_inches": 24.0 },
  "end_point": { "x_inches": 30.0, "y_inches": 24.0 },
  "width_inches": 4.0
}
```
* **Consigne de calcul :** Tracer un polygone ou ruban de largeur `width_inches` entre `start_point` et `end_point`.

### 5. `procedural_scatter` (Dispersion Procédurale Aléatoire Paramétrée)
Génère un semis d'éléments de décor légers (arbres, rochers, décombres) en évitant les zones d'exclusion.
```json
"position": {
  "type": "procedural_scatter",
  "count": { "min": 8, "max": 12 },
  "zone_bounds": { "x_min_inches": 2.0, "x_max_inches": 34.0, "y_min_inches": 2.0, "y_max_inches": 34.0 },
  "min_separation_inches": 4.0,
  "avoid_zones": ["center_hero_deployment_r3", "village_buildings"]
}
```
* **Consigne de calcul :**
  1. Tirer au sort un entier $N \in [\text{min}, \text{max}]$.
  2. Générer des coordonnées $(X, Y)$ aléatoires uniformes dans `zone_bounds`.
  3. Rejeter le point si la distance avec un autre élément est inférieure à `min_separation_inches` ou s'il intersecte un polygone de `avoid_zones`.

---

## 4. Propriétés Physiques et d'Interaction des Décors

L'algorithme de calcul des déplacements et de l'IA ennemie doit vérifier les propriétés suivantes sur chaque élément :
* **`blocks_movement` (`boolean`) :** Si `true`, le polygone constitue un obstacle infranchissable (sauf vol ou règles d'escalade).
* **`blocks_los` (`boolean`) :** Si `true`, bloque le lancer de rayon pour la détection de ligne de vue (Ligne de Vue / LoS) pour le tir et l'activation des créatures.
* **`rough_ground` (`boolean`) :** Si `true`, applique la règle de terrain difficile : chaque pouce de déplacement réel consomme 2 pouces de la caractéristique `Move` de la figurine.
* **`interactive_door` (`object`) :** Contient l'état initial (`locked: true/false`) et les tests d'ouverture (`Pick Lock` TN ou `Strength` TN) avec le coût en action.
* **`burnable` (`boolean`) :** Si `true`, l'élément peut être ciblé par une action "Mettre le feu" (ex. arbres-nids).

---

## 5. Déroulement du Moteur de Jeu & Automate de Phases

L'application doit implémenter une machine à états finis cadencée selon les 4 phases officielles du jeu :

```
                  ┌──────────────────────────────┐
                  │ 1. Phase des Rangers         │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ 2. Phase des Créatures (IA)  │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ 3. Phase des Compagnons      │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ 4. Phase des Événements      │
                  └──────────────┬───────────────┘
                                 │
                   (Incrément Tour / Vérif Fin)
```

### Phase 1 : Phase des Rangers
* Chaque figurine de Ranger active dispose de **2 actions**.
* L'une des actions au moins doit être un déplacement (sauf si engagé au combat).

### Phase 2 : Phase des Créatures (Moteur IA Déterministe)
Pour chaque créature ennemie présente sur la table (itérée par ordre décroissant de `Fight` puis de distance aux héros) :
1. **Étape 1 - Engagement immédiat :** Si la créature est déjà au contact socle à socle (*base contact*) avec un héros ou compagnon $\rightarrow$ Effectuer une attaque au corps à corps.
2. **Étape 2 - Détection de cible visible :** Si la créature n'est pas engagée, tracer les rayons de ligne de vue vers toutes les figurines alliées non dissimulées derrière un décor avec `blocks_los: true`.
   * *Si une ou plusieurs cibles sont visibles :* Identifier la plus proche (priorité aux cibles non engagées au combat).
     * Si la créature possède une arme de tir (`Shoot` défini) et que la cible est à portée sans obstacle masquant $\rightarrow$ Tirer.
     * Sinon $\rightarrow$ Se déplacer de sa valeur `Move` en ligne droite vers la cible choisie. Si le mouvement atteint le contact socle $\rightarrow$ Lancer le combat.
3. **Étape 3 - Patrouille / Point Cible :** Si aucune cible n'est visible $\rightarrow$ Déplacer la créature vers le `mechanics.target_point` défini dans le scénario (ex. indice non fouillé le plus proche, porte de bâtiment). Si aucun point cible n'est défini $\rightarrow$ Mouvement aléatoire déterminé par un D20.

### Phase 3 : Phase des Compagnons
* Activation de tous les compagnons et alliés n'ayant pas encore agi ce tour-ci (2 actions par figurine).

### Phase 4 : Phase des Événements
* Tirage automatisé dans le deck défini par `event_deck` :
  * Si deck standard : Tirage d'une carte à jouer (ex. As de Cœur, Roi de Pique) et résolution de l'effet associé.
  * Si deck Shadow Deep : Tirage sur `random_tables.shadow_deep_cards_deck`.
* Vérification des conditions de fin de scénario (`end_conditions.max_turns` ou évacuation des héros).

---

## 6. Résolution des Combats & Tests de Compétences

### Formule de Combat au Corps à Corps (Jet Opposé)
Chaque belligérant lance un $1\text{D}20$ :
$$\text{Score Total} = 1\text{D}20 + \text{Fight} + \text{Bonus d'Arme} + \text{Bonus de Soutien}$$
* En cas d'égalité, les deux figurines infligent des dégâts simultanément.
* Le vainqueur inflige des points de dégâts calculés par :
  $$\text{Dégâts} = \max(0, \text{Score Vainqueur} - \text{Armour de la Cible}) \times \text{Multiplicateur Critique}$$
  *(Un 20 naturel sur le dé double les dégâts infligés après soustraction de l'armure).*

### Interaction avec les Marqueurs (`interaction_tables`)
Lorsqu'un token entre en contact avec un `clue_marker` ou un `web_cocoon` et utilise une action de fouille :
1. L'application tire $1\text{D}20$ et consulte la table spécifique du scénario.
2. Si un test de compétence est requis (ex. `Armoury TN6`, `Survival TN8`), l'application invite l'utilisateur à lancer le dé ou le résout automatiquement en ajoutant le modificateur de la figurine.
3. En cas de succès :
   * Si `reward_on_success` : Ajout direct de l'objet dans l'inventaire du Ranger.
   * Si `spawn_companion` : Instanciation d'un token allié au contact.
   * Si `spawn_enemy_in_combat` : Instanciation d'un monstre directement engagé en combat.

---

## 7. Rôle et Intégration de l'Arbitre IA (LLM via API)

L'application intègre un panneau latéral permettant de solliciter un modèle LLM (OpenAI, Anthropic ou Google GenAI via clé API utilisateur enregistrée en local). 

### Données de Contexte à Injecter au LLM
Lors de chaque requête d'arbitrage, l'application sérialise et transmet dans le prompt système :
1. L'extrait de règles du scénario en cours (`missions[...].scenarios[...]`).
2. La position relative des figurines concernées, les obstacles bloquants (`blocks_los`, `blocks_movement`).
3. Les 5 dernières actions du journal de log.

### Cas d'Usage de l'IA
* **Arbitrage tactique :** Résolution des trajectoires ambiguës lorsque deux cibles sont à distance strictement égale ou lors d'un passage étroit.
* **Narration dynamique :** Génération d'une description immersive lors de la découverte d'un indice crucial, de l'entrée dans une nouvelle pièce ou du tirage d'une carte d'événement majeure.
