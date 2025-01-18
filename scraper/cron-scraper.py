#!/usr/bin/env python3

import argparse
import logging
from collections import namedtuple
import configparser
import os
import sys

logger = logging.getLogger(__name__)

URL = "https://skjalasafn.reykjavik.is/fotoweb/archives/5000-A%C3%B0aluppdr%C3%A6ttir/;o=+;p={index}"
HEADERS = {"Accept": "application/vnd.fotoware.assetlist+json, */*; q=0.01"}

### CONFIG
Config = namedtuple("Config", "sleep_milliseconds statusfile logfile")


def read_config(configfile: str) -> Config:
    parser = configparser.ConfigParser()
    parser.read(configfile)
    sleep_milliseconds = parser.getint("scrape", "sleep_milliseconds")
    statusfile = parser.get("scrape", "statusfile")
    logfile = parser.get("scrape", "logfile")
    config = Config(
        sleep_milliseconds=sleep_milliseconds, statusfile=statusfile, logfile=logfile
    )
    return config


### CONFIG END


### STATUSFILE
def read_statusfile(statusfile: str):
    parser = configparser.ConfigParser()
    parser.read(configfile)


### STATUSFILE END


### SCRAPE
def scrape(statusfile: str, sleep_milliseconds: int):
    status = read_statusfile()
    while True:
        fetch()
        process()
        write_status()
        sleep()


### SCRAPE END


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("configfile")
    args = parser.parse_args()

    config = read_config(args.configfile)
    logging.basicConfig(
        format="%(asctime)s [%(levelname)s] %(message)s",
        filename=config.logfile,
        level=logging.INFO,
    )
    logger.info("Running")
    return
    scrape(config.statusfile, config.sleep_milliseconds)


if __name__ == "__main__":
    main()
