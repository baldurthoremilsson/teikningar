import { Card, CardGroup } from "react-bootstrap";
import { useOutletContext } from "react-router-dom";
import styles from './overview.module.css';

const URL_PREFIX = 'https://skjalasafn.reykjavik.is';

export default function Overview() {
  const blueprints = useOutletContext();
  console.log(blueprints);
  return (
    <div className={styles.overviewContainer}>
      {blueprints.map(blueprint => (
          <Card className={`${styles.card} m-3`}>
            <Card.Img variant="top" src={URL_PREFIX + blueprint.images["400"].href} />
              <Card.Body>
                <Card.Text>{blueprint.address} {blueprint.date} {blueprint.description}</Card.Text>
            </Card.Body>
          </Card>
      ))}
    </div>
  );
}