import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';

export type PlaceResult = {
  address: string;
  placeId: string;
  location: { lat: number; lng: number };
};

export default function PlacesAutocomplete({
  label,
  onSelect,
  error,
  ready
}: {
  label: string;
  onSelect: (place: PlaceResult) => void;
  error?: string;
  ready?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!ready) return;
    if (!window.google?.maps?.importLibrary) return;
    let cancelled = false;

    const setup = async () => {
      await window.google.maps.importLibrary('places');
      if (cancelled) return;
      const hasNewElement = typeof window.google.maps.places.PlaceAutocompleteElement === 'function';
      setUnavailable(!hasNewElement);
      console.log('PlacesAutocomplete init', { ready, hasNewElement });

      if (!hasNewElement || !containerRef.current) return;
      const element = new window.google.maps.places.PlaceAutocompleteElement();
      element.setAttribute('placeholder', t('common.addressSearch'));
      element.className =
        'w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900';
      element.style.display = 'block';
      element.style.width = '100%';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(element);
      console.log('PlacesAutocomplete element attached');

      element.addEventListener('gmp-placeselect', async (event: any) => {
        console.log('gmp-placeselect event', event);
        const place = event.place;
        if (!place) return;
        const fetchable = typeof place.fetchFields === 'function';
        if (fetchable) {
          await place.fetchFields({ fields: ['formattedAddress', 'location', 'id'] });
        }
        const formatted = place.formattedAddress || place.formatted_address;
        const location = place.location || place.geometry?.location;
        const placeId = place.id || place.place_id;
        if (!location || !formatted || !placeId) return;
        console.log('Place selected', { formatted, placeId, location });
        onSelect({
          address: formatted,
          placeId,
          location: {
            lat: typeof location.lat === 'function' ? location.lat() : location.lat,
            lng: typeof location.lng === 'function' ? location.lng() : location.lng
          }
        });
      });

      const geocoder = new window.google.maps.Geocoder();

      element.addEventListener('change', () => {
        console.log('PlaceAutocomplete change', element.value);
      });

      element.addEventListener('blur', () => {
        const value = element.value?.trim();
        if (!value) return;
        geocoder.geocode({ address: value }, (results: string | any[], status: string) => {
          if (status !== 'OK' || !results?.length) {
            console.log('Geocode fallback failed', status);
            return;
          }
          const result = results[0];
          onSelect({
            address: result.formatted_address,
            placeId: result.place_id,
            location: {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng()
            }
          });
        });
      });
    };

    void setup();
    return () => {
      cancelled = true;
    };
  }, [onSelect, t, ready]);

  return (
    <label className="flex w-full flex-col gap-1 text-sm text-ink-700">
      <span className="font-medium text-ink-800">{label}</span>
      <div ref={containerRef} />
      {!ready ? <span className="text-xs text-ink-500">{t('common.loading')}</span> : null}
      {ready && unavailable ? <span className="text-xs text-red-500">{t('common.mapsUnavailable')}</span> : null}
      {ready && !unavailable && error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
