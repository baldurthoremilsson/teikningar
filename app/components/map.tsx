import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { useMap, useMapEvent } from "react-leaflet/hooks";
import { Circle } from "react-leaflet/Circle";
import { CircleMarker } from "react-leaflet/CircleMarker";
import { Popup } from "react-leaflet/Popup";
import { LatLngBounds, LatLngTuple } from "leaflet";
import { Tooltip } from "react-leaflet/Tooltip";
import "leaflet/dist/leaflet.css";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AddressInfo, AppOutletContextType } from "@/lib/types";
import { useCallback, useState } from "react";

const CENTER: LatLngTuple = [64.1352099, -21.8992545];
const BOUNDS: LatLngTuple[] = [
  [63.96932635, -22.39899286],
  [64.25640413, -21.6628078],
];

export function MapUpdates({
  updateAddresses,
}: {
  updateAddresses: (bounds: LatLngBounds) => void;
}) {
  const map = useMap();
  useMapEvent("zoomend", () => updateAddresses(map.getBounds()));
  useMapEvent("moveend", () => updateAddresses(map.getBounds()));
  useMapEvent("resize", () => updateAddresses(map.getBounds()));
  return null;
}

export default function Map() {
  const { addresses } = useOutletContext<AppOutletContextType>();
  const [visibleAddresses, setVisibleAddresses] = useState<AddressInfo[]>([]);
  const navigate = useNavigate();

  const clickHandler = useCallback(
    (address: string) => navigate(`/${address}`),
    [navigate],
  );

  const updateAddresses = useCallback(
    (bounds: LatLngBounds) => {
      const width = bounds.getEast() - bounds.getWest();
      const height = bounds.getNorth() - bounds.getSouth();
      if (width > 0.04 || height > 0.04) {
        setVisibleAddresses([]);
      } else {
        setVisibleAddresses(
          addresses.filter(
            (address) => address.coords && bounds.contains(address.coords),
          ),
        );
      }
    },
    [addresses],
  );

  return (
    <MapContainer
      center={CENTER}
      zoom={13}
      scrollWheelZoom={true}
      maxBounds={BOUNDS}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdates updateAddresses={updateAddresses} />
      {visibleAddresses.map((address) => (
        <CircleMarker
          center={address.coords as LatLngTuple}
          radius={4}
          eventHandlers={{ click: () => clickHandler(address.address) }}
          key={address.address}
        >
          <Tooltip>
            {address.address} ({address.count})
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
