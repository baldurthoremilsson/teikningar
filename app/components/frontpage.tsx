import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import overviewStyles from './overview.module.css';
import Card from "react-bootstrap/Card";
import { AppOutletContextType, AddressAndBlueprintInfo } from "../types";
import { DATA_URL_PREFIX, ORIGIN_URL_PREFIX } from '../constants';


const randIndex = (array: Array<any>) => Math.trunc(Math.random()*array.length);
const randItem = (array: Array<any>) => array[randIndex(array)];

export default function Frontpage() {
  const { addresses, setCurrentBlueprint, setTitle } = useOutletContext<AppOutletContextType>();
  const [randomBlueprints, setRandomBlueprints] = useState<AddressAndBlueprintInfo[]>([]);
  setCurrentBlueprint(null);

  useEffect(() => {
    setTitle("Teikningar");
  }, [setTitle]);

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
      <h3 style={{width: "100%", textAlign: "center"}}>Teikningar af handahófi</h3>
      <div className={overviewStyles.overviewContainer}>
      {randomBlueprints.map(({ address, blueprint }) => (
        <Link to={`/${address}/${blueprint.hash}/${blueprint.description}`} key={blueprint.hash}>
          <Card className={`${overviewStyles.card} m-3`}>
            <Card.Img variant="top" src={ORIGIN_URL_PREFIX + blueprint.images["400"].href} />
              <Card.Body>
                  <Card.Text>{blueprint.description} <div className={overviewStyles.cardDate}>{blueprint.date}</div></Card.Text>
              </Card.Body>
            <Card.Footer>{blueprint.address}</Card.Footer>
          </Card>
        </Link>
      ))}
      </div>
    </div>
  );
}