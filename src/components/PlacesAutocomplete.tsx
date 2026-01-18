import { useEffect, useRef, useState } from 'react';
import Input from './Input';

export type PlaceResult = {
  address: string;
  placeId: string;
  location: { lat: number; lng: number };
};

export default function PlacesAutocomplete({
  label,
  onSelect,
  error
}: {
  label: string;
  onSelect: (place: PlaceResult) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [useNewElement, setUseNewElement] = useState(false);

  useEffect(() => {
    if (!window.google?.maps?.places) return;
    const hasNewElement = typeof window.google.maps.places.PlaceAutocompleteElement === 'function';
    setUseNewElement(hasNewElement);

    if (hasNewElement && containerRef.current) {
      const element = new window.google.maps.places.PlaceAutocompleteElement();
      element.setAttribute('placeholder', 'Buscar direccion');
      element.className =
        'w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(element);

      element.addEventListener('gmp-placeselect', async (event: any) => {
        const place = event.place;
        if (!place) return;
        await place.fetchFields({ fields: ['formattedAddress', 'location', 'id'] });
        if (!place.location || !place.formattedAddress || !place.id) return;
        onSelect({
          address: place.formattedAddress,
          placeId: place.id,
          location: {
            lat: place.location.lat(),
            lng: place.location.lng()
          }
        });
      });
      return;
    }

    if (!inputRef.current) return;
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'place_id', 'geometry']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location || !place.formatted_address || !place.place_id) return;
      onSelect({
        address: place.formatted_address,
        placeId: place.place_id,
        location: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
      });
    });
  }, [onSelect]);

  if (useNewElement) {
    return (
      <label className="flex w-full flex-col gap-1 text-sm text-ink-700">
        <span className="font-medium text-ink-800">{label}</span>
        <div ref={containerRef} />
        {error ? <span className="text-xs text-red-500">{error}</span> : null}
      </label>
    );
  }

  return <Input label={label} ref={inputRef} placeholder="Buscar direccion" error={error} />;
}
