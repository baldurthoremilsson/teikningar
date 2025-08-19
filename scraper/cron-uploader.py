#!/usr/bin/env python3

import argparse
import logging
from collections import namedtuple
import configparser
import json
import os
import csv
import shutil
import boto3
from pathlib import Path

logger = logging.getLogger(__name__)

DATE_KEY = "30"
STREET_NAME_KEY = "203"
HOUSE_NUMBER_KEY = "204"
ADDRESS_KEY = "210"
DESCRIPTION_KEY = "214"


Config = namedtuple(
    "Config",
    """
        data_dir
        aws_config_file
        logfile
        log_to_stderr
    """,
)

AwsConfig = namedtuple(
    "AwsConfig",
    """
        aws_endpoint_url
        aws_access_key_id
        aws_secret_access_key
        bucket_name
        bucket_path_prefix
    """,
)


class Paths:
    def __init__(self, data_dir):
        self.data_dir = Path(data_dir)
        self.last_dir = self.data_dir / "last"
        self.addresses_dir = self.last_dir / "addresses"
        self.uploaded_dir = self.data_dir / "uploaded"
        self.uploaded_addresses_dir = self.uploaded_dir / "addresses"

        self.stadfangaskra_path = self.data_dir / "Stadfangaskra.csv"
        self.address_index_path = self.last_dir / "addresses.json"
        self.coord_bounds_path = self.last_dir / "coord-bounds.json"


def read_configs(configfile: str) -> tuple[Config, AwsConfig]:
    parser = configparser.ConfigParser()
    parser.read(configfile)
    config = Config(
        logfile=parser.get("upload", "logfile"),
        log_to_stderr=parser.get("upload", "log_to_stderr", fallback="false"),
        data_dir=parser.get("upload", "data_dir"),
        aws_config_file=parser.get("upload", "aws_config_file"),
    )

    aws_parser = configparser.ConfigParser()
    aws_parser.read(config.aws_config_file)

    aws_config = AwsConfig(
        aws_endpoint_url=aws_parser.get("bucket", "aws_endpoint_url"),
        aws_access_key_id=aws_parser.get("bucket", "aws_access_key_id"),
        aws_secret_access_key=aws_parser.get("bucket", "aws_secret_access_key"),
        bucket_name=aws_parser.get("bucket", "bucket_name"),
        bucket_path_prefix=aws_parser.get("bucket", "bucket_path_prefix"),
    )
    return config, aws_config


def normalize(address):
    return (
        address.lower()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ý", "y")
        .replace("þ", "t")
        .replace("æ", "ae")
        .replace("ö", "o")
        .replace("ð", "d")
    )


class Uploader:
    ADDRESS_FILES_KEY_PREIFX = "addresses"
    ADDRESS_INDEX_FILENAME = "addresses.json"
    COORD_BOUNDS_FILENAME = "coord-bounds.json"

    def __init__(self, s3_client, bucket_name: str, bucket_path_prefix: str):
        self._s3_client = s3_client
        self._bucket_name = bucket_name
        self._bucket_path_prefix = bucket_path_prefix
        self._uploaded_address_files = []

    def upload_address_file(self, file_path: Path, filename: str) -> None:
        bucket_key = os.path.join(
            self._bucket_path_prefix, self.ADDRESS_FILES_KEY_PREIFX, filename
        )
        self._uploaded_address_files.append(bucket_key)
        self._upload(file_path, bucket_key)

    def upload_address_index_file(self, file_path: Path) -> None:
        bucket_key = os.path.join(self._bucket_path_prefix, self.ADDRESS_INDEX_FILENAME)
        self._upload(file_path, bucket_key)

    def upload_coord_bounds_file(self, file_path: Path) -> None:
        bucket_key = os.path.join(self._bucket_path_prefix, self.COORD_BOUNDS_FILENAME)
        self._upload(file_path, bucket_key)

    def _upload(self, file_path: Path, bucket_key: str) -> None:
        logger.info(f"Uploading {file_path} to {bucket_key}")
        self._s3_client.upload_file(file_path, self._bucket_name, bucket_key)

    def remove_old_uploads(self, paths: Paths) -> None:
        address_files = set([address.name for address in paths.addresses_dir.iterdir()])
        if paths.uploaded_addresses_dir.exists():
            uploaded_address_files = set(
                [
                    uploaded_address.name
                    for uploaded_address in paths.uploaded_addresses_dir.iterdir()
                ]
            )
        else:
            uploaded_address_files = set()

        remove = uploaded_address_files - address_files
        logger.info(f"Remove count: {len(remove)}")

        for filename in remove:
            key = os.path.join(
                self._bucket_path_prefix, self.ADDRESS_FILES_KEY_PREIFX, filename
            )
            logger.info(f"Removing {key}")
            self._s3_client.delete_object(Bucket=self._bucket_name, Key=key)


def get_coords(stadfangaskra_path: Path) -> dict:
    coords = {}
    with stadfangaskra_path.open() as f:
        stadfangaskra = csv.DictReader(f)
        for row in stadfangaskra:
            if row["POSTNR"] != "" and int(row["POSTNR"]) < 200:
                address = f"{row['HEITI_NF']} {row['HUSNR']}"
                lat = float(row["N_HNIT_WGS84"])
                lng = float(row["E_HNIT_WGS84"])
                coords[address] = [lat, lng]

    return coords


def construct_address_index_and_coord_bounds(paths: Paths) -> tuple[list, dict]:
    coords = get_coords(paths.stadfangaskra_path)

    address_index = []
    lat_min = 1000
    lat_max = -1000
    lng_min = 1000
    lng_max = -1000

    for address_path in paths.addresses_dir.iterdir():
        with address_path.open() as f:
            drawings = json.load(f)

        address = address_path.name[:-5]  # strip .json
        address_info = {
            "address": address,
            "normalized": normalize(address),
            "count": len(drawings),
        }
        if address in coords:
            address_info["coords"] = coords[address]
            lat, lng = coords[address]
            lat_min = min(lat_min, lat)
            lat_max = max(lat_max, lat)
            lng_min = min(lng_min, lng)
            lng_max = max(lng_max, lng)

        address_index.append(address_info)

    coord_bounds = {
        "lat_min": lat_min,
        "lat_max": lat_max,
        "lng_min": lng_min,
        "lng_max": lng_max,
    }

    return address_index, coord_bounds


def upload_changed_addresses(paths: Paths, uploader: Uploader) -> None:
    for address_path in paths.addresses_dir.iterdir():
        uploaded_address_path = paths.uploaded_addresses_dir / address_path.name
        if not uploaded_address_path.exists() or (
            address_path.read_bytes() != uploaded_address_path.read_bytes()
        ):
            uploader.upload_address_file(address_path, address_path.name)


def process(paths: Paths, uploader: Uploader) -> None:
    if not paths.last_dir.exists():
        logger.info(f"No last dir found at {paths.last_dir}, exiting")
        return

    address_index, coord_bounds = construct_address_index_and_coord_bounds(paths)
    with paths.address_index_path.open("w") as f:
        json.dump(address_index, f)

    with paths.coord_bounds_path.open("w") as f:
        json.dump(coord_bounds, f)

    upload_changed_addresses(paths, uploader)
    uploader.upload_address_index_file(paths.address_index_path)
    uploader.upload_coord_bounds_file(paths.coord_bounds_path)

    uploader.remove_old_uploads(paths)

    if paths.uploaded_dir.exists():
        shutil.rmtree(paths.uploaded_dir)
    paths.last_dir.rename(paths.uploaded_dir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("configfile")
    args = parser.parse_args()

    config, aws_config = read_configs(args.configfile)
    logging.basicConfig(
        format="%(asctime)s [" + str(os.getpid()) + "] [%(levelname)s] %(message)s",
        filename=config.logfile,
        level=logging.INFO,
    )
    if config.log_to_stderr.lower() == "true":
        logging.getLogger().addHandler(logging.StreamHandler())

    s3_client = boto3.client(
        service_name="s3",
        endpoint_url=aws_config.aws_endpoint_url,
        aws_access_key_id=aws_config.aws_access_key_id,
        aws_secret_access_key=aws_config.aws_secret_access_key,
    )

    paths = Paths(config.data_dir)

    uploader = Uploader(
        s3_client, aws_config.bucket_name, aws_config.bucket_path_prefix
    )

    process(paths, uploader)


def main_wrapper():
    try:
        main()
    except Exception as e:
        logger.error(f"Error: {e}")


main_wrapper()
