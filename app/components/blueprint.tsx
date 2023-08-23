import styles from './blueprint.module.css';
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { AddressOutletContextType } from '../types';
import { ORIGIN_URL_PREFIX } from '../constants';

export default function Blueprint() {
  const navigate = useNavigate();
  const { blueprints, setCurrentBlueprint, setTitle } = useOutletContext<AddressOutletContextType>();
  const { address, hash, description } = useParams();
  const [zoom, setZoom] = useState(false);
  const [className, setClassName] = useState("");
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  let blueprint = blueprints.find(blueprint => blueprint.hash === hash) || null;
  useEffect(() => {
    setCurrentBlueprint(blueprint);
  }, [blueprint, setCurrentBlueprint]);
  
  useEffect(() => {
    if(blueprint !== null) {
      setTitle(`${blueprint.description} - ${address}`);
    }
  }, [address, blueprint, setTitle]);

  useEffect(() => {
    if(blueprint !== null && description !== blueprint.description) {
      navigate(`/${address}/${hash}/${blueprint.description}`, {replace: true, relative: "path"});
    }
  }, [address, blueprint, description, hash, navigate]);

  useEffect(() => {
    if(zoom) {
        setClassName(styles.zoomOut);
    } else {
        setClassName(`${styles.zoomIn} ${styles.blueprintImg}`);
    }
  }, [zoom]);

  useEffect(() => {
    if(zoom) {
        containerRef.current?.parentElement?.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: "instant",
        });
    }
  }, [zoom, className, scrollX, scrollY, containerRef]);

  const toggleZoom = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if(blueprint !== null) {
      let img = event.currentTarget;
      let parent = img.parentElement as HTMLDivElement;

      let clickX = event.clientX - img.offsetLeft;
      let clickY = event.clientY - img.offsetTop;
      let targetWidth = img.offsetWidth;
      let targetHeight = img.offsetHeight;
      let deltaX = clickX / targetWidth;
      let deltaY = clickY / targetHeight;

      let containerWidth = parent.offsetWidth;
      let containerHeight = parent.offsetHeight;

      let targetX = event.clientX - parent.offsetLeft;
      let targetY = event.clientY - parent.offsetTop;

      let imgWidth = blueprint.images["2400"].width;
      let imgHeight = blueprint.images["2400"].height;
      let imgX = Math.trunc(imgWidth * deltaX);
      let imgY = Math.trunc(imgHeight * deltaY);

      let maxScrollX = Math.max(imgWidth - containerWidth, 0);
      let maxScrollY = Math.max(imgHeight - containerHeight, 0);

      setScrollX(Math.min(Math.max(imgX - targetX, 0), maxScrollX));
      setScrollY(Math.min(Math.max(imgY - targetY, 0), maxScrollY));

      setZoom(!zoom);
    }
  }, [zoom, blueprint]);

  return (
    <div className={styles.blueprintContainer} ref={containerRef}>
      {blueprint !== null &&
        <img src={ORIGIN_URL_PREFIX + blueprint.images["2400"].href} className={className} onClick={toggleZoom} alt={blueprint.description}/>
      }
    </div>
  );
}