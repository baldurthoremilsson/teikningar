import { Outlet, useLoaderData, useOutletContext } from "react-router-dom";
import { AppOutletContextType, BlueprintInfo } from "@/lib/types";

export default function Address() {
  const blueprints = useLoaderData() as BlueprintInfo[];
  const { setCurrentBlueprint } = useOutletContext<AppOutletContextType>();
  return <Outlet context={{ blueprints, setCurrentBlueprint }} />;
}
