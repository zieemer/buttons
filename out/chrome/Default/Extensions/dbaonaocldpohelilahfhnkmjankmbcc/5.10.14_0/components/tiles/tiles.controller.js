'use strict';

import punycode from 'punycode';

export let TilesController = [
    '$rootScope',
    '$scope',
    '$timeout',
    '$q',
    '$filter',
    '$confirm',
    'tilesService',
    'tabsService',
    'statService',
    'historyService',
    (
        $rootScope,
        $scope,
        $timeout,
        $q,
        $filter,
        $confirm,
        tilesService,
        tabsService,
        statService,
        historyService
    ) => {
        $scope.firstRunLoading = true;

        $scope.syncProgress = null;

        $scope.addTileButtonTitle = chrome.i18n.getMessage('addWebsite');
        $scope.translate = {
            delHistory: chrome.i18n.getMessage("deleteHistory"),
            showHistory: chrome.i18n.getMessage("goToHistory"),
            historyEmpty: chrome.i18n.getMessage("historyEmpty"),
            historyWidget: chrome.i18n.getMessage("historyWidget"),
            editWebsite: chrome.i18n.getMessage("editWebsite"),
            deleteWebsite: chrome.i18n.getMessage("deleteWebsite")
        };

        $scope.tiles = {};

        $scope.getFormatDate = ms => {
            let d = new Date(ms);
            let m = d.getMonth().toString().length > 1 ? d.getMonth() + 1 : `0${d.getMonth() + 1}`;
            let date = d.getDate().toString().length > 1 ? d.getDate() : `0${d.getDate()}`;
            let res;
            switch(d.getDate()) {
                case (+new Date().getDate()):
                    res = `${chrome.i18n.getMessage("today")} - ${date}.${m}.${d.getFullYear()}`;
                    break;
                case (+new Date().getDate() - 1):
                    res = `${chrome.i18n.getMessage("yesterday")} - ${date}.${m}.${d.getFullYear()}`;
                    break;
                default:
                    res = `${date}.${m}.${d.getFullYear()}`;
                    break;
            }
            return res;
        };

        $scope.removeAllHistory = e => {
            e.preventDefault();
            chrome.history.deleteAll(() => {
                $rootScope.$broadcast('delete:history');
                console.log('full annihilation of history');
            });
        };

        $scope.getFavicon = url => {
            return `chrome://favicon/size/16@1x/${url}`;
        };

        $scope.showAllHistory = e => {
            e.preventDefault();
            chrome.tabs.update({'url': 'chrome://history'});
        };

        $scope.$on('importTile', (e, data) => {
            tilesService
                .importTile(data)
                .then(res => console.log('imported', res))
                .catch(err => console.info(err))
                .then(() => $rootScope.$broadcast('tilesUpdate'));
        });

        $scope.$on('removeTile', (e, data) => {
            tilesService
                .removeTile(data)
                .then(res => console.log('removed', res))
                .catch(err => console.info(err))
                .then(() => $rootScope.$broadcast('tilesUpdate'));
        });

        /**
         * Tile click handler.
         * @param  {Number} index Tile index in array of tiles
         */
        $scope.tileClick = function (index) {
            statService.send('clickADS', {
                place: index + 1,
                banner_id: $scope.tiles[index].id
            });
        };

        /**
         * Edit tile button handler.
         * @param  {Number} index Tile index in array of tiles
         */
        $scope.edit = function (index) {
            this.tile.url = decodeURIComponent($filter('unpunycode')(this.tile.url));
            $scope.$broadcast('showForm', this.tile, index);
        };

        /**
         * Remove tile button handler.
         * @param  {Object} tile Tile object
         */
        $scope.remove = tile => {
            tilesService
                .remove(tile)
                .then(res => {
                    $rootScope.$broadcast('tilesUpdate');
                });
        };

        $scope.showHistory = () => {
            chrome.tabs.update({'url': 'chrome://history'});
        };

        // DO NOT use 'revert' option as it will cause ngClick to trigger
        $scope.sortableOptions = {
            containment   : 'parent',
            tolerance     : 'pointer',
            'ui-floating' : true,  // Without 'ui-floating' the 'tolerance' doesn't work
            items         : 'li:not(.not-sortable)',
            start         : (e, ui) => {
                let item = ui.item.sortable;

                if (item && item.model && item.model.widget) {
                    delete item.model.widget;
                    $scope.$apply();
                }
            },
            update        : (e, ui) => {
                let item = ui.item.sortable;
                // Use $evalAsync to grab the latest (reordered) $scope.tiles
                $scope.$evalAsync($scope => {
                    tilesService.saveNewOrder({
                        tile          : item.model,
                        oldIndex      : item.index,
                        newIndex      : item.dropindex,
                        tilesNewOrder : $scope.tiles,
                        tabId         : tabsService.getCurrentTab()
                    });
                });
            }
        };

        // Listener for tile-form module
        $scope.$on('saveTile', (event, data) => {
            const LOADING_TILE = {
                loading: true,
                locked: true
            };

            let isEditing = data.index !== undefined;

            if (isEditing) {
                data.tile.oldUrl = data.oldTile && new URL(data.oldTile.url).href;
            }

            // Set preloader tile
            $scope.$broadcast('toggleTilesAddButton', false);
            if (isEditing) {
                // Replace current tile in tiles list with preloader
                $scope.tiles[data.index] = LOADING_TILE;
            } else {
                // Add preloader to tiles list
                $scope.tiles.push(LOADING_TILE);
            }

            tilesService[isEditing ? 'update' : 'addTile'](data.tile)
                .then(res => {
                    if (res && res.error) {
                        switch (res.type) {
                            case 'duplicate':
                                $confirm({
                                    text: chrome.i18n.getMessage('siteDuplicate'),
                                    ok: chrome.i18n.getMessage('ok')
                                },
                                {
                                    templateUrl: './components/tiles/templates/message-popup.html'
                                })
                                console.log('trying to add duplicate item');
                                break;
                        }
                    }

                    $scope.$broadcast('toggleTilesAddButton', true);
                })
                .catch(err => {
                    console.warn('Tiles error', err);
                })
                .then(() => $rootScope.$broadcast('tilesUpdate'));
        });

        $scope.$on('addTile', (e, data) => {
            tilesService.addTile(data.tile, $scope.currentTab);
        });

        $scope.$on('replaceTile', (e, data) => {
            let tile = angular.copy($scope.tiles[data.index]);

            if (!tile) {
                return console.error('No tile');
            }

            tile.oldUrl = tile.url;
            tile.url = data.tile.url;
            tile.useThisImage = data.tile.useThisImage;

            tilesService.update(tile, $scope.currentTab);
        });

        function htmlDecode(input) {
            if (!input) return '';

            let e = document.createElement('div');
            e.innerHTML = input;
            return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
        }

        function tilesUpdater () {
            return tilesService
                .getTiles(tabsService.getCurrentTab())
                .then(res => {
                    res = res.map(e => {
                        // Decode titles so entities like &mdash; would be rendered properly
                        e.title = htmlDecode(e.title) || e.url;
                        return e;
                    });
                    $scope.tiles = res;

                    if ($scope.firstRunLoading) {
                        // Send analytics for non-custom tiles
                        $scope.tiles.map((tile, index) => {
                            if (tile.id !== undefined && !tile.custom) {
                                statService.send('showADS', {
                                    banner_id: tile.id,
                                    place: index + 1
                                });
                            }
                        });

                        const tilesExpiration = tilesService.getTilesExpiration();
                        if (tilesExpiration.expired) {
                            tilesService.getNewTiles();
                        }
                        console.log(tilesExpiration.expired ? 'Tiles expired' : `Tiles will expire at ${new Date(Date.now() + tilesExpiration.expireIn)}`);
                    }

                    $scope.firstRunLoading = false;

                    return res;
                });
        }

        function selectTabHandler (e, tab) {
            tabsService.setCurrentTab(tab);

            tilesUpdater()
                .then(res => {
                    $scope.currentTab = tabsService.getCurrentTab();
                    let showAddButton = $scope.currentTab !== tabsService.getRecentTabId();
                    $scope.$broadcast('toggleTilesAddButton', showAddButton);
                })
                .catch(err => {
                    console.error(err);
                })
                .then(() => {
                    $scope.firstRunLoading = false;
                });
        }

        $scope.$on('selectTab', selectTabHandler);
        $scope.$on('tilesUpdate', tilesUpdater);
        $scope.$on('delete:history', tilesUpdater);

        $scope.$on('tabRemoved', (event, tab) => {
            let clean = tilesService.cleanTab(tab);
            console.log('Storage cleaned', clean);
        });

        $scope.$on('getHistoryForWebsite', (e, data) => {
            let url = new URL(data);

            console.log(`request history for the ${url.host}`);

            if (url.host === 'yandex.ru') {
                return $q.resolve(null);
            }

            historyService
                .search({
                    text: url.host,
                    startTime: new Date().setDate(new Date().getDate() - 7)  // get history for the last week
                })
                .then(res => {
                    if (!res || !res.length) return [];

                    let host = url.host;
                    let split = host.split('.');
                    if (split.length > 2) {
                        host = split.slice(-2).join('.');
                    }
                    let historyRecords = res
                        .filter(e => e.title)
                        .filter(e => new URL(e.url).host.split('.').slice(-2).join('.') === host);
                    let count = 0;
                    const limit = 5;
                    const urlCleaned = tilesService.cleanURL(url.href);
                    let itemsToShow = historyRecords
                        .filter(e => tilesService.cleanURL(e.url) !== urlCleaned)
                        .slice(0, limit)
                        .map(e => ({
                            title: e.title,
                            url: e.url
                        }));

                    let i = -1;
                    let item;
                    let store = {};
                    if (itemsToShow.length) {
                        do {
                            i++;
                            if (i < limit && i < itemsToShow.length) {
                                item = itemsToShow[i];
                            } else {
                                item = historyRecords[i];
                            }

                            if (item && item.title && !store[item.title] && tilesService.cleanURL(item.url) !== urlCleaned) {
                                store[item.title] = item;
                                count++;
                            }
                        } while (i < historyRecords.length && count < limit);
                    }

                    let arr = [];
                    for (let item in store) {
                        arr.push(store[item]);
                    }
                    return arr;
                })
                .then(res => {
                    if (res && !res.length || !res) {
                        console.log(`got nothing for the ${url.host}`);
                        return res;
                    }

                    console.log(`history for the ${url.host}`, res);

                    $scope.$broadcast('gotHistoryForWebsite', {[data]: res});
                });
        });

        $scope.$on('syncProgress', (e, data) => {
            if (!$scope.syncProgress) {
                $timeout(() => $scope.syncProgress = data);
            }
        });

        $scope.$on('syncStop', e => {
            if ($scope.syncProgress) {
                $timeout(() => $scope.syncProgress = null);
            }
        });
    }
];