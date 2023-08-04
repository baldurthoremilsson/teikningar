import { Outlet, useLoaderData } from 'react-router-dom';
import Search from './search'
import { Container } from 'react-bootstrap';

export default function App() {
  const addresses = useLoaderData();
  return (
    <>
      <Search addresses={addresses} />
      <Container fluid>
        <Outlet />
      </Container>
    </>
  );
}