import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  BUILDING_CENTER,
  buildJobPins,
  buildLocationPins,
} from '../../utils/locationCoords';
import './TicketLocationMap.css';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-maintenance-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.maintenanceGoogleMaps = 'true';
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function pinPopupHtml(pin) {
  const title = pin.label || pin.floor;
  const detail = pin.detail || pin.topCategories || '';
  const badge = pin.highlight
    ? `<div style="color:#c45c4a;font-weight:700;margin-bottom:2px">Next stop</div>`
    : '';
  return `${badge}<strong>${title}</strong><br/><span style="opacity:.85">${
    pin.floor
  }</span>${detail ? `<br/><span style="opacity:.8">${detail}</span>` : ''}`;
}

function highlightIcon() {
  return L.divIcon({
    className: 'ticket-map__next-icon',
    html: '<span></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function LeafletMap({ pins }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([BUILDING_CENTER.lat, BUILDING_CENTER.lng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layer = L.layerGroup().addTo(map);
    const latLngs = [];

    pins.forEach((pin) => {
      const marker = pin.highlight
        ? L.marker([pin.lat, pin.lng], { icon: highlightIcon(), zIndexOffset: 500 })
        : L.marker([pin.lat, pin.lng]);
      marker.bindPopup(pinPopupHtml(pin));
      marker.addTo(layer);
      latLngs.push([pin.lat, pin.lng]);
    });

    if (latLngs.length > 1) {
      map.fitBounds(latLngs, { padding: [28, 28], maxZoom: 18 });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 17);
    }

    return () => {
      map.removeLayer(layer);
    };
  }, [pins]);

  return <div ref={containerRef} className="ticket-map__canvas" />;
}

function GoogleMap({ pins, apiKey }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: BUILDING_CENTER,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const maps = window.google?.maps;
    const map = mapRef.current;
    if (!maps || !map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new maps.LatLngBounds();

    pins.forEach((pin) => {
      const position = { lat: pin.lat, lng: pin.lng };
      const marker = new maps.Marker({
        map,
        position,
        title: pin.label || `${pin.floor}: ${pin.count} tickets`,
        label: pin.highlight ? { text: '1', color: '#fff', fontWeight: '700' } : undefined,
      });
      const info = new maps.InfoWindow({
        content: `<div style="color:#111;font:12px/1.4 sans-serif">${pinPopupHtml(
          pin
        )}</div>`,
      });
      marker.addListener('click', () => info.open({ map, anchor: marker }));
      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (pins.length > 1) {
      map.fitBounds(bounds, 40);
    } else if (pins.length === 1) {
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      map.setZoom(17);
    }
  }, [pins]);

  if (failed) {
    return <LeafletMap pins={pins} />;
  }

  return <div ref={containerRef} className="ticket-map__canvas" />;
}

export function TicketLocationMap({
  tickets,
  title,
  pinMode = 'floor',
  highlightId = null,
  className = '',
}) {
  const pins = useMemo(() => {
    if (pinMode === 'jobs') return buildJobPins(tickets, highlightId);
    return buildLocationPins(tickets);
  }, [tickets, pinMode, highlightId]);

  const useGoogle = Boolean(GOOGLE_KEY);
  const heading =
    title ||
    (useGoogle ? 'Google Map — ticket locations' : 'Ticket locations map');

  if (pins.length === 0) {
    return (
      <div className={`ticket-map${className ? ` ${className}` : ''}`}>
        <div className="ticket-map__header">
          <h4 className="ticket-map__title">{heading}</h4>
        </div>
        <div className="empty-state" style={{ padding: '1.25rem' }}>
          No ticket locations to pin.
        </div>
      </div>
    );
  }

  return (
    <div className={`ticket-map${className ? ` ${className}` : ''}`}>
      <div className="ticket-map__header">
        <h4 className="ticket-map__title">{heading}</h4>
      </div>
      {useGoogle ? <GoogleMap pins={pins} apiKey={GOOGLE_KEY} /> : <LeafletMap pins={pins} />}
    </div>
  );
}
