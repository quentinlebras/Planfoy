import { useMemo, useState } from 'react';
import { CATEGORIES, GROUPS } from '../data/taxonomy';
import { MAX_DRIVE_MIN, PLACES } from '../data/places';
import { formatDrive } from '../lib/geo';
import {
  DRIVE_STEPS,
  EMPTY_FILTERS,
  isDefaultFilters,
  toggle,
  type Filters,
} from '../lib/filters';
import type { GroupId } from '../types';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
}

export function FilterBar({ filters, onChange, resultCount }: Props) {
  const [expanded, setExpanded] = useState(false);

  const countByGroup = useMemo(() => {
    const counts = new Map<GroupId, number>();
    for (const place of PLACES) {
      counts.set(place.group, (counts.get(place.group) ?? 0) + 1);
    }
    return counts;
  }, []);

  // Only offer the precise categories that belong to the selected universes.
  const categoryOptions = useMemo(() => {
    const active = new Set(filters.groups);
    const used = new Map<string, number>();
    for (const place of PLACES) {
      if (active.size > 0 && !active.has(place.group)) continue;
      used.set(place.category, (used.get(place.category) ?? 0) + 1);
    }
    return [...used.entries()]
      .map(([id, count]) => ({ id, count, ...CATEGORIES[id] }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [filters.groups]);

  const patch = (next: Partial<Filters>) => onChange({ ...filters, ...next });

  return (
    <div className="filters">
      <div className="filters__row">
        <button
          type="button"
          className={`btn btn--ghost filters__more ${expanded ? 'is-open' : ''}`}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          Filtres
          {!isDefaultFilters(filters) && <span className="dot" aria-hidden="true" />}
        </button>
      </div>

      <div className="chips" role="group" aria-label="Type de lieu">
        {GROUPS.map((group) => {
          const active = filters.groups.includes(group.id);
          return (
            <button
              key={group.id}
              type="button"
              className={`chip ${active ? 'chip--on' : ''}`}
              style={{ ['--chip' as string]: group.color }}
              aria-pressed={active}
              onClick={() =>
                patch({ groups: toggle(filters.groups, group.id), categories: [] })
              }
            >
              <span aria-hidden="true">{group.emoji}</span>
              {group.short}
              <span className="chip__count">{countByGroup.get(group.id) ?? 0}</span>
            </button>
          );
        })}
      </div>

      {expanded && (
        <div className="filters__panel">
          <div className="field">
            <span className="field__label">Temps de route maximum</span>
            <div className="segmented">
              {DRIVE_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`segmented__item ${filters.maxDrive === step ? 'is-on' : ''}`}
                  onClick={() => patch({ maxDrive: step })}
                >
                  {step === MAX_DRIVE_MIN ? 'Tout' : `≤ ${formatDrive(step)}`}
                </button>
              ))}
            </div>
          </div>

          <div className="field field--inline">
            <label className="switch">
              <input
                type="checkbox"
                checked={filters.kidsOnly}
                onChange={(event) => patch({ kidsOnly: event.target.checked })}
              />
              <span>Bon avec les enfants</span>
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={filters.eventsOnly}
                onChange={(event) => patch({ eventsOnly: event.target.checked })}
              />
              <span>Événement pendant le séjour</span>
            </label>
          </div>

          <div className="field">
            <span className="field__label">
              Catégorie précise
              {filters.categories.length > 0 && ` (${filters.categories.length})`}
            </span>
            <div className="chips chips--wrap">
              {categoryOptions.map((option) => {
                const active = filters.categories.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`chip chip--sm ${active ? 'chip--on' : ''}`}
                    aria-pressed={active}
                    onClick={() => patch({ categories: toggle(filters.categories, option.id) })}
                  >
                    <span aria-hidden="true">{option.emoji}</span>
                    {option.label}
                    <span className="chip__count">{option.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filters__footer">
            <span className="muted">
              {resultCount} lieu{resultCount === 1 ? '' : 'x'} affiché
              {resultCount === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onChange(EMPTY_FILTERS)}
              disabled={isDefaultFilters(filters)}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
