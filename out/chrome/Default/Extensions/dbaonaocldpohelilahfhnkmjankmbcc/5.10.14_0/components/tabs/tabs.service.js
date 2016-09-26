'use strict';

export let tabsService = [
    '$rootScope',
    '$http',
    '$localStorage',
    '$q',
    'bookmarksService',
    'utilsService',
    'historyService',
    (
        $rootScope,
        $http,
        $localStorage,
        $q,
        bookmarksService,
        utilsService,
        historyService
    ) => {
    if (!$localStorage.tabs) {
        $localStorage.tabs = [];
    }

    const DEFAULT_TAB_ID = 'default';
    const RECENT_TAB_ID = 'recent';

    /**
     * Title/id of the current tab.
     * @type {String}
     * @private
     */
    let currentTab = DEFAULT_TAB_ID;

    /**
     * Tab's id which was active before current was selected.
     * @type {String}
     * @private
     */
    let previousTab = currentTab;

    /**
     * Default undeletable tab.
     * DO NOT store it in storage to prevent hacks.
     * @type {Object}
     */
    let DEFAULT_TAB = {
        title: chrome.i18n.getMessage('recommended'),
        id: DEFAULT_TAB_ID,
        locked: true
    };

    /**
     * Recently closed pages tab.
     * @type {Object}
     */
    let RECENT_TAB = {
        title: chrome.i18n.getMessage('recent'),
        id: RECENT_TAB_ID,
        locked: true
    };

    /**
     * Storage where all the tabs related data is stored.
     * @type {Array}
     * @private
     */
    let STORAGE = initStorage();

    /**
     * Concat default tabs with the tabs from storage.
     * @return {Array}
     */
    function initStorage () {
        return [DEFAULT_TAB, RECENT_TAB].concat($localStorage.tabs);
    }

    /**
     * Get current tab.
     * @return {String}
     * @public
     */
    function getCurrentTab () {
        return $localStorage.tab || currentTab;
    }

    /**
     * Set current tab.
     * @param  {Object} tab Object with id or title
     * @return {String}     Current tab
     * @public
     */
    function setCurrentTab (tab) {
        let {id, title} = tab;
        if (id || title) {
            previousTab = currentTab;
            currentTab = id || title;
            $localStorage.tab = currentTab;
            return currentTab;
        } else {
            return false;
        }
    }

    /**
     * Checks if the tab is currently active tab.
     * @param  {Object}  tab Object with id or title
     * @return {Boolean}     True if the tab is current, false if not
     * @public
     */
    function isCurrentTab (tab) {
        return tab.id === currentTab || tab.title === currentTab;
    }

    /**
     * Get ID of the default tab.
     * @return {String}
     * @public
     */
    function getDefaultTabId () {
        return DEFAULT_TAB_ID;
    }

    /**
     * Get ID of the recently closed sites tab.
     * @return {String}
     * @public
     */
    function getRecentTabId () {
        return RECENT_TAB_ID;
    }

    /**
     * Get previously active tab.
     * @return {Object} Tab
     * @public
     */
    function getPrevious () {
        let index = getTabIndex(previousTab, 'title');

        if (index === -1) {
            index = getTabIndex(previousTab, 'id');
        }

        if (index === -1) {
            index = 0;
        }

        return STORAGE[index] || STORAGE[0];
    }

    /**
     * Sync STORAGE variable and an actual storage.
     * @private
     */
    function syncStorage () {
        // Save all data except the first two default and recent tabs
        $localStorage.tabs = STORAGE.slice(2);
    }

    /**
     * Get tab's index in the storage array.
     * @param  {String} attrValue Attribute value
     * @param  {String} attr      Attribute name
     * @return {Number}           Index of the tab
     * @private
     */
    function getTabIndex (attrValue, attr) {
        return utilsService.getIndex(STORAGE, attrValue, attr);
    }

    /**
     * Get recently closed pages.
     * @return {Promise}
     * @public
     */
    function getRecentPages () {
        let t = historyService.getTime().today;
        let y = historyService.getTime().yesterday;
        let today = historyService.getHistory({startTime: t, time: t});
        let yesterday = historyService.getHistory({startTime: y, endTime: t, time: y});
        return $q.all([today, yesterday]).then(res => res.reduce((a, b) => a.concat(b)) || []);
    }

    /**
     * Get list of tabs.
     * @return {Promise}
     * @async
     * @public
     */
    function getTabs () {
        return bookmarksService
            .getFolders()
            .then(bookmarks => {
                let tabs = $localStorage.tabs;
                let newTabs = [];
                let addedList = {};
                let defer = $q.defer();

                defer.resolve();

                return bookmarks.reduce((promise, bookmark) => {
                    return promise.then(res => {
                        let tab = tabs.filter(e => e.title === bookmark.title)[0];
                        if (!addedList[bookmark.title]) {
                            addedList[bookmark.title] = true;

                            if (tab) {
                                newTabs.push(tab);
                                return tab;
                            } else {
                                let {title, id} = bookmark;
                                return importTab({
                                    title,
                                    bookmark: {id}
                                })
                                .then(tab => {
                                    newTabs.push(tab);
                                    return tab;
                                });
                            }
                        }
                    });
                }, defer.promise)
                .then(res => {
                    $localStorage.tabs.map(tab => {
                        if (!newTabs.filter(newTab => newTab.title === tab.title).length) {
                            $rootScope.$broadcast('tabRemoved', tab);
                        }
                    });

                    $localStorage.tabs = newTabs;

                    STORAGE = initStorage();

                    return STORAGE.map(e => {
                        return {
                            id: e.id,
                            title: e.title,
                            locked: e.locked
                        };
                    });
                });
            });
    };

    /**
     * Get tab by name.
     * @param  {String} name Tab's title or id
     * @return {Object}
     * @async
     * @public
     */
    function getTab (name) {
        // See bookmarks.service.js for "Speeddial"
        if (name === 'Speeddial') {
            return $q.when(null);
        }

        let index = getTabIndex(name, 'title');
        if (index === -1) {
            index = getTabIndex(name, 'id');
        }

        return $q.when(index > -1 ? STORAGE[index] : null);
    }

    /**
     * Add new tab.
     * @param  {Object} tab      Object {title}
     * @return {Promise} Resolved with a string (tab id)
     * @public
     */
    function addTab (tab) {
        let index = getTabIndex(tab.title, 'title');
        if (index > -1) {
            return $q.when(false);
        }

        return bookmarksService
            .addBookmark({title: tab.title})
            .then(bookmark => tab);
    }

    /**
     * Remove tab.
     * @param  {Object} tab
     * @private
     */
    function remove (tab) {
        // Restrict remove of default tabs
        if (tab.id && (tab.id === DEFAULT_TAB_ID || tab.id === RECENT_TAB_ID)) return;

        let index = getTabIndex(tab.title, 'title');
        if (index > -1) {
            let res = STORAGE.splice(index, 1);
            $rootScope.$broadcast('tabRemoved', tab);
            syncStorage();
            return res[0];
        }

        return false;
    }

    /**
     * Remove tab and bookmark.
     * @param  {Object} tab
     * @return {Promise} Resolved with tabs list
     * @public
     */
    function removeTab (tab) {
        remove(tab);

        return bookmarksService
            .removeFolder(tab.title)
            .then(res => getTabs());
    }

    function removeByBookmark (bookmark) {
        let tab = STORAGE.filter(e => {
            return e.bookmark && e.bookmark.id === bookmark.id;
        })[0];

        if (tab) {
            if (isCurrentTab(tab)) {
                $rootScope.$broadcast('selectTab', getPrevious());
            }

            return $q.when(remove(tab));
        }

        return $q.when(false);
    }

    function importTab (tab) {
        let index = getTabIndex(tab.title, 'title');
        if (index > -1) {
            return $q.when(false);
        } else {
            STORAGE.push(tab);
            syncStorage();

            return $q.when(tab);
        }
    }

    return {
        getCurrentTab,
        setCurrentTab,
        isCurrentTab,
        getDefaultTabId,
        getRecentTabId,
        getPrevious,
        removeByBookmark,
        getTab,
        getTabs,
        addTab,
        removeTab,
        getRecentPages,
        importTab
    }
}];