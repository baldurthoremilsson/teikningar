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
import hashlib
import re
import traceback

logger = logging.getLogger(__name__)


PHASE_RESTART = "restart"
PHASE_FETCH_DESCENDING = "fetch-descending"
PHASE_FETCH_ASCENDING = "fetch-ascending"

DATE_KEY = "30"
STREET_NAME_KEY = "203"
HOUSE_NUMBER_KEY = "204"
ADDRESS_KEY = "210"
DESCRIPTION_KEY = "214"


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

    if os.path.exists(scrape_dir):
        logger.info(f"Renaming current scrape dir: {scrape_dir} -> {last_dir}")
        os.rename(scrape_dir, last_dir)


def append_data(data_dir: str, status: dict, address: str, img_data: dict) -> None:
    address_file = os.path.join(
        data_dir, status["scrape_id"], "addresses", f"{address}.json"
    )
    if os.path.exists(address_file):
        with open(address_file) as f:
            address_list = json.load(f)
    else:
        address_list = []

    address_list.append(img_data)

    with open(address_file, "w") as f:
        json.dump(address_list, f)


def single_space(address: str) -> str:
    return " ".join(part for part in address.split(" ") if part != "")


def parse_address(address: str, href: str) -> list[str]:
    """
    Check: what's the usual case for 2A or 2a? Uppercase or lowercase?
    Edge cases:
    'Básbryggja 19-21 Naustabryggja 24'
    'Básbryggja 19-21 Naustabryggja 26'
    'Dragháls 18-26 18'
    'Dragháls 18-26 20'
    'Dragháls 18-26 22'
    'Dragháls 18-26 24'
    'Dragháls 18-26 26'
    'Eirhöfði 8 Breiðhöfði 15'
    'Gullengi 11*'
    'Hæðargarður 27 A'
    'Klapparstígur 1- 7'
    'Laugavegur 22 -Klapparstígur 33'
    'Ljósaland 1-25 10'
    'Ljósaland 1-25 12'
    'Ljósaland 1-25 14'
    'Ljósaland 1-25 16'
    'Ljósaland 1-25 18'
    'Ljósaland 1-25 2'
    'Ljósaland 1-25 20'
    'Ljósaland 1-25 22'
    'Ljósaland 1-25 24'
    'Ljósaland 1-25 4'
    'Ljósaland 1-25 6'
    'Ljósaland 1-25 8'
    'Naustabryggja 55- 57'
    'Skeifan 15, Faxafen 8'
    'Skrauthólar 5 vegsvæði Vesturlandsvegar'
    'Skrauthólar 5 vegsvæði hliðarvegar'
    'Smábýli 12 vegsvæði'
    'Sundahöfn 1.3, 1.4'
    'Ártún vegsvæði 2 hliðarvegar'
    'Ártún vegsvæði 3 hliðarvegar'

    'laugavegur-60a': ['Laugavegur 60A', 'Laugavegur 60a']
    'eddufell-8': ['Eddufell 8', 'eDDUFELL 8']
    'eddufell-2': ['Eddufell 2', 'eDDUFELL 2']
    'eddufell-4': ['Eddufell 4', 'eDDUFELL 4']
    'eddufell-6': ['Eddufell 6', 'eDDUFELL 6']
    'skipholt-17a': ['Skipholt 17A', 'Skipholt 17a']
    'kleppsvegur-bensinstoed': ['Kleppsvegur bensínstöð'
    'Kleppsvegur Bensínstöð']
    'vesturgata-5b': ['Vesturgata 5B', 'Vesturgata 5b']
    'korngardar-13a': ['Korngarðar 13A', 'Korngarðar 13a']
    'ystibaer-9': ['Ystibær 9', 'ySTIBÆR 9']
    'laekjargata-14a': ['Lækjargata 14a', 'Lækjargata 14A']
    """
    if " - " in address:
        # "Fossháls 13-15 - Dragháls 14-16"
        addresses = address.split(" - ")
    elif "/" in address:
        # "Thorvaldsenstræti 2-6/Aðalstræti 11"
        addresses = address.split("/")
    else:
        addresses = [address]

    return_addresses = set()
    for addr in addresses:
        addr_strip = addr.strip()
        match = re.match("(?P<street_name>.*) (?P<start>\d+)-(?P<end>\d+)", addr_strip)
        if match:
            groupdict = match.groupdict()
            street_name = groupdict["street_name"]
            if " " in street_name:
                logger.warning(f"Space found in street name: `{street_name}` {href}")
            start = int(groupdict["start"])
            end = int(groupdict["end"])
            while start <= end:
                return_addresses.add(single_space(f"{street_name} {start}"))
                start += 2
        else:
            return_addresses.add(single_space(addr_strip))

    return list(return_addresses)


def convert_image(img) -> tuple[list[str], dict]:
    href = img["href"]

    meta = img["metadata"]
    if meta == {}:
        logger.warning(f"Missing metadata for {href}")
        return [], {}

    if ADDRESS_KEY in meta:
        address = meta[ADDRESS_KEY]["value"].strip()
    else:
        street_name = meta[STREET_NAME_KEY]["value"].strip()
        house_number = meta[HOUSE_NUMBER_KEY]["value"].strip()
        address = f"{street_name} {house_number}"
    parsed_addresses = parse_address(address, href)
    if DESCRIPTION_KEY in meta:
        description = meta[DESCRIPTION_KEY]["value"].strip()
    else:
        description = "[Lýsingu vantar]"

    date = meta[DATE_KEY]["value"].strip() if DATE_KEY in meta else None
    hash = hashlib.md5(href.encode()).hexdigest()[:7]

    data = {
        "address": address,
        "date": date,
        "description": description,
        "hash": hash,
        "images": {preview["size"]: preview for preview in img["previews"]},
        "originalHref": href,
    }
    return parsed_addresses, data


def process(data_dir: str, status: dict, data: list, url: str) -> None:
    for i, img in enumerate(data):
        try:
            addresses, img_data = convert_image(img)
            for address in addresses:
                append_data(data_dir, status, address, img_data)
        except Exception:
            logger.warning(f"Processing error {i}: {url}")
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
    try:
        main()
    except Exception as e:
        stacktrace = traceback.format_exc()
        logger.error(f"Error: {e}\n{stacktrace}")
