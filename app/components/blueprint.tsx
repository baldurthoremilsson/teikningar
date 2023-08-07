import styles from './blueprint.module.css';
import { useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

const URL_PREFIX = 'https://skjalasafn.reykjavik.is';

export default function Blueprint() {
  const navigate = useNavigate();
  const { blueprints, setCurrentBlueprint } = useOutletContext();
  const { hash, description } = useParams();
  let blueprint = blueprints.find(blueprint => blueprint.hash === hash);
  useEffect(() => {
    setCurrentBlueprint(blueprint);
  }, [blueprint]);

  useEffect(() => {
    if(description !== blueprint.description) {
      navigate(`../${blueprint.description}`, {replace: true, relative: "path"});
    }
  }, [description, blueprint]);

  return (
    <div className={styles.blueprintContainer}>
      <img src={URL_PREFIX + blueprint.images["2400"].href} className={styles.blueprintImg}/>
    </div>
  );
}