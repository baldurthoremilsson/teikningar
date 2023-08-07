import { Outlet, useLoaderData, useOutletContext } from "react-router-dom";


export default function Address() {
  const blueprints = useLoaderData();
  const { setCurrentBlueprint } = useOutletContext();
  return <Outlet context={{blueprints, setCurrentBlueprint}} />;
}