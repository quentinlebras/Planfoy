import type { CategoryMeta, Group, GroupId } from '../types';

export const GROUPS: Group[] = [
  {
    id: 'nature',
    label: 'Nature & panoramas',
    short: 'Nature',
    emoji: '🌄',
    color: '#15803d',
    colorDark: '#14532d',
  },
  {
    id: 'baignade',
    label: 'Baignade & rivières',
    short: 'Baignade',
    emoji: '🏊',
    color: '#0284c7',
    colorDark: '#075985',
  },
  {
    id: 'enfants',
    label: 'Enfants & animaux',
    short: 'Enfants',
    emoji: '🧸',
    color: '#db2777',
    colorDark: '#9d174d',
  },
  {
    id: 'sorties',
    label: 'Bars, concerts & guinguettes',
    short: 'Sorties',
    emoji: '🍹',
    color: '#ea580c',
    colorDark: '#9a3412',
  },
  {
    id: 'culture',
    label: 'Culture & musées',
    short: 'Culture',
    emoji: '🏛️',
    color: '#7c3aed',
    colorDark: '#5b21b6',
  },
  {
    id: 'ville',
    label: 'Ville & balades urbaines',
    short: 'Ville',
    emoji: '🏙️',
    color: '#a16207',
    colorDark: '#713f12',
  },
];

export const GROUP_BY_ID: Record<GroupId, Group> = Object.fromEntries(
  GROUPS.map((g) => [g.id, g]),
) as Record<GroupId, Group>;

export const GROUP_RANK: Record<GroupId, number> = Object.fromEntries(
  GROUPS.map((group, index) => [group.id, index]),
) as Record<GroupId, number>;

/** Every `category` value present in the dataset, mapped to a group, a label and an icon. */
export const CATEGORIES: Record<string, Omit<CategoryMeta, 'id'>> = {
  design_museum: { label: 'Design', group: 'culture', emoji: '🎨' },
  museum: { label: 'Musée', group: 'culture', emoji: '🏛️' },
  museum_and_park: { label: 'Musée & parc', group: 'culture', emoji: '⛏️' },
  contemporary_art: { label: 'Art contemporain', group: 'culture', emoji: '🖼️' },
  heritage: { label: 'Patrimoine', group: 'culture', emoji: '🏰' },
  theatre_architecture: { label: 'Théâtre', group: 'culture', emoji: '🎭' },
  opera: { label: 'Opéra', group: 'culture', emoji: '🎼' },
  arthouse_cinema: { label: 'Cinéma art & essai', group: 'culture', emoji: '🎬' },
  football_museum: { label: 'Stade & football', group: 'culture', emoji: '⚽' },

  science_family: { label: 'Sciences', group: 'enfants', emoji: '🧪' },
  planetarium: { label: 'Planétarium', group: 'enfants', emoji: '🔭' },
  park_family: { label: 'Parc urbain', group: 'enfants', emoji: '🌳' },
  children_farm: { label: 'Ferme pédagogique', group: 'enfants', emoji: '🐐' },
  zoo: { label: 'Zoo', group: 'enfants', emoji: '🦍' },
  safari_zoo: { label: 'Safari', group: 'enfants', emoji: '🦁' },
  adventure_park: { label: 'Accrobranche', group: 'enfants', emoji: '🧗' },
  pony: { label: 'Poney', group: 'enfants', emoji: '🐴' },

  urban_walk_family: { label: 'Place & jeux', group: 'ville', emoji: '⛲' },
  urban_view_walk: { label: 'Balade urbaine', group: 'ville', emoji: '🪜' },

  food_hall_music: { label: 'Food court & DJ', group: 'sorties', emoji: '🍽️' },
  live_music: { label: 'Salle de concert', group: 'sorties', emoji: '🎸' },
  jazz_club: { label: 'Club de jazz', group: 'sorties', emoji: '🎷' },
  bars_nightlife: { label: 'Bars & terrasses', group: 'sorties', emoji: '🍻' },
  summer_guinguette: { label: 'Guinguette estivale', group: 'sorties', emoji: '🎶' },
  guinguette: { label: 'Guinguette', group: 'sorties', emoji: '🍹' },
  alternative_live_bar: { label: 'Bar alternatif', group: 'sorties', emoji: '🎤' },

  nature_hike: { label: 'Barrage & gorge', group: 'nature', emoji: '🏞️' },
  lake_walk: { label: 'Tour de lac', group: 'nature', emoji: '🚶' },
  viewpoint: { label: 'Point de vue', group: 'nature', emoji: '🌄' },
  ridge_hike: { label: 'Crête & rochers', group: 'nature', emoji: '⛰️' },
  summit: { label: 'Sommet', group: 'nature', emoji: '🏔️' },
  waterfall_hike: { label: 'Cascade & rando', group: 'nature', emoji: '💦' },
  waterfall: { label: 'Cascade', group: 'nature', emoji: '💦' },
  wetland_walk: { label: 'Tourbière', group: 'nature', emoji: '🌾' },
  meadow_view: { label: 'Prairies', group: 'nature', emoji: '🌿' },
  forest_walk: { label: 'Forêt', group: 'nature', emoji: '🌲' },
  river_hike: { label: 'Gorges & passerelle', group: 'nature', emoji: '🥾' },

  swimming_lake: { label: 'Lac de baignade', group: 'baignade', emoji: '🏊' },
  river_beach: { label: 'Plage de rivière', group: 'baignade', emoji: '🏖️' },
  lake_beach_village: { label: 'Plage & village', group: 'baignade', emoji: '⛵' },
  river_access: { label: 'Accès rivière', group: 'baignade', emoji: '🪨' },
  wild_swimming: { label: 'Baignade sauvage', group: 'baignade', emoji: '💎' },
};

export const FALLBACK_CATEGORY: Omit<CategoryMeta, 'id'> = {
  label: 'Autre',
  group: 'culture',
  emoji: '📍',
};
