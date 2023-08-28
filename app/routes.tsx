"use client";

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./components/app";
import Frontpage from "./components/frontpage";
import Address from "./components/address";
import Overview from "./components/overview";
import Blueprint from "./components/blueprint";
import Map from "./components/map";
import { BlueprintInfo, AddressInfo } from "@/lib/types";
import { DATA_URL_PREFIX } from "@/lib/constants";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: async (): Promise<AddressInfo[]> =>
      (await fetch(`${DATA_URL_PREFIX}/addresses.json`)).json(),
    children: [
      {
        index: true,
        element: <Frontpage />,
      },
      {
        path: "kort",
        element: <Map />,
      },
      {
        path: ":address",
        element: <Address />,
        loader: async ({ params }): Promise<BlueprintInfo[]> =>
          (
            await fetch(`${DATA_URL_PREFIX}/addresses/${params.address}.json`)
          ).json(),
        children: [
          {
            index: true,
            element: <Overview />,
          },
          {
            path: ":hash/:description*",
            element: <Blueprint />,
          },
        ],
      },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
