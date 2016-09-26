'use strict';

import {presets} from '../../resources/presets';

export let tilesService = [
    '$http',
    '$localStorage',
    '$filter',
    '$rootScope',
    '$q',
    'mainService',
    'statService',
    'tilePreviewService',
    'tabsService',
    'bookmarksService',
    'utilsService',
    (
        $http,
        $localStorage,
        $filter,
        $rootScope,
        $q,
        mainService,
        statService,
        tilePreviewService,
        tabsService,
        bookmarksService,
        utilsService
    ) => {

    const DUPLICATE_ERROR = 'duplicate';

    /**
     * Tiles merge safety.
     * Prevents tiles merging on a tile deletion or creation.
     * Merge allowed on page refresh only (that's when this value is truthy).
     * @type {Boolean}
     */
    let mergeTilesAllowed = true;

    (function migrateStorage () {
        if (angular.isArray($localStorage.tiles)) {
            $localStorage.tiles = {
                default: $localStorage.tiles
            }
        } else if (!$localStorage.tiles) {
            $localStorage.tiles = {
                default: []
            };
        }

        if (angular.isArray($localStorage.tabs)) {
            $localStorage.tabs.forEach(e => {
                delete e.id;
                if (!$localStorage.tiles[e.title]) {
                    $localStorage.tiles[e.title] = e.items || [];
                    delete e.items;
                }
            });
        } else if (!$localStorage.tabs) {
            $localStorage.tabs = [];
        }
    })();

    /**
     * Get ADS tiles from server.
     * @return {Promise}
     * @public
     */
    function getNewTiles () {
        let url = 'http://sd.orbitum.com/api/getBooks.php';
        return $http
            .get(url, {
                params: {
                    install_id: 0,
                    cbr: 'chrome'
                },
                headers: {
                    'Cache-Control': 'public',
                    'Expires': 24*60*60*1000
                }
            })
            .then(res => {
                console.log('Get data from API', res);
                return res.data;
            })
            .catch(err => null)
            .then(res => {
                if (res) {
                    let newTiles = res.tiles;
                    // Save new set of tiles to storage but not load them until next time
                    saveAds(newTiles, parseInt(res.timeout || 43200, 10) * 1000);
                    // Preload images of the new tiles into cache of browser
                    mainService.preloadImages(newTiles);
                }

                return res;
            });
    }

    /**
     * Get tiles from presets file.
     * @return {Array} Tiles list
     * @private
     */
    function getPreset () {
        if ($localStorage.presetUsed) {
            return [];
        }

        $localStorage.presetUsed = true;
        const lang = chrome.i18n.getUILanguage();
        let preset;

        switch (lang) {
            case 'ru':
                preset = presets.ru;
                break;
            default:
                preset = presets.en;
                break;
        }

        return preset;
    }

    /**
     * Get tiles expiration timeout.
     * @return {Object} Object {expired, expireIn}
     * @public
     */
    function getTilesExpiration () {
        const now = Date.now();
        const validUntil = $localStorage.tilesExpire || 0;

        let expiration = {
            expired: now >= validUntil
        };

        if (!expiration.expired) {
            expiration.expireIn = validUntil - now;
        }

        return expiration;
    }

    /**
     * Replace old tiles with the new ones.
     * Replaces ADS and preset tiles, and leaves user's tiles untouched.
     * @param  {Array}  oldTiles Old tiles
     * @param  {Array}  newTiles New tiles
     * @return {Array}
     * @private
     */
    function mergeTiles (oldTiles=[], newTiles) {
        if (!oldTiles) return;
        if (!newTiles || !newTiles.length) return oldTiles;
        if (newTiles && !oldTiles.length) return newTiles;

        let newTilesOrdered = $filter('orderBy')(newTiles, '-priority');
        return oldTiles.map(item => {
            if (item.custom) return item;

            let itemIndex;
            let newItem = newTilesOrdered.find((e, i) => {
                itemIndex = i;
                return cleanURL(e.url) === cleanURL(item.url);
            });

            if (newItem) {
                newTilesOrdered.splice(itemIndex, 1);
                return newItem;
            }

            // Try to find tile with which we can replace the current tile
            let k = -1;
            let replaceWithThisTile;
            let oldTile;

            do {
                k++;
                replaceWithThisTile = newTilesOrdered[k];
                if (replaceWithThisTile && replaceWithThisTile.url) {
                    oldTile = oldTiles.find(e => cleanURL(e.url) === cleanURL(replaceWithThisTile.url));
                }
            } while (oldTile && k < newTilesOrdered.length);

            if (!oldTile && replaceWithThisTile && k > -1) {
                newTilesOrdered.splice(k, 1);
                return replaceWithThisTile;
            }

            // Remove ad tile
            return null;
        });
    }

    /**
     * Get set of tiles.
     * Merge ADS tiles and clear ADS storage if there are some.
     * @param  {String} tabId Tab ID
     * @return {Promise}
     * @public
     */
    function getTiles (tabId) {
        console.log('get tiles for tab', tabId);

        if (tabId === tabsService.getRecentTabId()) {
            return tabsService.getRecentPages();
        }

        let defaultTab = tabsService.getDefaultTabId();
        let promise = $q.resolve();

        if (!tabId) {
            tabId = defaultTab;
        }

        if (tabId === defaultTab) {
            // Default tab is Recommended, so check if we should request new tiles.
            if (!$localStorage.tiles || !$localStorage.tilesExpire) {
                // No `tiles` or `tilesExpire` in localStorage means that Speed Dial
                // is being launched for the first time (or storage was being corrupted),
                // so request new tiles.
                promise = getNewTiles()
                    .then(res => {
                        // If no result and preset's not yet used then use presets
                        if (!res && !$localStorage.presetUsed) {
                            $localStorage.tiles = $localStorage.tiles || {};
                            $localStorage.tiles[tabId] = getPreset();
                        }

                        // Return an empty string as bookmarkId for the Recommended tab
                        return '';
                    });
            } else {
                promise = $q.when('');
            }
        } else {
            // Request tab from tabs service to get bookmark id
            promise = tabsService
                .getTab(tabId)
                .then(tab => tab && tab.bookmark && tab.bookmark.id || false);
        }

        return promise
            .then(bookmarkId => bookmarkId === false ? null : bookmarksService.getNonFolders(bookmarkId))
            .then(bookmarks => {
                // On default tab (which is Recommended) merge ad tiles
                if (tabId === defaultTab && mergeTilesAllowed) {
                    let ads = $localStorage.ads || [];
                    // Replace old tiles with new ones
                    $localStorage.tiles[tabId] = mergeTiles($localStorage.tiles[tabId], ads);
                    // Remove used tiles
                    $localStorage.ads = [];
                }

                bookmarks = bookmarks || [];
                $localStorage.tiles[tabId] = $localStorage.tiles[tabId] || [];

                let updateTiles = false;

                bookmarks.reduce((promise, item) => {
                    return promise.then(() => {
                        let {id, url, title} = item;

                        let duplicateIndex;
                        let duplicate = $localStorage.tiles[tabId].find((e, i) => {
                            duplicateIndex = i;
                            return e.url && url && cleanURL(e.url) === cleanURL(url);
                        });

                        if (duplicate) {
                            if (duplicate.custom) {
                                return null;
                            } else {
                                // Replace the duplicate ad tile with the current bookmark
                                updateTiles = true;
                                let image = $localStorage.tiles[tabId][duplicateIndex].image;
                                return $localStorage.tiles[tabId][duplicateIndex] = {
                                    url,
                                    title,
                                    image,
                                    bookmark: {id},
                                    parentTab: tabId,
                                    custom: true
                                };
                            }
                        }

                        updateTiles = true;
                        $rootScope.$broadcast('syncProgress', true);
                        return importTile({
                            url,
                            title,
                            parentTab: tabId,
                            bookmark: {id}
                        })
                        // .catch(err => null);
                    });
                }, $q.resolve())
                .then(() => {
                    if (updateTiles) {
                        $rootScope.$broadcast('syncStop');
                        $rootScope.$broadcast('tilesUpdate');
                    }
                });

                // Update tiles with bookmarks or delete them if there's no associated bookmark
                $localStorage.tiles[tabId] = $localStorage.tiles[tabId].map(e => {
                    if (!e) return null;

                    // Return Ad/preset tile as is
                    if (!e.custom) return e;

                    // Rename `imgSrc` to `favicon`
                    if (e.preview && e.preview.imgSrc) {
                        e.preview.favicon = e.preview.imgSrc;
                        delete e.preview.imgSrc;
                    }

                    // Find current custom tile in bookmarks
                    let bookmark = bookmarks.filter(b => b.url === e.url)[0];
                    if (bookmark) {
                        // Update tile's title with the bookmark's title
                        e.title = bookmark.title;

                        return e;
                    }

                    // Looks like the tile was removed from bookmarks,
                    // so also remove it from here
                    return null;
                })
                .filter(e => e !== null);

                return angular.copy($localStorage.tiles[tabId]);
            });
    }

    /**
     * Save full set of tiles to storage.
     * @param {Object}  data
     * @public
     */
    function saveNewOrder (data) {
        let {tile, tilesNewOrder, tabId} = data;

        // Filter ads out from old tiles list and new
        let filter = e => e.bookmark !== undefined;
        let oldTiles = $localStorage.tiles[tabId].filter(filter);
        let newTiles = tilesNewOrder.filter(filter);

        let indices = checkItemReorder(tile, oldTiles, newTiles);
        if (indices) {
            let {newIndex, indexIncrement} = indices;

            if (newIndex !== -1) {
                let id = tile.bookmark.id;
                let getIndexPromise = $q.resolve(newIndex);

                // For default tab filter bookmarks folders out
                if (tabId === tabsService.getDefaultTabId()) {
                    getIndexPromise = bookmarksService.getBookmarks()
                        .then(res => {
                            let allBookmarks = res[0].children;
                            let map = {};
                            let withoutFolders = allBookmarks.filter(e => e.url);

                            allBookmarks.map((e, i) => map[e.url] = {trueIndex: i})
                            withoutFolders.map((e, i) => map[e.url].maskIndex = i);

                            let index = newIndex - indexIncrement;
                            for (let key in map) {
                                let item = map[key];
                                if (item.maskIndex === index) {
                                    return item.trueIndex + indexIncrement;
                                }
                            }

                            return newIndex;
                        })
                }

                getIndexPromise
                    .then(index => bookmarksService.moveBookmark({id, index}))
                    .then(res => {
                        console.log(`Bookmark ${id} moved to ${newIndex} position`);
                    });
            }
        }

        // Filter `loading` tiles out
        $localStorage.tiles[tabId] = tilesNewOrder.filter(e => e.loading === undefined);
    }

    /**
     * Save ADS tiles to storage.
     * @param  {Array} data    Array of objects
     * @param  {String} timeout Timeout of next allowed request
     * @public
     */
    function saveAds (data, timeout) {
        $localStorage.ads = data;
        $localStorage.tilesExpire = Date.now() + parseInt(timeout, 10);
    }

    /**
     * Get item's index in the array.
     * @param  {String} attrValue Item ID
     * @param  {String} attr      Attribute name
     * @return {Number}
     */
    function getItemIndex (tabId, attrValue, attr) {
        return utilsService.getIndex($localStorage.tiles[tabId], attrValue, attr);
    }

    function findTileByBookmark (bookmarkId) {
        let tab;
        let index;

        if (!bookmarkId) return null;

        for (tab in $localStorage.tiles) {
            index = $localStorage.tiles[tab]
                .map(e => e.bookmark && e.bookmark.id)
                .indexOf(bookmarkId);
            if (index > -1) {
                break;
            }
        }

        if (index > -1) {
            return {
                tab,
                index,
                tile: $localStorage.tiles[tab][index]
            };
        }

        return null;
    }

    /**
     * Remove tile and then bookmark.
     * @param  {Object} tile
     * @return {Promise}
     * @async
     * @public
     */
    function remove (tile) {
        mergeTilesAllowed = false;

        let tab = tabsService.getCurrentTab();
        let index = getItemIndex(tab, tile.url, 'url');
        if (index > -1) {
            $localStorage.tiles[tab].splice(index, 1);

            statService.send('deleteADS', {
                place: index + 1,
                banner_id: tile.id
            });

            if (tile.bookmark && tile.bookmark.id) {
                return bookmarksService
                    .removeBookmark(tile.bookmark.id)
                    .then(res => true);
            }

            return $q.when(true);
        }

        return $q.when(false);
    }

    /**
     * Remove tile on bookmarkRemoved event.
     * @param  {Object} bookmark
     * @return {Boolean}
     * @async
     * @public
     */
    function removeTile (bookmark) {
        mergeTilesAllowed = false;

        let tileFound = findTileByBookmark(bookmark.id);
        if (tileFound) {
            let {tab, index, tile} = tileFound;

            $localStorage.tiles[tab].splice(index, 1);

            return $q.when(true);
        } else {
            $rootScope.$broadcast('removeTab', bookmark);
        }

        return $q.when(false);
    }

    function getPreview (tile) {
        if (tile.useThisImage) {
            return $q((resolve, reject) => {
                tile.image = tile.useThisImage;
                delete tile.useThisImage;
                delete tile.kind;
                delete tile.preview;
                resolve(tile);
            });
        }

        tile.preview = tile.preview || {};

        return tilePreviewService.getTilePreview(tile.url, tile.title)
            .then(res => {
                if (res) {
                    tile.title = res.title;

                    if (res.image) {
                        tile.image = res.image;
                        delete tile.preview;
                    } else {
                        tile.preview = res;
                        delete tile.image;
                    }
                }

                delete tile.loading;
            })
            .catch(err => console.error('Preview fails', err))
            .then(() => tile);
    }

    /**
     * Remove from URL 'www' and 's' from 'https' for better URLs comparisons.
     * @param  {String} url
     * @return {String}     Stripped URL
     * @public
     */
    function cleanURL (url) {
        return new URL(url.replace('https', 'http').replace('www.', '')).href;
    }

    /**
     * Check for tiles duplicates.
     * @param  {String}  url Tile's URL
     * @param  {String}  tab Tab's title/id
     * @return {Boolean}     True if dupes, false if not
     * @private
     */
    function checkDupes (url, tab) {
        let tiles = $localStorage.tiles[tab] || false;
        return tiles && tiles.filter(e => e.url && url && cleanURL(e.url) === cleanURL(url)).length > 0;
    }

    /**
     * Add tile.
     * @param  {Object} tile
     * @return {Object} Tile object
     * @async
     * @public
     */
    function addTile (tile) {
        mergeTilesAllowed = false;

        let currentTab = tabsService.getCurrentTab();

        let folderName;
        let intoTab;

        if (tile.folderName) {
            folderName = tile.folderName;
            intoTab = folderName;
        } else {
            folderName = currentTab === tabsService.getDefaultTabId() ? '' : currentTab;
            intoTab = currentTab;
        }

        // First check is to prevent unnecessary preview generation
        if (checkDupes(tile.url, intoTab)) {
            return $q.resolve({
                error: true,
                type: DUPLICATE_ERROR
            });
        }

        tile.custom = true;

        // TODO: getPreview is called (sic!) 3 times in addTile, update and importTile methods. DO DRY!
        return getPreview(tile)
            .then(tile => {
                if (!tile.title && tile.preview && tile.preview.title) {
                    tile.title = tile.preview.title;
                    delete tile.preview.title;
                }

                if (!$localStorage.tiles[intoTab]) {
                    $localStorage.tiles[intoTab] = [];
                }

                // Second check is to prevent actual duplicating
                if (checkDupes(tile.url, intoTab)) {
                    return $q.resolve({
                        error: true,
                        type: DUPLICATE_ERROR
                    });
                }

                $localStorage.tiles[intoTab].push(tile);

                statService.send('addADS', {
                    place: $localStorage.tiles[intoTab].length + 1,
                    url: tile.url
                });

                return tile;
            })
            .then(tile => bookmarksService.addBookmark({
                url: tile.url,
                title: tile.title,
                folderName
            }))
            .then(bookmark => setBookmark(tile, bookmark, intoTab));
    }

    /**
     * Import tile from bookmarks.
     * @param  {Object} tile
     * @return {Promise}
     * @async
     * @public
     */
    function importTile (tile) {
        mergeTilesAllowed = false;

        let folderName = tile.parentTab || tabsService.getDefaultTabId();

        if (checkDupes(tile.url, folderName)) {
            return $q.resolve(null);
        }

        tile.custom = true;

        return getPreview(tile)
            .then(tile => {
                if (!tile.title && tile.preview && tile.preview.title) {
                    tile.title = tile.preview.title;
                    delete tile.preview.title;
                }

                if (!$localStorage.tiles[folderName]) {
                    $localStorage.tiles[folderName] = [];
                }

                if (checkDupes(tile.url, folderName)) {
                    return null;
                }

                $localStorage.tiles[folderName].push(tile);

                return tile;
            })
            .catch(err => {
                console.error(err);
                return err;
                // TODO: check this err
            });
    }

    function update (tile, tab) {
        mergeTilesAllowed = false;

        tile.custom = true;

        return getPreview(tile)
            .then(tile => {
                if (tile.preview && tile.preview.title) {
                    tile.title = tile.preview.title;
                    delete tile.preview.title;
                }

                let tabId = tab || tabsService.getCurrentTab();
                let folderName = tabId === tabsService.getDefaultTabId() ? '' : tabId;

                let index = getItemIndex(tabId, tile.oldUrl, 'url');
                if (index === -1) {
                    // Try to fix "broken" urls
                    $localStorage.tiles[tabId] = $localStorage.tiles[tabId].map(e => {
                        e.url = new URL(e.url).href;
                        return e;
                    });

                    index = getItemIndex(tabId, tile.oldUrl, 'url');
                }

                if (index > -1) {
                    delete tile.kind;
                    $localStorage.tiles[tabId][index] = tile;

                    statService.send('changeADS', {
                        place: index + 1,
                        banner_id: tile.id,
                        url: tile.url
                    });

                    let {oldUrl, url: newUrl, title} = tile;
                    let id = tile.bookmark && tile.bookmark.id;
                    return bookmarksService
                        .updateBookmark({oldUrl, newUrl, title, folderName, id})
                        .then(res => {
                            // If no bookmark assigned to the tile then we probably
                            // editing ad tile or preset
                            if (!tile.bookmark) {
                                tile.bookmark = {id: res.id};
                                delete tile.oldUrl;
                                $localStorage.tiles[tabId][index] = tile;
                            }

                            return tile;
                        });
                } else {
                    return $q.reject('Trying to update unknown tile');
                }
            })
            .then(tile => {
                $rootScope.$broadcast('tilesUpdate');
                return tile;
            });
    }

    function saveTilesOrder (tiles) {
        return mainService.setStorageSync('order', tiles.map(e => e.custom ? e.url : null));
    }

    function getTilesOrder () {
        return mainService
            .getStorageSync('order')
            .then(res => res['order']);
    }

    function cleanTab (tab) {
        if ($localStorage.tiles[tab.id]) {
            delete $localStorage.tiles[tab.id];
            return true;
        } else if ($localStorage.tiles[tab.title]) {
            delete $localStorage.tiles[tab.title];
            return true;
        } else {
            return false;
        }
    }

    function setBookmark (tile, bookmark, tab) {
        let {id} = bookmark;
        tile.bookmark = {id};

        let index = getItemIndex(tab, tile.url, 'url');
        if (index > -1) {
            $localStorage.tiles[tab][index] = tile;
            console.log(`Bookmark #${id} is assigned to tile ${tile.url}`);
        }

        return $q.resolve(tile);
    }

    /**
     * Checks two arrays to extract moved (reordered) item.
     * Warning: Works with only one moved item!
     * @param  {Array} oldItems Array of items before reordering
     * @param  {Array} newItems Array of items after reordering
     * @return {Object|null} Object with keys "oldIndex", "newIndex", and "item"
     */
    function checkReorder (oldItems, newItems) {
        if (!oldItems || !newItems || !oldItems.length || !newItems.length) {
            return null;
        }

        if (oldItems.length !== newItems.length) {
            // TODO: remove extra items
        }

        let itemsIndicesMap = {};
        oldItems.map((e, i) => itemsIndicesMap[e.url] = {oldIndex: i, item: e});
        newItems.map((e, i) => itemsIndicesMap[e.url].newIndex = i);

        let movedItem;
        let probablyMovedItem;

        for (let key in itemsIndicesMap) {
            let item = itemsIndicesMap[key];
            let diff = Math.abs(item.oldIndex - item.newIndex);
            if (diff > 1) {
                movedItem = item;
                console.log('%c moved item', 'color: lime', item);
                break;
            } else if (diff === 1) {
                probablyMovedItem = item;
                console.log('%c maybe moved item', 'color: green', item);
            }
        }

        return movedItem || probablyMovedItem || null;
    }

    /**
     * Get old and new indices of the moved item.
     * @param  {Array} oldItems Array of items before reordering
     * @param  {Array} newItems Array of items after reordering
     * @return {Object} Object with keys "oldIndex" and "newIndex"
     */
    function checkItemReorder (item, oldItems, newItems) {
        if (!item || !oldItems || !newItems || !oldItems.length || !newItems.length) {
            return null;
        }

        if (oldItems.length !== newItems.length) {
            // TODO: remove extra items
        }

        let clb = e => e.url === item.url;
        let oldIndex = oldItems.findIndex(clb);
        let newIndex = newItems.findIndex(clb);
        let indexIncrement = 0;

        if (oldIndex < newIndex) {
            // Bug in Chrome API: if new index is larger than the old then API decreases new bookmark's position by 1
            // http://stackoverflow.com/questions/13264060/chrome-bookmarks-api-using-move-to-reorder-bookmarks-in-the-same-folder
            newIndex++;
            indexIncrement = 1;
        }

        return {oldIndex, newIndex, indexIncrement};
    }

    return {
        importTile,
        removeTile,
        getTiles,
        getNewTiles,
        saveNewOrder,
        saveAds,
        getTilesExpiration,
        remove,
        addTile,
        update,
        saveTilesOrder,
        cleanTab,
        cleanURL
    };
}];
