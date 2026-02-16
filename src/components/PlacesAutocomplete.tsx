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
  ready,
  required,
  value
}: {
  label: string;
  onSelect: (place: PlaceResult) => void;
  error?: string;
  ready?: boolean;
  required?: boolean;
  value?: PlaceResult | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<PlaceResult | null>(null);
  const { t } = useI18n();
  const minChars = 3;

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!value) return;
    setInputValue(value.address);
    setSelectedValue(value);
    if (elementRef.current) {
      elementRef.current.value = value.address;
    }
  }, [value?.address, value?.placeId]);

  useEffect(() => {
    if (!ready) return;
    if (!window.google?.maps?.importLibrary) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      await window.google.maps.importLibrary('places');
      if (cancelled) return;
      const hasNewElement = typeof window.google.maps.places.PlaceAutocompleteElement === 'function';
      setUnavailable(!hasNewElement);
      console.log('PlacesAutocomplete init', { ready, hasNewElement });

      if (!hasNewElement || !containerRef.current) return;
      if (!elementRef.current) {
        const element = new window.google.maps.places.PlaceAutocompleteElement();
        element.setAttribute('placeholder', t('common.addressSearch'));
        element.className =
          'w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900';
        element.style.display = 'block';
        element.style.width = '100%';
        elementRef.current = element;
      }
      if (!containerRef.current || !elementRef.current) return;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(elementRef.current);
      console.log('PlacesAutocomplete element attached');

      const element = elementRef.current;

      const onPlaceSelect = async (event: any) => {
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
        const result = {
          address: formatted,
          placeId,
          location: {
            lat: typeof location.lat === 'function' ? location.lat() : location.lat,
            lng: typeof location.lng === 'function' ? location.lng() : location.lng
          }
        };
        setInputValue(formatted);
        setSelectedValue(result);
        onSelectRef.current(result);
      };

      const geocoder = new window.google.maps.Geocoder();

      const onChange = () => {
        console.log('PlaceAutocomplete change', element.value);
        setInputValue(element.value || '');
      };

      const onBlur = () => {
        const value = element.value?.trim();
        if (!value) {
          if (selectedValue?.address) {
            element.value = selectedValue.address;
          }
          return;
        }
        if (value.length < minChars) return;
        geocoder.geocode({ address: value }, (results: string | any[], status: string) => {
          if (status !== 'OK' || !results?.length) {
            console.log('Geocode fallback failed', status);
            return;
          }
          const result = results[0];
          const selected = {
            address: result.formatted_address,
            placeId: result.place_id,
            location: {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng()
            }
          };
          setInputValue(result.formatted_address);
          setSelectedValue(selected);
          onSelectRef.current(selected);
        });
      };

      const onInput = () => {
        setInputValue(element.value || '');
      };

      element.addEventListener('gmp-placeselect', onPlaceSelect);
      element.addEventListener('change', onChange);
      element.addEventListener('blur', onBlur);
      element.addEventListener('input', onInput);

      return () => {
        element.removeEventListener('gmp-placeselect', onPlaceSelect);
        element.removeEventListener('change', onChange);
        element.removeEventListener('blur', onBlur);
        element.removeEventListener('input', onInput);
      };
    };

    void setup().then((fn) => {
      cleanup = fn;
    });
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [t, ready, selectedValue?.address]);

  const showAutocomplete = ready && !unavailable && inputValue.length >= minChars;

  useEffect(() => {
    if (showAutocomplete && elementRef.current) {
      elementRef.current.value = inputValue;
      if (document.activeElement === inputRef.current) {
        elementRef.current.focus?.();
      }
    }
  }, [showAutocomplete, inputValue]);

  return (
    <label className="flex w-full flex-col gap-1 text-sm text-ink-700">
      <span className="font-medium text-ink-800">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {!showAutocomplete ? (
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900"
          placeholder={t('common.addressSearch')}
        />
      ) : null}
      <div ref={containerRef} className={showAutocomplete ? 'block' : 'hidden'} />
      {!ready ? <span className="text-xs text-ink-500">{t('common.loading')}</span> : null}
      {ready && !unavailable && inputValue.length > 0 && inputValue.length < minChars ? (
        <span className="text-xs text-ink-500">
          {t('common.addressMinChars')}
        </span>
      ) : null}
      {ready && unavailable ? <span className="text-xs text-red-500">{t('common.mapsUnavailable')}</span> : null}
      {ready && !unavailable && error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
