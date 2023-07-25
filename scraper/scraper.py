import os
import json
import requests
import datetime
import time


CURRENT_SCRAPE_FILE = "current-scrape.json"
URL = "https://skjalasafn.reykjavik.is/fotoweb/archives/5001-A%C3%B0aluppdr%C3%A6ttir/;p={index}"
HEADERS = {"Accept": "application/vnd.fotoware.assetlist+json, */*; q=0.01"}
FIRST_PAGE = 0
LAST_PAGE = 7892
FILENAME_TEMPLATE = "{id}/{index:04d}.json"
LOGLINE = "{index}/{last_page}"
SLEEP_SECONDS = 3


def get_current_scrape_info():
    try:
        with open(CURRENT_SCRAPE_FILE, "r") as f:
            info = json.load(f)
            return info["id"], info["index"]
    except (FileNotFoundError, json.JSONDecodeError):
        id = "scrape-" + str(datetime.date.today())
        index = FIRST_PAGE - 1
        return id, index


def save_current_scrape_info(id: str, index: int) -> None:
    with open(CURRENT_SCRAPE_FILE, "w") as f:
        json.dump({"id": id, "index": index}, f)


def main():
    id, index = get_current_scrape_info()
    print(f"Starting scrape {id} from {index}")
    os.makedirs(id, exist_ok=True)

    while index < LAST_PAGE:
        index += 1
        print(LOGLINE.format(index=index, last_page=LAST_PAGE))
        url = URL.format(index=index)
        while True:
            try:
                response = requests.get(url, headers=HEADERS)
                response.raise_for_status()
                break
            except requests.RequestException as e:
                print("error:")
                print(e)
                time.sleep(SLEEP_SECONDS)
        local_filename = FILENAME_TEMPLATE.format(id=id, index=index)
        with open(local_filename, "w") as f:
            f.write(json.dumps(response.json(), indent=2))
        save_current_scrape_info(id, index)
        time.sleep(SLEEP_SECONDS)


main()
