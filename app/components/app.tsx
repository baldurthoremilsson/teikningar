import { Outlet, useLoaderData } from 'react-router-dom';
import Search from './search';
import styles from './app.module.css';

export default function App() {
  const addresses = useLoaderData();
  return (
    <>
      <Search addresses={addresses} />
      <div className={styles.appContainer}>
        <Outlet />
      </div>
    </>
  );
}