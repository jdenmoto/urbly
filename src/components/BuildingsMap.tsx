import { useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import type { Building } from '@/core/models/building';

const DEFAULT_CENTER = { lat: 4.711, lng: -74.0721 };

export default function BuildingsMap({ buildings, ready }: { buildings: Building[]; ready: boolean }) {
  const { t } = useI18n();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);

  useEffect(() => {
    if (!ready) return;
    if (!mapRef.current) return;
    if (!window.google?.maps?.importLibrary) return;

    let cancelled = false;

    const loadMap = async () => {
      const { Map } = (await window.google.maps.importLibrary('maps')) as { Map: typeof window.google.maps.Map };
      await window.google.maps.importLibrary('marker');
      if (cancelled) return;

      if (!mapInstance.current) {
        mapInstance.current = new Map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: 12,
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        infoRef.current = new window.google.maps.InfoWindow();
      }

      markersRef.current.forEach((marker) => {
        if (marker.map) marker.map = null;
        if (marker.setMap) marker.setMap(null);
      });
      markersRef.current = [];

      const withLocation = buildings.filter((building) => building.location);
      if (!withLocation.length) {
        mapInstance.current.setCenter(DEFAULT_CENTER);
        return;
      }

      const bounds = new window.google.maps.LatLngBounds();

      withLocation.forEach((building) => {
        const position = building.location;
        bounds.extend(position);
        const useAdvanced = window.google.maps.marker?.AdvancedMarkerElement;
        const marker = useAdvanced
          ? new window.google.maps.marker.AdvancedMarkerElement({
              position,
              map: mapInstance.current,
              title: building.name
            })
          : new window.google.maps.Marker({
              position,
              map: mapInstance.current,
              title: building.name
            });
        const clickEvent = useAdvanced ? 'gmp-click' : 'click';
        marker.addListener(clickEvent, () => {
          const content = `
            <div style="font-family: system-ui; padding: 6px; max-width: 240px;">
              <strong>${building.name}</strong><br />
              <span>${building.addressText}</span><br />
              <span>${t('buildings.porterPhone')}: ${building.porterPhone}</span>
            </div>
          `;
          infoRef.current.setContent(content);
          infoRef.current.open({ anchor: marker, map: mapInstance.current });
        });
        markersRef.current.push(marker);
      });

      mapInstance.current.fitBounds(bounds);
    };

    void loadMap();

    return () => {
      cancelled = true;
    };
  }, [buildings, t, ready]);

  return (
    <div className="overflow-hidden rounded-2xl border border-fog-200 bg-white shadow-soft">
      <div className="border-b border-fog-200 px-4 py-3 text-sm font-semibold text-ink-800">
        {t('buildings.mapTitle')}
      </div>
      <div ref={mapRef} className="h-[320px] w-full" />
      {!ready ? (
        <div className="px-4 py-3 text-xs text-ink-500">{t('common.loading')}</div>
      ) : null}
    </div>
  );
}
