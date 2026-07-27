import { useMemo } from 'react';
import { GROUPS } from '../data/taxonomy';
import { PLACES } from '../data/places';
import { toggle, type Filters } from '../lib/filters';
import type { GroupId } from '../types';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  const countByGroup = useMemo(() => {
    const counts = new Map<GroupId, number>();
    for (const place of PLACES) {
      counts.set(place.group, (counts.get(place.group) ?? 0) + 1);
    }
    return counts;
  }, []);

  const patch = (next: Partial<Filters>) => onChange({ ...filters, ...next });

  return (
    <div className="filters">
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
    </div>
  );
}
