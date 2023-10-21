import { addonBuilder } from "stremio-addon-sdk"
import DebridLink from './lib/debrid-link.js'
import RealDebrid from './lib/real-debrid.js'
import packageInfo from "./package.json" assert { type: "json" }

const API_KEY_DESCRIPTION = `<div class="separator"></div><h3 class="gives">Get the API Key here :</h3> <ul><li><a href="https://real-debrid.com/apitoken" target="_blank">RealDebrid API Key</a></li><li><a href="https://debrid-link.fr/webapp/apikey" target="_blank">DebridLink API Key</a></li></ul><div class="separator"></div><p><a href="https://github.com/MrMonkey42/stremio-addon-debrid-search" target="_blank">Source Code on Github</a></p>`

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
    id: "community.stremio.debrid-search",
    version: packageInfo.version,
    name: "Debrid Search",
    description: packageInfo.description + API_KEY_DESCRIPTION,
    background: `https://i.ibb.co/VtSfFP9/t8wVwcg.jpg`,
    logo: `https://img.icons8.com/fluency/256/search-in-cloud.png`,
    catalogs: [
        {
            "id": "debridsearch",
            "type": "other",
            "extra": [
                {
                    "name": "search",
                    "isRequired": false
                },
                {
                    "name": "skip",
                    "isRequired": false
                }
            ]
        }
    ],
    resources: [
        "catalog"
    ],
    types: [
        "movie",
        "series",
        'anime',
        "other"
    ],
    behaviorHints: {
        configurable: true,
        configurationRequired: true
    },

    // Ref - https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md#user-data
    config: [
        {
            "key": "DebridProvider",
            "title": "Debrid Provider",
            "type": "select",
            "required": true,
            "options": ["RealDebrid", "DebridLink"]
        },
        {
            "key": "DebridApiKey",
            "title": "Debrid API Key",
            "type": "text",
            "required": true
        },
    ]
}

const CACHE_MAX_AGE = parseInt(process.env.CACHE_MAX_AGE) || 1 * 60 // 1 min
const STALE_REVALIDATE_AGE = 1 * 60 // 1 min
const STALE_ERROR_AGE = 1 * 24 * 60 * 60 // 1 days

const builder = new addonBuilder(manifest)

builder.defineCatalogHandler((args) => {
    return new Promise((resolve, reject) => {
        console.log("Request for catalog with args: " + JSON.stringify(args))
        // Request to Debrid Search
        if (args.id == 'debridsearch') {
            if (!((args.config?.DebridProvider && args.config?.DebridApiKey) || args.config?.DebridLinkApiKey)) {
                reject(new Error('Invalid Debrid configuration: Missing configs'))
            }

            // Search catalog request
            if (args.extra.search) {
                let resultsPromise
                if (args.config.DebridLinkApiKey) {
                    resultsPromise = DebridLink.searchTorrents(args.config.DebridLinkApiKey, args.extra.search)
                } else if (args.config.DebridProvider == "DebridLink") {
                    resultsPromise = DebridLink.searchTorrents(args.config.DebridApiKey, args.extra.search)
                } else if (args.config.DebridProvider == "RealDebrid") {
                    resultsPromise = RealDebrid.searchTorrents(args.config.DebridApiKey, args.extra.search)
                } else {
                    reject(new Error('Invalid Debrid configuration: Unknown DebridProvider'))
                }

                resultsPromise
                    .then(metas => {
                        console.log("Response metas: " + JSON.stringify(metas))
                        resolve({
                            metas: metas,
                            cacheMaxAge: CACHE_MAX_AGE,
                            staleRevalidate: STALE_REVALIDATE_AGE,
                            staleError: STALE_ERROR_AGE
                        })
                    })
                    .catch(err => reject(err))
            } else {
                // Standard catalog request
                let resultsPromise

                if (args.config.DebridLinkApiKey) {
                    resultsPromise = DebridLink.listTorrents(args.config.DebridLinkApiKey, args.extra.skip)
                } else if (args.config.DebridProvider == "DebridLink") {
                    resultsPromise = DebridLink.listTorrents(args.config.DebridApiKey, args.extra.skip)
                } else if (args.config.DebridProvider == "RealDebrid") {
                    resultsPromise = RealDebrid.listTorrents(args.config.DebridApiKey, args.extra.skip)
                } else {
                    reject(new Error('Invalid Debrid configuration: Unknown DebridProvider'))
                }

                resultsPromise
                    .then(metas => {
                        console.log("Response metas: " + JSON.stringify(metas))
                        resolve({
                            metas: metas,
                            cacheMaxAge: CACHE_MAX_AGE,
                            staleRevalidate: STALE_REVALIDATE_AGE,
                            staleError: STALE_ERROR_AGE
                        })
                    })
                    .catch(err => reject(err))
            }
        } else {
            reject(new Error('Invalid catalog request'))
        }
    })
})

export default builder.getInterface()
