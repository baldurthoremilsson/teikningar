import { Dispatch, SetStateAction } from "react";
import { LatLngTuple } from "leaflet";

export type BlueprintImage = {
  size: number;
  width: number;
  height: number;
  href: string;
  square: boolean;
};

export type BlueprintInfo = {
  address: string;
  date: string;
  description: string;
  hash: string;
  images: { [key: string]: BlueprintImage };
  originalHref: string;
};

export type AddressInfo = {
  address: string;
  normalized: string;
  count: number;
  coords?: LatLngTuple;
};

export type AddressAndBlueprintInfo = {
  address: string;
  blueprint: BlueprintInfo;
};

export type AppOutletContextType = {
  setCurrentBlueprint: Dispatch<SetStateAction<BlueprintInfo | null>>;
  addresses: AddressInfo[];
};

export type AddressOutletContextType = {
  setCurrentBlueprint: Dispatch<SetStateAction<BlueprintInfo | null>>;
  blueprints: BlueprintInfo[];
};

export type Rectangle = {
  x: number;
  y: number;
  height: number;
  width: number;
  color: string;
};

export type Annotation = {
  x: number;
  y: number;
  size: number;
  color: string;
  message: string;
};

export type Sketch = {
  name: string;
  rectangles: Rectangle[];
  annotations: Annotation[];
};

export type Sketches = { [originalHref: string]: Sketch[] };

export type DBSchemaV1 = {
  recentlyViewed: AddressAndBlueprintInfo[];
  favorites: AddressAndBlueprintInfo[];
  sketches: Sketches;
};
