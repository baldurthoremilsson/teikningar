import { Dispatch, SetStateAction } from "react";

export type BlueprintImage = {
  size: number,
  width: number,
  height: number,
  href: string,
  square: boolean,
};

export type BlueprintInfo = {
  address: string,
  date: string,
  description: string,
  hash: string,
  images: {[key: string]: BlueprintImage},
  originalHref: string,
}

export type AddressInfo = {
  address: string,
  normalized: string,
  count: number
}

export type AddressAndBlueprintInfo = {
    address: string,
    blueprint: BlueprintInfo,
}

export type AppOutletContextType = {
    setCurrentBlueprint: Dispatch<SetStateAction<BlueprintInfo | null>>,
    addresses: AddressInfo[],
}

export type AddressOutletContextType = {
    setCurrentBlueprint: Dispatch<SetStateAction<BlueprintInfo | null>>,
    blueprints: BlueprintInfo[],
}