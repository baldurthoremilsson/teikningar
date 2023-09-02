import {
  Outlet,
  useLoaderData,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { AppOutletContextType, BlueprintInfo } from "@/lib/types";
import { useEffect } from "react";

export default function Address() {
  const blueprints = useLoaderData() as BlueprintInfo[];
  const { setCurrentBlueprint } = useOutletContext<AppOutletContextType>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.size !== 0) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return <Outlet context={{ blueprints, setCurrentBlueprint }} />;
}
