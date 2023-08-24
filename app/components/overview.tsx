import Card from "react-bootstrap/Card";
import { Link, useOutletContext, useParams } from "react-router-dom";
import styles from './overview.module.css';
import { useEffect } from "react";
import { AddressOutletContextType, BlueprintInfo } from "../types";
import { ORIGIN_URL_PREFIX } from '../constants';

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
      {blueprints.sort(blueprintSortFn).map(blueprint => (
        <Link to={`${blueprint.hash}/${blueprint.description}`} key={blueprint.hash}>
          <Card className={`${styles.card} m-3`}>
            <Card.Img variant="top" src={ORIGIN_URL_PREFIX + blueprint.images["400"].href} />
              <Card.Body>
                <Card.Text>{blueprint.description} <div className={styles.cardDate}>{blueprint.date}</div></Card.Text>
            </Card.Body>
            <Card.Footer>{blueprint.address}</Card.Footer>
          </Card>
        </Link>
      ))}
    </div>
  );
}