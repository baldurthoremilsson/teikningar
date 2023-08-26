"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./topnav.module.css";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AddressInfo, BlueprintInfo } from "@/lib/types";
import { MAX_SEARCH_RESULTS, ORIGIN_URL_PREFIX } from "@/lib/constants";
import Image from "next/image";
import LocalDB, { useLocalDBValue } from "@/lib/localdb";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace("á", "a")
    .replace("é", "e")
    .replace("í", "i")
    .replace("ó", "o")
    .replace("ú", "u")
    .replace("ý", "y")
    .replace("ð", "d")
    .replace("þ", "th")
    .replace("æ", "ae")
    .replace("ö", "oe");

const singularOrPlural = (i: number, singular: string, plural: string) =>
  i % 10 === 1 && i % 100 !== 11 ? singular : plural;

type PropsType = {
  addresses: AddressInfo[];
  currentBlueprint: BlueprintInfo | null;
};

export default function TopNav({ addresses, currentBlueprint }: PropsType) {
  const [displaySearchResults, setDisplaySearchResults] =
    useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<AddressInfo[]>([]);
  const [searcBoxClassNames, setSearchBoxClassNames] = useState<Array<string>>([
    styles.searchBox,
  ]);
  const [searchAddress, setSearchAddress] = useState<string>(
    useParams().address || "",
  );
  const [blueprintIsFavorite, setBlueprintIsFavorite] = useState(
    currentBlueprint !== null && LocalDB.isFavorite(currentBlueprint),
  );
  const localDBvalue = useLocalDBValue();
  const { address } = useParams();

  useEffect(() => {
    setSearchAddress(address || "");
  }, [address]);

  useEffect(() => {
    setBlueprintIsFavorite(
      currentBlueprint !== null && LocalDB.isFavorite(currentBlueprint),
    );
  }, [currentBlueprint, localDBvalue]);

  const updateSearch = useCallback(
    (query: string) => {
      setSearchAddress(query);
      if (query.length === 0) {
        setDisplaySearchResults(false);
        setSearchResults([]);
      } else {
        const queries = query
          .split(" ")
          .filter((q) => q.length)
          .map(normalize);
        let results = addresses;
        for (let q of queries) {
          results = results.filter((a) => a.normalized.indexOf(q) >= 0);
        }
        results.sort((a, b) => {
          for (let q of queries) {
            const indexDiff = a.normalized.indexOf(q) - b.normalized.indexOf(q);
            if (indexDiff !== 0) {
              return indexDiff;
            }
          }
          if (a.normalized < b.normalized) {
            return -1;
          } else {
            return 1;
          }
        });
        setSearchResults(results);
        setDisplaySearchResults(true);
      }
    },
    [addresses],
  );

  const pickSearchResult = useCallback((address: string) => {
    setSearchAddress(address);
    setDisplaySearchResults(false);
    setSearchResults([]);
  }, []);

  useEffect(() => {
    let classNames = [styles.searchBox];
    if (displaySearchResults) {
      classNames.push(styles.searchBoxHasResults);
    }
    setSearchBoxClassNames(classNames);
  }, [displaySearchResults]);

  const markAsFavorite = useCallback(() => {
    if (currentBlueprint && address) {
      LocalDB.addFavorite(currentBlueprint, address);
    }
  }, [currentBlueprint, address]);

  const unmarkAsFavorite = useCallback(() => {
    if (currentBlueprint) {
      LocalDB.removeFavorite(currentBlueprint);
    }
  }, [currentBlueprint]);

  return (
    <>
      <Container fluid className={styles.logoContainer}>
        <Link to="/">
          <Image
            src="/logo.png"
            width={36}
            height={36}
            alt="logo"
            title="Forsíða"
          />
        </Link>
        <Container fluid className={styles.searchContainer}>
          <Form.Control
            className={searcBoxClassNames.join(" ")}
            placeholder={"Heimilisfang"}
            value={searchAddress}
            onChange={(e) => updateSearch(e.target.value)}
          />
          {displaySearchResults && (
            <div className={styles.searchResultsContainer}>
              <ListGroup className={styles.searchResultsList}>
                {searchResults.slice(0, MAX_SEARCH_RESULTS).map((item) => (
                  <Link
                    to={`/${item.address}`}
                    key={item.address}
                    className={"list-group-item"}
                    onClick={() => pickSearchResult(item.address)}
                  >
                    {item.address}
                    <div className={styles.searchResultsDrawingsCount}>
                      {item.count}{" "}
                      {singularOrPlural(item.count, "teikning", "teikningar")}
                    </div>
                  </Link>
                ))}
                {searchResults.length > MAX_SEARCH_RESULTS && (
                  <ListGroup.Item className={styles.searchResultsExtraCount}>
                    og {searchResults.length - MAX_SEARCH_RESULTS} til viðbótar
                  </ListGroup.Item>
                )}
                {searchResults.length === 0 && (
                  <ListGroup.Item className={styles.searchResultsExtraCount}>
                    Fann engin heimilisföng
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          )}
        </Container>
      </Container>
      {currentBlueprint && (
        <div className={styles.blueprintInfoContainer}>
          <Link to={`/${address}`} className={styles.infoLink}>
            Allar myndir
          </Link>
          <span className={styles.infoDescription}>
            {currentBlueprint.description}
          </span>
          {blueprintIsFavorite && (
            <span
              className={styles.infoFavorite}
              title="Afmerkja sem uppáhalds"
              onClick={unmarkAsFavorite}
            >
              ★
            </span>
          )}
          {!blueprintIsFavorite && (
            <span
              className={styles.infoFavorite}
              title="Merkja sem uppáhalds"
              onClick={markAsFavorite}
            >
              ☆
            </span>
          )}
          <span className={styles.infoDate}>{currentBlueprint.date}</span>
          <Link
            to={ORIGIN_URL_PREFIX + currentBlueprint.originalHref}
            className={styles.infoLink}
            target="_blank"
          >
            Skjalasafnsvefur
          </Link>
        </div>
      )}
    </>
  );
}
