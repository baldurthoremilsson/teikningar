import { useCallback, useEffect, useState } from "react";
import { AddressAndBlueprintInfo, BlueprintInfo, DBSchemaV1, Sketches } from "./types";

const DB_KEY_V1 = "db-key-v1"
const DEFAULT_V1 = {
    recentlyViewed: [] as AddressAndBlueprintInfo[],
    favorites: [] as AddressAndBlueprintInfo[],
    sketches: {} as Sketches,
}

const LocalDB = {
    load: function (): DBSchemaV1 {
        let value = localStorage.getItem(DB_KEY_V1);
        if(value !== null) {
            try {
                return JSON.parse(value);
            } catch(e) {
                console.warn("Invalid JSON in localStorage :( Reverting to v1 defaults");
                console.info(value);
            }
        }

        return DEFAULT_V1;
    },

    write: function (state: DBSchemaV1): undefined {
        localStorage.setItem(DB_KEY_V1, JSON.stringify(state));
        window.dispatchEvent(new Event("LocalDBUpdate"));
    },

    addFavorite: function (blueprint: BlueprintInfo, address: string): undefined {
        const state = LocalDB.load();
        const currentIndex = state.favorites.findIndex((favorite) => favorite.blueprint.originalHref === blueprint.originalHref);
        if(currentIndex > -1) {
            return;
        }
        state.favorites.unshift({blueprint, address});
        LocalDB.write(state);
    },

    removeFavorite: function (blueprint: BlueprintInfo): undefined {
        const state = LocalDB.load();
        state.favorites = state.favorites.filter((favorite) => favorite.blueprint.originalHref !== blueprint.originalHref);
        LocalDB.write(state);
    },

    getFavorites: function (): AddressAndBlueprintInfo[] {
        const state = LocalDB.load();
        return state.favorites;
    },

    isFavorite: function (blueprint: BlueprintInfo): boolean {
        return -1 < LocalDB.getFavorites().findIndex((favorite) => favorite.blueprint.originalHref === blueprint.originalHref);
    },

    addRecentlyViewed: function (blueprint: BlueprintInfo, address: string): undefined {
        const state = LocalDB.load();
        state.recentlyViewed = state.recentlyViewed.filter((recent) => recent.blueprint.originalHref !== blueprint.originalHref);
        state.recentlyViewed.unshift({address, blueprint});
        // TODO remove earlier instances of address/blueprint
        while(state.recentlyViewed.length > 100) {
            state.recentlyViewed.pop();
        }
        LocalDB.write(state);
    },

    getRecentlyViewed: function (): AddressAndBlueprintInfo[] {
        const state = LocalDB.load();
        return state.recentlyViewed;
    },
}

export default LocalDB;

export function useLocalDBValue() {
    const [localDB, setLocalDB] = useState(LocalDB.load());
    const updateLocalDB = useCallback(() => {
        setLocalDB(LocalDB.load());
    }, [setLocalDB]);

    useEffect(() => {
        window.addEventListener("storage", updateLocalDB);
        window.addEventListener("LocalDBUpdate", updateLocalDB);
        return () => {
            window.removeEventListener("storage", updateLocalDB);
            window.removeEventListener("LocalDBUpdate", updateLocalDB);
        }
    }, [updateLocalDB]);

    return localDB;
}