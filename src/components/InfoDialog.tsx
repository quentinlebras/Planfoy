import { META, PLACES, SOURCES } from '../data/places';
import { GROUPS } from '../data/taxonomy';
import { HOME_SHARE_URL, TRIP_END, TRIP_START } from '../data/home';

interface Props {
  onClose: () => void;
}

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

function formatDay(iso: string): string {
  return DATE_FORMAT.format(new Date(`${iso}T12:00:00`));
}

export function InfoDialog({ onClose }: Props) {
  const countByGroup = new Map<string, number>();
  for (const place of PLACES) {
    countByGroup.set(place.group, (countByGroup.get(place.group) ?? 0) + 1);
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="À propos">
      <button type="button" className="modal__backdrop" onClick={onClose} aria-label="Fermer" />
      <div className="modal__panel modal__panel--wide">
        <h2>Séjour du {formatDay(TRIP_START)} au {formatDay(TRIP_END)} 2026</h2>
        <p className="muted">
          Base : <strong>{META.base}</strong> ·{' '}
          <a href={HOME_SHARE_URL} target="_blank" rel="noreferrer noopener">
            voir la location ↗
          </a>
        </p>

        <section className="block">
          <h3>Légende</h3>
          <ul className="legend-list">
            {GROUPS.map((group) => (
              <li key={group.id}>
                <i style={{ background: group.color }} aria-hidden="true" />
                <span aria-hidden="true">{group.emoji}</span> {group.label}
                <span className="muted"> — {countByGroup.get(group.id) ?? 0} lieux</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="block">
          <h3>Comment ça marche</h3>
          <ul className="bullets">
            <li>Un clic sur un marqueur centre la carte et met en avant la fiche du lieu.</li>
            <li>
              Le carrousel du bas suit la carte : faire glisser les cartes déplace la carte, et
              cliquer sur la carte active l'ouvre en plein écran.
            </li>
            <li>
              Trois fonds de carte : <strong>Plan</strong> pour la ville, <strong>Relief</strong>{' '}
              pour les sentiers et sommets du Pilat, <strong>Satellite</strong> pour repérer les
              plages et les accès.
            </li>
            <li>Chaque lieu a un bouton d'itinéraire routier depuis l'Airbnb.</li>
            <li>Le lien de la barre d'adresse (#/lieu/…) est partageable tel quel.</li>
          </ul>
        </section>

        <section className="block">
          <h3>Photos</h3>
          <p className="muted">
            Les photos sont cherchées automatiquement sur Wikimedia Commons (par nom et par
            coordonnées) et restent la propriété de leurs auteurs. Quand aucune image libre
            n'existe, la fiche propose des liens de recherche externes.
          </p>
        </section>

        <section className="block">
          <h3>Fiabilité des informations</h3>
          <p className="muted">{META.important_method_note}</p>
        </section>

        <section className="block">
          <h3>Sources</h3>
          <ul className="bullets">
            {SOURCES.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer noopener">
                  {source.name} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="modal__actions">
          <span className="modal__spacer" />
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
