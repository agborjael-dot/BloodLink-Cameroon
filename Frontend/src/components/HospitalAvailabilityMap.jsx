import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

const CAMEROON_CENTER = [6.6111, 12.4578];
const CAMEROON_BOUNDS = L.latLngBounds(
  [1.6, 8.4],
  [13.2, 16.4]
);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getMatchingUnits = (inventory = [], bloodGroup = "") =>
  inventory.reduce((sum, item) => {
    if (bloodGroup && item.group !== bloodGroup) {
      return sum;
    }
    return sum + Number(item.units || 0);
  }, 0);

function FitMapToMarkers({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      map.fitBounds(CAMEROON_BOUNDS, { padding: [24, 24] });
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 8);
      return;
    }

    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, positions]);

  return null;
}

export default function HospitalAvailabilityMap({
  hospitals = [],
  bloodGroup = "",
  emptyMessage = "No hospital coordinates available yet.",
  height = 300,
}) {
  const markers = useMemo(
    () =>
      hospitals
        .map((hospital) => {
          const lat = toNumber(hospital.lat);
          const lng = toNumber(hospital.lng);
          if (lat === null || lng === null) return null;
          if (!CAMEROON_BOUNDS.contains([lat, lng])) return null;

          return {
            id: hospital._id || hospital.name,
            name: hospital.name || "Hospital",
            region: hospital.region || "",
            location: hospital.location || "Location unavailable",
            distanceKm: hospital.distanceKm,
            position: [lat, lng],
            matchingUnits: getMatchingUnits(hospital.inventory, bloodGroup),
          };
        })
        .filter(Boolean),
    [bloodGroup, hospitals]
  );

  const positions = useMemo(() => markers.map((marker) => marker.position), [markers]);

  if (markers.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-red-50 via-white to-blue-50 px-4 text-center text-sm text-gray-500"
        style={{ height: `${height}px` }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <MapContainer
        center={CAMEROON_CENTER}
        zoom={6}
        minZoom={6}
        maxBounds={CAMEROON_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom
        style={{ height: `${height}px`, width: "100%" }}
      >
        <FitMapToMarkers positions={positions} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              {marker.region || marker.location}
            </Tooltip>
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-gray-900">{marker.name}</p>
                {marker.region && <p className="text-gray-600">{marker.region} Region</p>}
                <p className="text-gray-600">{marker.location}</p>
                <p className="text-gray-600">
                  {marker.distanceKm ? `${marker.distanceKm} km away` : "Distance unavailable"}
                </p>
                <p className="font-medium text-red-600">
                  {bloodGroup
                    ? `${marker.matchingUnits} unit(s) of ${bloodGroup}`
                    : `${marker.matchingUnits} total matching unit(s)`}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
