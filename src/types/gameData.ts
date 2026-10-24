export interface Stats {
  Move: number;
  Fight: number;
  Shoot: number;
  Armour: number;
  Will: number;
  Health: number;
}

export interface BestiaryEntry {
  name: string;
  stats: Stats;
  xp?: number;
  traits?: string[];
  notes?: string;
  special_rules?: string;
}

export interface CompanionEntry {
  name: string;
  rp: number;
  stats: Stats;
  skills?: Record<string, number>;
  equipment?: string[];
  notes?: string;
}

export interface PreScenarioCheck {
  skill?: string;
  stat?: string;
  tn: number;
  eligible_figures?: string;
  on_success?: {
    action: string;
    marker_type?: string;
    distance_inches?: number;
    direction?: string;
    description?: string;
  };
  on_failure?: {
    action: string;
    description?: string;
  };
}

export interface ClueTableEntry {
  roll: number | string;
  result: string;
  effect?: string;
  spawn_enemy?: {
    type: string;
    quantity: number;
    location?: string;
  };
  xp_reward?: number;
}

export interface EventCardEntry {
  card: string;
  title?: string;
  description: string;
  effect?: string;
  spawn_enemies?: Array<{
    type: string;
    quantity: number;
    location: string;
  }>;
}

export interface TerrainSetupItem {
  type: string;
  quantity?: string | number;
  layout?: string;
  min_distance_to_heroes_inches?: number;
  density?: string;
  description?: string;
}

export interface MarkerSetupItem {
  type: string;
  id_range?: [number, number];
  placement?: string;
  distance_inches?: number;
  locked_doors?: boolean;
  quantity?: number;
}

export interface InitialEnemyItem {
  type: string;
  quantity: number;
  placement: string;
  distance_from_edge_inches?: number;
  edges?: string[];
}

export interface TableSetup {
  dimensions: {
    width_feet: number;
    length_feet: number;
  };
  hero_deployment: {
    type: string;
    center?: string;
    max_distance_inches?: number;
    edge?: string;
  };
  terrain?: TerrainSetupItem[];
  markers?: MarkerSetupItem[];
  initial_enemies?: InitialEnemyItem[];
}

export interface ScenarioMechanics {
  target_point?: string;
  doors?: {
    total?: number;
    status_at_start?: string;
    picking_lock?: {
      skill?: string;
      tn?: number;
      actions_required?: number;
    };
  };
  clue_markers_interaction?: string;
  special_rules?: string[];
  clue_table?: ClueTableEntry[];
  events_deck?: EventCardEntry[];
}

export interface Scenario {
  scenario_index: number;
  title: string;
  narrative_intro: string;
  table_setup: TableSetup;
  pre_scenario_checks?: PreScenarioCheck[];
  mechanics?: ScenarioMechanics;
  outcomes_and_experience?: {
    experience_rewards?: Array<{
      condition: string;
      xp: number;
    }>;
    success_consequences?: string;
    failure_consequences?: string;
  };
}

export interface Mission {
  mission_index?: number;
  title: string;
  description?: string;
  scenarios: Scenario[];
}

export interface CoreRulesReference {
  turn_phases: Array<{
    order: number;
    phase: string;
    description: string;
  }>;
  creature_ai_flowchart: Array<{
    step: number;
    condition: string;
    action_true: string;
  }>;
  combat_and_damage: {
    melee_resolution: string;
    critical_hits: string;
    shooting_modifiers: Record<string, number>;
    swimming_modifiers: Record<string, number>;
    falling_damage: string;
  };
}

export interface GameData {
  title: string;
  version: string;
  system: string;
  format_specification?: string;
  core_rules_reference: CoreRulesReference;
  bestiary: BestiaryEntry[];
  companions_roster: CompanionEntry[];
  random_tables: {
    survival_table: any[];
    permanent_injury_table: any[];
    treasure_table: any[];
    herbs_and_potions_table: any[];
    weapons_and_armour_table: any[];
    magic_item_table: any[];
    shadow_deep_cards_deck: any[];
  };
  missions: Mission[];
}
