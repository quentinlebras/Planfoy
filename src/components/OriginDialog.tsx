import { useState } from 'react';
import { DEFAULT_HOME, HOME_SHARE_URL } from '../data/home';
import { parseLatLon, type LatLon } from '../lib/geo';

interface Props {
  home: LatLon;
  onSave: (home: LatLon) => void;
  onClose: () => void;
}

/**
 * The Airbnb pin drives every itinerary link, so it has to be adjustable
 * without a redeploy.
 */
export function OriginDialog({ home, onSave, onClose }: Props) {
  const [value, setValue] = useState(`${home.lat}, ${home.lon}`);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = parseLatLon(value);
    if (!parsed) {
      setError('Format non reconnu. Attendu : « 45.3844, 4.4204 » ou un lien Maps avec @lat,lon.');
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
        <p className="muted">
          Tous les itinéraires partent de ce point. Colle les coordonnées exactes de l'Airbnb, ou
          l'URL Google Maps longue (celle qui contient <code>@45.38…,4.42…</code>).
        </p>
        <label className="field">
          <span className="field__label">Coordonnées ou lien Maps</span>
          <input
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => event.key === 'Enter' && submit()}
            placeholder="45.3844, 4.4204"
          />
        </label>
        {error && <p className="notice notice--warn">{error}</p>}
        <p className="muted">
          Lien partagé de la location :{' '}
          <a href={HOME_SHARE_URL} target="_blank" rel="noreferrer noopener">
            ouvrir dans Google Maps ↗
          </a>{' '}
          — ouvre-le, puis copie l'URL complète depuis la barre d'adresse.
        </p>
        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setValue(`${DEFAULT_HOME.lat}, ${DEFAULT_HOME.lon}`);
              setError(null);
            }}
          >
            Centre de Planfoy
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
