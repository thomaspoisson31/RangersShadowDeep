import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { BookOpen, X, Shield, Swords, Move, Flame, Key, Users, Bot, ScrollText } from 'lucide-react';

interface PlayerActionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerActionGuideModal: React.FC<PlayerActionGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { turnNumber, currentPhase } = useGameStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-stone-200">

        {/* Modal Header */}
        <div className="bg-stone-950 px-6 py-4 border-b border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>Guide des Actions du Joueur — Rangers of Shadow Deep</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">

          {/* Current Phase Highlight Box */}
          <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Tour {turnNumber} — Phase Actuelle : <strong className="uppercase text-amber-400">{currentPhase}</strong></span>
            </div>
            <p className="text-stone-300">
              {currentPhase === 'ranger' && "C'est la Phase des Rangers ! Vous activez votre Ranger et vos compagnons. Chaque figurine dispose de 2 actions."}
              {currentPhase === 'creature' && "Phase des Créatures ! Tous les monstres s'activent selon leur automate d'IA déterministe (du plus grand PV au plus faible)."}
              {currentPhase === 'companion' && "Phase des Compagnons ! Activez tous vos compagnons qui n'ont pas encore agi durant la Phase des Rangers."}
              {currentPhase === 'event' && "Phase d'Événements ! Tirage et résolution de la carte d'événement du deck Shadow Deep / Scénario."}
            </p>
          </div>

          {/* Phase 1: Rangers Phase Guide */}
          <div className="space-y-2 border-l-2 border-amber-600 pl-3">
            <h3 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              1. Phase des Rangers (2 Actions par figurine)
            </h3>
            <ul className="space-y-1.5 text-stone-300 list-disc list-inside">
              <li>
                <strong className="text-amber-200">Règle d'or du Mouvement :</strong> Sur les 2 actions de l'activation, au moins une doit être un déplacement (ou équivalent comme recharger).
              </li>
              <li>
                <strong className="text-amber-200">Déplacement :</strong> 1er mouvement = valeur <code className="text-amber-300 font-mono">Move</code> (ex. 6"). Si 2nd mouvement dans la même activation = demi-vitesse (<code className="text-amber-300 font-mono">Move / 2</code>, soit 3").
              </li>
              <li>
                <strong className="text-amber-200">Terrain Difficile & Escalade :</strong> Chaque pouce dans la boue/eau coûte 2" de mouvement. Escalade = coût double.
              </li>
              <li>
                <strong className="text-amber-200">Activation Groupée :</strong> Le Ranger peut activer jusqu'à 2 compagnons situés à ≤ 3" : tous font leur 1er mouvement, puis leurs 2e actions.
              </li>
            </ul>
          </div>

          {/* Summary Table of Available Actions */}
          <div className="space-y-2">
            <h3 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-amber-500" />
              Actions Disponibles en Jeu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-stone-950 p-2.5 rounded border border-stone-800 space-y-1">
                <div className="font-bold text-rose-400 flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5" /> Combat au Corps à Corps
                </div>
                <p className="text-stone-400">
                  Jet opposé simultané : 1D20 + Fight. Vainqueur inflige : <code className="text-stone-200 font-mono">Score - Armure Cible</code>. Vingt naturel = critique (+5 dégâts).
                </p>
              </div>

              <div className="bg-stone-950 p-2.5 rounded border border-stone-800 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <Move className="w-3.5 h-3.5" /> Tir à Distance
                </div>
                <p className="text-stone-400">
                  1 tir max par activation. 1D20 + Shoot vs 1D20 + Fight + Couvert de la cible (+2 léger, +4 lourd).
                </p>
              </div>

              <div className="bg-stone-950 p-2.5 rounded border border-stone-800 space-y-1">
                <div className="font-bold text-yellow-400 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> Fouiller Indice / Porte
                </div>
                <p className="text-stone-400">
                  Au contact socle à socle avec un jeton Indice ou une Porte, dépensez 1 action pour effectuer le test (ex. Pick Lock TN8 ou Strength TN8).
                </p>
              </div>

              <div className="bg-stone-950 p-2.5 rounded border border-stone-800 space-y-1">
                <div className="font-bold text-orange-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Incendier / Décors
                </div>
                <p className="text-stone-400">
                  Si équipé d'une torche, au contact d'un arbre-nid, dépensez 1 action pour mettre le feu et détruire l'obstacle.
                </p>
              </div>
            </div>
          </div>

          {/* Phase 2: Creature AI Rules */}
          <div className="space-y-2 border-l-2 border-rose-600 pl-3">
            <h3 className="font-bold text-rose-400 text-sm flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-rose-500" />
              2. Phase des Créatures (Automate IA Déterministe)
            </h3>
            <p className="text-stone-300">
              Les monstres s'activent par ordre décroissant de Santé (PV) :
            </p>
            <ol className="list-decimal list-inside space-y-1 text-stone-400">
              <li><strong className="text-stone-200">Déjà au combat :</strong> Effectue une attaque de mêlée immédiatement.</li>
              <li><strong className="text-stone-200">Cible visible :</strong> Si armé d'un arc/arbalète → Tire sur le héros le plus proche. Sinon → Se déplace à pleine vitesse vers le héros le plus proche.</li>
              <li><strong className="text-stone-200">Pas de cible visible :</strong> Se déplace vers le Target Point du scénario ou direction aléatoire.</li>
            </ol>
          </div>

          {/* Phase 4: Event Phase Guide */}
          <div className="space-y-2 border-l-2 border-purple-600 pl-3">
            <h3 className="font-bold text-purple-400 text-sm flex items-center gap-1.5">
              <ScrollText className="w-4 h-4 text-purple-500" />
              4. Phase d'Événements & Deck Shadow Deep
            </h3>
            <p className="text-stone-300">
              Tirez une carte du deck d'événements du scénario ou du deck Shadow Deep canonique (Tables D20 / Cartes à jouer). Résolvez les renforts d'ennemis, évènements météo ou pièges décrits sur la carte.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-6 py-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-stone-100 font-bold rounded-lg text-xs transition-colors"
          >
            Fermer le Guide
          </button>
        </div>

      </div>
    </div>
  );
};
