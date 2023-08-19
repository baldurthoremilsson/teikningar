import sys
import json
import os
import re
import hashlib
from collections import defaultdict
from tqdm import tqdm

DATE_KEY = "30"
STREET_NAME_KEY = "203"
HOUSE_NUMBER_KEY = "204"
ADDRESS_KEY = "210"
DESCRIPTION_KEY = "214"

BLEH = []


def single_space(address: str) -> str:
    return " ".join(part for part in address.split(" ") if part != "")


def parse_address(address: str) -> set[str]:
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
        # "Thorvaldsenstræti 2-6/Aðalstræti 11"
        addresses = address.split(" - ")
    elif "/" in address:
        # "Fossháls 13-15 - Dragháls 14-16"
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
                BLEH.append(addr_strip)
            start = int(groupdict["start"])
            end = int(groupdict["end"])
            while start <= end:
                return_addresses.add(single_space(f"{street_name} {start}"))
                start += 2
        else:
            return_addresses.add(single_space(addr_strip))

    return return_addresses


def convert_image(img):
    meta = img["metadata"]
    if ADDRESS_KEY in meta:
        address = meta[ADDRESS_KEY]["value"].strip()
    else:
        street_name = meta[STREET_NAME_KEY]["value"].strip()
        house_number = meta[HOUSE_NUMBER_KEY]["value"].strip()
        address = f"{street_name} {house_number}"
    parsed_addresses = parse_address(address)
    if DESCRIPTION_KEY in meta:
        description = meta[DESCRIPTION_KEY]["value"].strip()
    else:
        description = "[Lýsingu vantar]"

    date = meta[DATE_KEY]["value"].strip() if DATE_KEY in meta else None
    hash = hashlib.md5(img["href"].encode()).hexdigest()[:7]

    data = {
        "address": address,
        "date": date,
        "description": description,
        "hash": hash,
        "images": {preview["size"]: preview for preview in img["previews"]},
        "originalHref": img["href"],
    }
    return parsed_addresses, data


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


def main():
    if len(sys.argv) != 2:
        print("Error: missing scrape dir", file=sys.stderr)
        return

    scrape_dir = sys.argv[1]
    image_files = os.listdir(scrape_dir)
    print(len(image_files))
    imgs = []
    hrefs = set()
    for filename in tqdm(image_files):
        full_path = os.path.join(scrape_dir, filename)
        with open(full_path) as f:
            contents = json.load(f)
            for img in contents["data"]:
                if img["href"] not in hrefs:
                    hrefs.add(img["href"])
                    imgs.append(img)

    print(len(imgs))

    addresses = defaultdict(list)
    for img in imgs:
        parsed_addresses, data = convert_image(img)
        for addr in parsed_addresses:
            addresses[addr].append(data)

    if True:
        os.makedirs("addresses", exist_ok=True)
        for address, drawings in tqdm(addresses.items()):
            with open(f"addresses/{address}.json", "w") as f:
                json.dump(drawings, f, ensure_ascii=False)

        address_index = []
        with open("addresses.json", "w") as f:
            for address, drawings in addresses.items():
                address_index.append(
                    {
                        "address": address,
                        "normalized": normalize(address),
                        "count": len(drawings),
                    }
                )
            json.dump(address_index, f, ensure_ascii=False)
    else:
        import IPython

        IPython.embed()


main()
