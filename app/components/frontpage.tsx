import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import overviewStyles from './overview.module.css';
import Card from "react-bootstrap/Card";

const URL_PREFIX = 'https://skjalasafn.reykjavik.is';

const randIndex = (array: Array<any>) => Math.trunc(Math.random()*array.length);
const randItem = (array: Array<any>) => array[randIndex(array)];

export default function Frontpage() {
  const { addresses, setCurrentBlueprint } = useOutletContext();
  const [randomBlueprints, setRandomBlueprints] = useState<any[]>([]);
  setCurrentBlueprint(null);

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
        let response = await fetch(`/addresses/${addrinfo.address}.json`);
        let blueprints = await response.json();
        return {
            address: addrinfo.address,
            blueprint: randItem(blueprints),
        };
      }));
      console.log(blueprints);
      setRandomBlueprints(blueprints);
    }
    fetchData();
    //setRandomBlueprints(randomAddresses);
  }, [addresses, setRandomBlueprints]);

  return (
    <div>
      <h3 style={{width: "100%", textAlign: "center"}}>Teikningar af handahófi</h3>
      <div className={overviewStyles.overviewContainer}>
      {randomBlueprints.map(({ address, blueprint }) => (
        <Link to={`/${address}/${blueprint.hash}/${blueprint.description}`} key={blueprint.hash}>
          <Card className={`${overviewStyles.card} m-3`}>
            <Card.Img variant="top" src={URL_PREFIX + blueprint.images["400"].href} />
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