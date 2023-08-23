"use client"

import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './components/app';
import Frontpage from './components/frontpage';
import Address from './components/address';
import Overview from './components/overview';
import Blueprint from './components/blueprint';
import { BlueprintInfo, AddressInfo } from './types';


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: async (): Promise<AddressInfo[]> => (await fetch('/addresses.json')).json(),
    children: [
      {
        index: true,
        element: <Frontpage />,
      }, {
        path: ":address",
        element: <Address />,
        loader: async ({ params }): Promise<BlueprintInfo[]> => (await fetch(`/addresses/${params.address}.json`)).json(),
        children: [
          {
            index: true,
            element: <Overview />,
          },
          {
            path: ":hash/:description*",
            element: <Blueprint />,
          },
        ]
      },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />
}