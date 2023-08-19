import styles from './blueprint.module.css';
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

const URL_PREFIX = 'https://skjalasafn.reykjavik.is';

export default function Blueprint() {
  const navigate = useNavigate();
  const { blueprints, setCurrentBlueprint } = useOutletContext();
  const { hash, description } = useParams();
  const [zoom, setZoom] = useState(false);
  const [className, setClassName] = useState("");
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef(null);

  let blueprint = blueprints.find(blueprint => blueprint.hash === hash);
  useEffect(() => {
    setCurrentBlueprint(blueprint);
  }, [blueprint, setCurrentBlueprint]);

  useEffect(() => {
    if(description !== blueprint.description) {
      navigate(`../${blueprint.description}`, {replace: true, relative: "path"});
    }
  }, [description, blueprint]);

  useEffect(() => {
    if(zoom) {
        setClassName(styles.zoomOut);
    } else {
        setClassName(`${styles.zoomIn} ${styles.blueprintImg}`);
    }
  }, [zoom]);

  useEffect(() => {
    if(zoom) {
        containerRef.current.parentElement.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: "instant",
        });
    }
  }, [zoom, className, scrollX, scrollY, containerRef]);

  const toggleZoom = useCallback((e) => {
    console.log(e);
    let clickX = e.clientX - e.target.offsetLeft;
    let clickY = e.clientY - e.target.offsetTop;
    let targetWidth = e.target.offsetWidth;
    let targetHeight = e.target.offsetHeight;
    let deltaX = clickX / targetWidth;
    let deltaY = clickY / targetHeight;

    let containerWidth = e.target.parentElement.offsetWidth;
    let containerHeight = e.target.parentElement.offsetHeight;

    let targetX = e.clientX - e.target.parentElement.offsetLeft;
    let targetY = e.clientY - e.target.parentElement.offsetTop;

    let imgWidth = blueprint.images["2400"].width;
    let imgHeight = blueprint.images["2400"].height;
    let imgX = Math.trunc(imgWidth * deltaX);
    let imgY = Math.trunc(imgHeight * deltaY);

    let maxScrollX = Math.max(imgWidth - containerWidth, 0);
    let maxScrollY = Math.max(imgHeight - containerHeight, 0);

    setScrollX(Math.min(Math.max(imgX - targetX, 0), maxScrollX));
    setScrollY(Math.min(Math.max(imgY - targetY, 0), maxScrollY));

    setZoom(!zoom);
  }, [zoom, blueprint]);

  return (
    <div className={styles.blueprintContainer} ref={containerRef}>
      <img src={URL_PREFIX + blueprint.images["2400"].href} className={className} onClick={toggleZoom}/>
    </div>
  );
}