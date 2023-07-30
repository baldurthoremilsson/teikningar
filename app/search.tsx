"use client"

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './search.module.css';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import { useCallback, useEffect, useState } from 'react';

type AddressType = Array<{
  address: string,
  normalized: string,
  count: number,
}>

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

export default function Search() {
  const [addresses, setAddresses] = useState<AddressType>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [searchBoxPlaceholder, setSearchBoxPlaceholder] = useState("Hleð gögnum");
  const [searchResults, setSearchResults] = useState<AddressType>([]);
  const [searcBoxClassNames, setSearchBoxClassNames] = useState<Array<string>>([styles.searchBox]);

  useEffect(()=>{
    fetch('addresses.json')
      .then(response => response.json())
      .then(setAddresses);
  }, []);

  useEffect(() => {
    setAddressesLoaded(Object.keys(addresses).length !== 0);
  }, [addresses]);

  useEffect(() => {
    if(addressesLoaded) {
      setSearchBoxPlaceholder("Heimilisfang");
    } else {
      setSearchBoxPlaceholder("Hleð gögnum");
    }
  }, [addressesLoaded]);

  const searchFilter = useCallback((query: string) => {
    if(query.length === 0) {
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
    }
  }, [setSearchResults, addresses]);

  useEffect(() => {
    let classNames = [styles.searchBox];
    if(searchResults.length > 0) {
        classNames.push(styles.searchBoxHasResults)
    }
    setSearchBoxClassNames(classNames);
  }, [setSearchBoxClassNames, searchResults]);

  return (
    <Container fluid className={styles.searchContainer}>
    <Form.Control
        className={searcBoxClassNames.join(' ')}
        placeholder={searchBoxPlaceholder}
        disabled={!addressesLoaded}
        onChange={(e) => searchFilter(e.target.value)}
    />
    <div className={styles.searchResultsContainer}>
    <ListGroup className={styles.searchResultsList}>
        {searchResults.slice(0, MAX_SEARCH_RESULTS).map((item) => (
        <ListGroup.Item
            key={item.address}
            action
            href={`/${item.normalized}`}
            onClick={(e) => {e.preventDefault(); return false}}
        >
            {item.address}
            <div className={styles.searchResultsDrawingsCount}>{item.count} {singularOrPlural(item.count, "teikning", "teikningar")}</div>
        </ListGroup.Item>
        ))}
        {searchResults.length > MAX_SEARCH_RESULTS &&
        <ListGroup.Item className={styles.searchResultsExtraCount}>
            og {searchResults.length-MAX_SEARCH_RESULTS} til viðbótar
        </ListGroup.Item>
        }
    </ListGroup>
    </div>
    </Container>
  )
}
