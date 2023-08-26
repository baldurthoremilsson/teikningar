import { Link } from "react-router-dom";
import Card from "react-bootstrap/Card";
import { BlueprintInfo } from "@/lib/types";
import styles from './blueprintCardLink.module.css';
import { ORIGIN_URL_PREFIX } from "@/lib/constants";


export default function BlueprintCardLink({ address, blueprint }: { address: string, blueprint: BlueprintInfo }) {
    return (
        <Link to={`/${address}/${blueprint.hash}/${blueprint.description}`}>
          <Card className={`${styles.card} m-3`}>
            <Card.Img variant="top" src={ORIGIN_URL_PREFIX + blueprint.images["400"].href} className={styles.cardImage}/>
              <Card.Body>
                  <Card.Text>{blueprint.description} <span className={styles.cardDate}>{blueprint.date}</span></Card.Text>
              </Card.Body>
            <Card.Footer>{blueprint.address}</Card.Footer>
          </Card>
        </Link>
    );
}