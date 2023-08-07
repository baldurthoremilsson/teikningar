import { Outlet, useLoaderData } from 'react-router-dom';
import Search from './search';
import styles from './app.module.css';
import { useState } from 'react';

export default function App() {
  const addresses = useLoaderData();
  const [currentBlueprint, setCurrentBlueprint] = useState(null);
  return (
    <>
      <Search addresses={addresses} currentBlueprint={currentBlueprint} />
      <div className={styles.appContainer}>
        <Outlet context={{setCurrentBlueprint}}/>
      </div>
    </>
  );
}