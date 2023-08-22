import { Outlet, useLoaderData, useOutletContext } from "react-router-dom";
import { AppOutletContextType, BlueprintInfo } from "../types";


export default function Address() {
  const blueprints = useLoaderData() as BlueprintInfo[];
  const { setCurrentBlueprint, setTitle } = useOutletContext<AppOutletContextType>();
  return <Outlet context={{blueprints, setCurrentBlueprint, setTitle}} />;
}