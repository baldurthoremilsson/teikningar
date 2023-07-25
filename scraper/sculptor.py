import sys
import json
import os
import re
import hashlib
from collections import defaultdict
from tqdm import tqdm

ADDRESS_KEY = "210"
DESCRIPTION_KEY = "214"


def parse_address(address: str) -> list[str]:
    if " - " in address:
        # "Thorvaldsenstræti 2-6/Aðalstræti 11"
        addresses = address.split(" - ")
    elif "/" in address:
        # "Fossháls 13-15 - Dragháls 14-16"
        addresses = address.split("/")
    else:
        addresses = [address]

    return_addresses = []
    for addr in addresses:
        addr_strip = addr.strip()
        match = re.match("(?P<street_name>.*) (?P<start>\d+)-(?P<end>\d+)", addr_strip)
        if match:
            groupdict = match.groupdict()
            street_name = groupdict["street_name"]
            start = int(groupdict["start"])
            end = int(groupdict["end"])
            while start <= end:
                return_addresses.append(f"{street_name} {start}")
                start += 2
        else:
            return_addresses.append(addr_strip)

    return return_addresses


def convert_image(img):
    meta = img["metadata"]
    address = meta[ADDRESS_KEY]["value"].strip()
    parsed_addresses = parse_address(address)
    if DESCRIPTION_KEY in meta:
        description = meta[DESCRIPTION_KEY]["value"].strip()
    else:
        description = "[Lýsingu vantar]"

    data = {
        "address": address,
        "description": description,
        "images": {preview["size"]: preview for preview in img["previews"]},
    }
    hash = hashlib.sha1(json.dumps(data).encode("utf-8")).hexdigest()
    return parsed_addresses, data, hash


def main():
    if len(sys.argv) != 2:
        print("Error: missing scrape dir", file=sys.stderr)
        return

    scrape_dir = sys.argv[1]
    image_files = os.listdir(scrape_dir)
    print(len(image_files))
    imgs = []
    for filename in tqdm(image_files):
        full_path = os.path.join(scrape_dir, filename)
        with open(full_path) as f:
            x = json.load(f)
            imgs.extend(x["data"])
    print(len(imgs))

    addresses = defaultdict(set)
    issues = []
    for img in imgs:
        try:
            parsed_addresses, data, hash = convert_image(img)
            for addr in parsed_addresses:
                addresses[addr].add(hash)
        except:
            issues.append(img)

    print(f"issues: {len(issues)}")

    print("writing")
    with open("test.json", "w") as f:
        json.dump({address: len(val) for address, val in addresses.items()}, f)
    return

    import IPython

    IPython.embed()


main()
