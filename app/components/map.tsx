import { MapContainer } from "react-leaflet/MapContainer";
import { TileLayer } from "react-leaflet/TileLayer";
import { useMap, useMapEvent, useMapEvents } from "react-leaflet/hooks";
import { Circle } from "react-leaflet/Circle";
import { CircleMarker } from "react-leaflet/CircleMarker";
import { Popup } from "react-leaflet/Popup";
import { LatLngBounds, LatLngTuple } from "leaflet";
import { Tooltip } from "react-leaflet/Tooltip";
import "leaflet/dist/leaflet.css";
import {
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AddressInfo, AppOutletContextType } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { singularOrPlural } from "@/lib/utils";

const CENTER_DEFAULTS: LatLngTuple = [64.1352099, -21.8992545];
const ZOOM_DEFAULT = 13;
const BOUNDS: LatLngTuple[] = [
  [63.96932635, -22.39899286],
  [64.25640413, -21.6628078],
];

function MapUpdates({
  mapUpdateCallback,
}: {
  mapUpdateCallback: (
    lat: number,
    lng: number,
    zoom: number,
    bounds: LatLngBounds,
  ) => void;
}) {
  const map = useMap();
  useMapEvent("moveend", () =>
    mapUpdateCallback(
      map.getCenter().lat,
      map.getCenter().lng,
      map.getZoom(),
      map.getBounds(),
    ),
  );
  // zoomlevelschange is fired when the map renders for the first time, and we want to execute the mapUpdateCallback on map load
  useMapEvent("zoomlevelschange", () =>
    mapUpdateCallback(
      map.getCenter().lat,
      map.getCenter().lng,
      map.getZoom(),
      map.getBounds(),
    ),
  );
  return null;
}

export default function Map() {
  const { addresses } = useOutletContext<AppOutletContextType>();
  const [visibleAddresses, setVisibleAddresses] = useState<AddressInfo[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  let params = {
    lat: searchParams.has("lat")
      ? parseFloat(searchParams.get("lat") as string)
      : CENTER_DEFAULTS[0],
    lng: searchParams.has("lng")
      ? parseFloat(searchParams.get("lng") as string)
      : CENTER_DEFAULTS[1],
    zoom: searchParams.has("zoom")
      ? parseFloat(searchParams.get("zoom") as string)
      : ZOOM_DEFAULT,
  };

  const clickHandler = useCallback(
    (address: string) => navigate(`/${address}`),
    [navigate],
  );

  const mapUpdateCallback = useCallback(
    (lat: number, lng: number, zoom: number, bounds: LatLngBounds) => {
      setSearchParams(
        { lat: lat.toString(), lng: lng.toString(), zoom: zoom.toString() },
        { replace: true },
      );

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
    [setSearchParams, addresses, setVisibleAddresses],
  );

  return (
    <MapContainer
      center={[params.lat, params.lng]}
      zoom={params.zoom}
      scrollWheelZoom={true}
      maxBounds={BOUNDS}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdates mapUpdateCallback={mapUpdateCallback} />
      {visibleAddresses.map((address) => (
        <CircleMarker
          center={address.coords as LatLngTuple}
          radius={4}
          eventHandlers={{ click: () => clickHandler(address.address) }}
          key={address.address}
        >
          <Tooltip>
            {address.address} (
            <i>
              {address.count}{" "}
              {singularOrPlural(address.count, "teikning", "teikningar")}
            </i>
            )
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
