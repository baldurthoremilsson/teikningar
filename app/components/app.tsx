import { Outlet, useLoaderData } from 'react-router-dom';
import TopNav from './topnav';
import styles from './app.module.css';
import { useState } from 'react';
import { AddressInfo, BlueprintInfo } from '../types';
import Head from 'next/head';


export default function App() {
  const addresses= useLoaderData() as AddressInfo[];
  const [currentBlueprint, setCurrentBlueprint] = useState<BlueprintInfo | null>(null);
  const [title, setTitle] = useState("Teikningar");

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <TopNav addresses={addresses} currentBlueprint={currentBlueprint} />
      <div className={styles.appContainer}>
        <Outlet context={{setCurrentBlueprint, addresses, setTitle}}/>
      </div>
    </>
  );
}