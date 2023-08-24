import { useOutletContext, useParams } from "react-router-dom";
import styles from './overview.module.css';
import { useEffect } from "react";
import { AddressOutletContextType, BlueprintInfo } from "../types";
import BlueprintCardLink from "./blueprintCardLink";

const blueprintSortFn = (a: BlueprintInfo, b: BlueprintInfo) => a.date > b.date ? -1 : 1;

export default function Overview() {
  const { blueprints, setCurrentBlueprint } = useOutletContext<AddressOutletContextType>();
  setCurrentBlueprint(null);
  const { address } = useParams();
  useEffect(() => {
    if(address) {
      document.title = address;
    }
  }, [address]);

  return (
    <div className={styles.overviewContainer}>
      {address && blueprints.sort(blueprintSortFn).map(blueprint => <BlueprintCardLink address={address} blueprint={blueprint} key={blueprint.hash}/>)}
    </div>
  );
}