import { Outlet, useLoaderData } from "react-router-dom";


export default function Address() {
  const blueprints = useLoaderData();
  return <Outlet context={blueprints} />;
}