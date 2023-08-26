import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import overviewStyles from './overview.module.css';
import { AppOutletContextType, AddressAndBlueprintInfo, } from "@/lib/types";
import { DATA_URL_PREFIX, MAX_RECENTLY_VIEWED_RESULTS } from '@/lib/constants';
import BlueprintCardLink from "./blueprintCardLink";
import { useLocalDBValue } from '@/lib/localdb'
import styles from './frontpage.module.css';


const randIndex = (array: Array<any>) => Math.trunc(Math.random()*array.length);
const randItem = (array: Array<any>) => array[randIndex(array)];

export default function Frontpage() {
  const { addresses, setCurrentBlueprint } = useOutletContext<AppOutletContextType>();
  const [randomBlueprints, setRandomBlueprints] = useState<AddressAndBlueprintInfo[]>([]);
  const { favorites, recentlyViewed } = useLocalDBValue();
  setCurrentBlueprint(null);

  useEffect(() => {
    document.title = 'Teikningar';
  }, []);

  useEffect(() => {
    async function fetchData() {
      let indices = [];
      let randomAddresses = [];
      while(randomAddresses.length < 3) {
          let randomIndex = randIndex(addresses);
          if(indices.indexOf(randomIndex) === -1) {
              indices.push(randomIndex);
              randomAddresses.push(addresses[randomIndex]);
          }
      }
      let blueprints = await Promise.all(randomAddresses.map(async (addrinfo) => {
        let response = await fetch(`${DATA_URL_PREFIX}/addresses/${addrinfo.address}.json`);
        let blueprints = await response.json();
        return {
            address: addrinfo.address,
            blueprint: randItem(blueprints),
        };
      }));
      setRandomBlueprints(blueprints);
    }
    fetchData();
  }, [addresses, setRandomBlueprints]);

  return (
    <div>
      {favorites.length > 0 && <>
        <h3 className={styles.heading}>Uppáhalds ★</h3>
        <div className={overviewStyles.overviewContainer}>
          {favorites.map(({ address, blueprint }: AddressAndBlueprintInfo) => <BlueprintCardLink address={address} blueprint={blueprint} key={blueprint.hash} />)}
        </div>
      </>}
      {recentlyViewed.length > 0 && <>
        <h3 className={styles.heading}>Nýlega skoðað</h3>
        <div className={overviewStyles.overviewContainer}>
          {recentlyViewed.slice(0, MAX_RECENTLY_VIEWED_RESULTS).map(({ address, blueprint }: AddressAndBlueprintInfo) => <BlueprintCardLink address={address} blueprint={blueprint} key={blueprint.hash} />)}
        </div>
      </>}
      <h3 className={styles.heading}>Teikningar af handahófi</h3>
      <div className={overviewStyles.overviewContainer}>
        {randomBlueprints.map(({ address, blueprint }) => <BlueprintCardLink address={address} blueprint={blueprint} key={blueprint.hash}/>)}
      </div>
    </div>
  );
}