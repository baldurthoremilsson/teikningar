import { Outlet, useLoaderData } from 'react-router-dom';
import TopNav from './topnav';
import styles from './app.module.css';
import { useState } from 'react';
import { AddressInfo, BlueprintInfo } from '../types';


export default function App() {
  const addresses= useLoaderData() as AddressInfo[];
  const [currentBlueprint, setCurrentBlueprint] = useState<BlueprintInfo | null>(null);

  return (
    <>
      <TopNav addresses={addresses} currentBlueprint={currentBlueprint} />
      <div className={styles.appContainer}>
        <Outlet context={{setCurrentBlueprint, addresses}}/>
      </div>
    </>
  );
}