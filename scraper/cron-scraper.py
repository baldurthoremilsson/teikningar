#!/usr/bin/env python3

import argparse
import logging
from collections import namedtuple
import configparser
import json
import time
import requests
from datetime import datetime
import os
import shutil
import hashlib
from enum import Enum

logger = logging.getLogger(__name__)


PHASE_RESTART = "restart"
PHASE_FETCH_DESCENDING = "fetch-descending"
PHASE_FETCH_ASCENDING = "fetch-ascending"


def get_next_phase(phase: str) -> str:
    if phase == PHASE_RESTART:
        return PHASE_FETCH_DESCENDING
    elif phase == PHASE_FETCH_DESCENDING:
        return PHASE_FETCH_ASCENDING
    elif phase == PHASE_FETCH_ASCENDING:
        return PHASE_RESTART
    else:
        raise RuntimeError()


BASE_URL = "https://skjalasafn.reykjavik.is"
SCRAPE_URLS = {
    PHASE_FETCH_DESCENDING: "https://skjalasafn.reykjavik.is/fotoweb/archives/5000-A%C3%B0aluppdr%C3%A6ttir/",
    PHASE_FETCH_ASCENDING: "https://skjalasafn.reykjavik.is/fotoweb/archives/5000-A%C3%B0aluppdr%C3%A6ttir/;o=+",
    PHASE_RESTART: "",
}

EMPTY_STATUS = {
    "scrape_id": None,
    "phase": PHASE_RESTART,
    "next_url": None,
    "process_index": 0,
}
STATUSFILE = "status.json"
HEADERS = {"Accept": "application/vnd.fotoware.assetlist+json, */*; q=0.01"}

Config = namedtuple(
    "Config", "run_for_seconds sleep_milliseconds logfile data_dir log_to_stderr"
)


def read_config(configfile: str) -> Config:
    parser = configparser.ConfigParser()
    parser.read(configfile)
    config = Config(
        run_for_seconds=parser.getint("scrape", "run_for_seconds"),
        sleep_milliseconds=parser.getint("scrape", "sleep_milliseconds"),
        logfile=parser.get("scrape", "logfile"),
        data_dir=parser.get("scrape", "data_dir"),
        log_to_stderr=parser.get("scrape", "log_to_stderr", fallback="false"),
    )
    return config


def init_scrape(data_dir: str) -> dict:
    scrape_id = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    logger.info(f"Initializing scrape {scrape_id}")
    basepath = os.path.join(data_dir, scrape_id)

    addresses_dir = os.path.join(basepath, "addresses")
    os.makedirs(addresses_dir)

    status = EMPTY_STATUS.copy()
    status["scrape_id"] = scrape_id
    return status


def write_statusfile(status: dict, statusfile: str) -> None:
    with open(statusfile, "w") as f:
        json.dump(status, f)


def read_statusfile(statusfile: str) -> dict:
    with open(statusfile) as f:
        return json.load(f)


def fetch(url):
    logger.info(f"Fetching {url}")
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json()


def rename_current_scrape_dir(data_dir, scrape_id):
    scrape_dir = os.path.join(data_dir, scrape_id)
    last_dir = os.path.join(data_dir, "last")
    if os.path.exists(last_dir):
        raise Exception(f"Can not rename current scrape dir, {last_dir} exists")

    logger.info(f"Renaming current scrape dir: {scrape_dir} -> {last_dir}")
    os.rename(scrape_dir, last_dir)


def append_data(data_dir: str, status: dict, teikningar_data: dict) -> None:
    address = teikningar_data["address"]
    assert type(address) == str
    assert len(address) > 0

    address_file = os.path.join(data_dir, status["scrape_id"], f"{address}.json")
    if os.path.exists(address_file):
        with open(address_file) as f:
            address_list = json.load(f)
    else:
        address_list = []

    address_list.append(teikningar_data)

    with open(address_file, "w") as f:
        json.dump(address_list, f)


def process(data_dir: str, status: dict, data: list, url: str) -> None:
    for img in data:
        try:
            teikningar_data = {
                "address": img["metadata"]["210"]["value"],
                "date": img["metadata"]["30"]["value"],
                "description": img["metadata"]["205"]["value"],
                "hash": hashlib.md5(img["href"].encode()).hexdigest()[:7],
                "images": {preview["size"]: preview for preview in img["previews"]},
                "originalHref": img["href"],
            }
            append_data(data_dir, status, teikningar_data)
        except Exception:
            logger.warning(f"Processing error from {url}")
            continue


def scrape(run_for_seconds: int, data_dir: str, sleep_milliseconds: int):
    statusfile = os.path.join(data_dir, STATUSFILE)
    try:
        status = read_statusfile(statusfile)
    except FileNotFoundError:
        status = EMPTY_STATUS.copy()

    logger.info(f"Start scrape_id: {status['scrape_id']}")

    start_time = time.time()
    keep_running = True

    while keep_running:
        phase = status["phase"]
        if phase == PHASE_RESTART:
            if status["scrape_id"] is not None:
                rename_current_scrape_dir(data_dir, status["scrape_id"])
            status = init_scrape(data_dir)
            next_phase = get_next_phase(phase)
            status["phase"] = next_phase
            status["next_url"] = SCRAPE_URLS[next_phase]
        else:
            url = status["next_url"]
            response_data = fetch(url)
            data = response_data["data"]
            paging = response_data["paging"]

            if len(data) == 0:
                next_phase = get_next_phase(phase)
                status["phase"] = next_phase
                status["next_url"] = SCRAPE_URLS[next_phase]
            else:
                process(data_dir, status, data, url)
                next_path = paging["next"]
                status["next_url"] = f"{BASE_URL}{next_path}"

        write_statusfile(status, statusfile)
        time.sleep(sleep_milliseconds / 1000)
        keep_running = (time.time() - start_time) < run_for_seconds

    logger.info("End")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("configfile")
    args = parser.parse_args()

    config = read_config(args.configfile)
    logging.basicConfig(
        format="%(asctime)s [" + str(os.getpid()) + "] [%(levelname)s] %(message)s",
        filename=config.logfile,
        level=logging.INFO,
    )
    if config.log_to_stderr.lower() == "true":
        logging.getLogger().addHandler(logging.StreamHandler())

    scrape(
        config.run_for_seconds,
        config.data_dir,
        config.sleep_milliseconds,
    )


if __name__ == "__main__":
    main()
