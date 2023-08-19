import { Outlet, useLoaderData } from 'react-router-dom';
import TopNav from './topnav';
import styles from './app.module.css';
import { useState } from 'react';

export default function App() {
  const addresses = useLoaderData();
  const [currentBlueprint, setCurrentBlueprint] = useState(null);
  return (
    <>
      <TopNav addresses={addresses} currentBlueprint={currentBlueprint} />
      <div className={styles.appContainer}>
        <Outlet context={{setCurrentBlueprint}}/>
      </div>
    </>
  );
}