import { useState } from 'react';
import { HOME_SHARE_URL, HOME_SHORT_ADDRESS } from '../data/home';
import { parseLatLon, type LatLon } from '../lib/geo';
import type { Home } from '../lib/useHome';

interface Props {
  home: Home;
  onSave: (point: LatLon) => void;
  onReset: () => void;
  onClose: () => void;
}

/**
 * The rental's address drives every itinerary. This dialog exists for the two
 * cases the address cannot cover: someone starting the day from elsewhere, and
 * sharpening the map pin if geocoding did not resolve the street.
 */
export function OriginDialog({ home, onSave, onReset, onClose }: Props) {
  const [value, setValue] = useState(`${home.lat.toFixed(5)}, ${home.lon.toFixed(5)}`);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = parseLatLon(value);
    if (!parsed) {
      setError('Format non reconnu. Attendu : « 45.38440, 4.42040 » ou un lien Maps avec @lat,lon.');
      return;
    }
    onSave(parsed);
    onClose();
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Point de départ">
      <button type="button" className="modal__backdrop" onClick={onClose} aria-label="Fermer" />
      <div className="modal__panel">
        <h2>Point de départ des itinéraires</h2>

        {home.useAddress ? (
          <p className="muted">
            Les itinéraires partent de <strong>{HOME_SHORT_ADDRESS}</strong>. Google et Plans
            résolvent eux-mêmes l'adresse, l'itinéraire est donc exact.
            {home.approximate &&
              " Le marqueur 🏡 est posé au centre du village le temps que l'adresse soit localisée ; ça n'affecte pas les itinéraires."}
          </p>
        ) : (
          <p className="notice notice--warn">
            Départ personnalisé : {home.lat.toFixed(5)}, {home.lon.toFixed(5)}. L'adresse de
            l'Airbnb n'est plus utilisée.
          </p>
        )}

        <label className="field">
          <span className="field__label">Partir d'un autre point (coordonnées ou lien Maps)</span>
          <input
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => event.key === 'Enter' && submit()}
            placeholder="45.38440, 4.42040"
          />
        </label>
        {error && <p className="notice notice--warn">{error}</p>}

        <p className="muted">
          Lien partagé de la location :{' '}
          <a href={HOME_SHARE_URL} target="_blank" rel="noreferrer noopener">
            ouvrir dans Google Maps ↗
          </a>
        </p>

        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              onReset();
              onClose();
            }}
            disabled={home.useAddress && !home.approximate}
          >
            Revenir à l'Airbnb
          </button>
          <span className="modal__spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn btn--primary" onClick={submit}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
