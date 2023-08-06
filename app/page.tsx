"use client"

import 'bootstrap/dist/css/bootstrap.min.css';
import { StrictMode } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './components/app';
import Frontpage from './components/frontpage';
import Address from './components/address';
import Overview from './components/overview';
import Blueprint from './components/blueprint';


async function addressesLoader() {
  return fetch('/addresses.json');
}

async function addressLoader({ params }:  { params: { address: string }}) {
  return fetch(`/addresses/${params.address}.json`);
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: addressesLoader,
    children: [
      {
        index: true,
        element: <Frontpage />,
      }, {
        path: ":address",
        element: <Address />,
        loader: addressLoader,
        children: [
          {
            index: true,
            element: <Overview />,
          },
          {
            path: ":hash/:description?",
            element: <Blueprint />,
          },
        ]
      },
    ],
  },
]);

export default function Home() {
  return (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
}
