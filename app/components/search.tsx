"use client"

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './search.module.css';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';


const MAX_SEARCH_RESULTS = 5;

const normalize = (s: string) => s.toLowerCase()
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

const singularOrPlural = (i: number, singular: string, plural: string) => (i % 10 === 1 && i % 100 !== 11) ? singular : plural;

export type AddressType = {
  address: string,
  normalized: string,
  count: number,
};

type PropsType = {
  addresses: Array<AddressType>,
};

export default function Search({ addresses }: PropsType) {
  const [displaySearchResults, setDisplaySearchResults] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Array<AddressType>>([]);
  const [searcBoxClassNames, setSearchBoxClassNames] = useState<Array<string>>([styles.searchBox]);
  const [searchAddress, setSearchAddress] = useState<string>(useParams().address || "")
  const { address } = useParams();

  useEffect(() => {
    setSearchAddress(address);
  }, [address]);

  const blah = useCallback((query: string) => {
    setSearchAddress(query);
    if(query.length === 0) {
      setDisplaySearchResults(false)
      setSearchResults([]);
    } else {
      const queries = query.split(" ").filter(q => q.length).map(normalize);
      let results = addresses;
      for (let q of queries) {
          results = results.filter(a => a.normalized.indexOf(q) >= 0);
      }
      results.sort((a, b) => {
        for(let q of queries) {
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
  }, [addresses])

  const pickSearchResult = useCallback((address: string) => {
    setSearchAddress(address);
    setDisplaySearchResults(false);
    setSearchResults([]);
  }, []);

  useEffect(() => {
    let classNames = [styles.searchBox];
    if(displaySearchResults) {
        classNames.push(styles.searchBoxHasResults)
    }
    setSearchBoxClassNames(classNames);
  }, [displaySearchResults]);

  return (
    <Container fluid className={styles.searchContainer}>
    <Form.Control
        className={searcBoxClassNames.join(' ')}
        placeholder={"Heimilisfang"}
        value={searchAddress}
        onChange={(e) => blah(e.target.value)}
    />
    {displaySearchResults &&
    <div className={styles.searchResultsContainer}>
    <ListGroup className={styles.searchResultsList}>
        {searchResults.slice(0, MAX_SEARCH_RESULTS).map((item) => (
        <Link to={`/${item.address}`} key={item.address} className={"list-group-item"} onClick={() => pickSearchResult(item.address)}>
            {item.address}
            <div className={styles.searchResultsDrawingsCount}>{item.count} {singularOrPlural(item.count, "teikning", "teikningar")}</div>
        </Link>
        ))}
        {searchResults.length > MAX_SEARCH_RESULTS &&
        <ListGroup.Item className={styles.searchResultsExtraCount}>
            og {searchResults.length-MAX_SEARCH_RESULTS} til viðbótar
        </ListGroup.Item>
        }
        {searchResults.length === 0 &&
          <ListGroup.Item className={styles.searchResultsExtraCount}>
            Fann engin heimilisföng
          </ListGroup.Item>
        }
    </ListGroup>
    </div>
}
    </Container>
  )
}
