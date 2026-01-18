import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!inputRef.current) return;
    if (!window.google?.maps?.places) return;

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

  return <Input label={label} ref={inputRef} placeholder="Buscar direccion" error={error} />;
}
