'use strict';

export let searchService = [
    '$http',
    '$httpParamSerializer',
    '$localStorage',
    '$q',
    'mainService',
    (
        $http,
        $httpParamSerializer,
        $localStorage,
        $q,
        mainService
    ) => {
        const API = 'http://search-sd.orbitum.com/';

        /**
         * Variable used to prevent double requests to an API.
         */
        let queryInProgress = null;

        // Remove deprecated storage
        if ($localStorage.search) {
            $localStorage.search = undefined;
        }

        /**
         * Id of the selected search engine.
         * @type {Number}
         */
        $localStorage.searchId = $localStorage.searchId || null;

        /**
         * Expiration date of the search cache.
         * @type {Number} Timestamp
         */
        $localStorage.searchExpire = $localStorage.searchExpire || 0;

        /**
         * Search options.
         * @type {Array}
         */
        $localStorage.searchOptions = $localStorage.searchOptions || [];

        /**
         * Get search options via API.
         * In case of error returns default pair of search engines - yandex and google.
         * @return {Array}
         * @async
         */
        function getSearchOptions () {
            if (queryInProgress) {
                return queryInProgress;
            }

            //TODO check other chrome based browsers
            let client = (chrome && chrome.orbitum) ? 'orbitum' : 'chrome';

            if (Date.now() > $localStorage.searchExpire) {
                return queryInProgress = httpGet(API, { platform: client })
                    .then(res => {
                        if (!res || !res.length) {
                            return $q.reject();
                        }

                        return res;
                    })
                    .catch(err => {
                        if ($localStorage.searchOptions && $localStorage.searchOptions.length) {
                            return $localStorage.searchOptions;
                        }

                        return [
                            {
                                name: 'Google',
                                searchUrl: 'http://google.com/search?q={searchTerms}',
                                suggestUrl: 'http://www.google.com/complete/search?q={searchTerms}&output=opera',
                                image: 'http://search-sd.orbitum.com/images/google.png',
                                id: 0
                            },
                            {
                                name: 'Яндекс',
                                searchUrl: 'http://yandex.ru/yandsearch?text={searchTerms}&clid=2041985&lr=2',
                                suggestUrl: 'http://suggest.yandex.net/suggest-ff.cgi?part={searchTerms}',
                                image: 'http://search-sd.orbitum.com/images/yandex.png',
                                id: 1
                            }
                        ];
                    })
                    .then(searchOptions => {
                        queryInProgress = null;
                        $localStorage.searchOptions = searchOptions;
                        $localStorage.searchExpire = new Date().setHours(23, 59, 59, 999);

                        mainService.preloadImages(searchOptions);

                        return searchOptions;
                    });
            } else {
                return $q.when($localStorage.searchOptions);
            }
        }

        /**
         * Get selected search option or first by default.
         * @return {Object}
         * @async
         * @public
         */
        function getSearch () {
            return getSearchOptions()
                .then(searchOptions => {
                    let searchId = getSearchId();
                    return searchOptions.filter(e => e.id === searchId)[0] || searchOptions[0];
                });
        }

        /**
         * Get ID of the selected search option
         * @return {Number}
         * @public
         */
        function getSearchId () {
            return $localStorage.searchId;
        }

        /**
         * $http.get wrapper.
         * @param  {String} url
         * @param  {Object} params
         * @return {Promise}
         * @async
         */
        function httpGet (url, params) {
            return $http
                .get(url, {
                    responseType: 'json',
                    timeout: 4000,
                    params
                })
                .then(res => res.data);
        }

        function getUrl (url) {
            return query => {
                return getSearch()
                    .then(search => {
                        console.log(search);
                        if (search[url]) {
                            return search[url].replace(/{searchTerms}/, query).replace(/\{[^}]*\}/g, '');
                        }

                        return null;
                    });
            };
        }

        /**
         * Get suggestions for the query.
         * @param  {String} query Search query
         * @return {String}
         * @async
         * @public
         */
        function suggest (query) {
            return getUrl('suggestUrl')(query).then(httpGet);
        }

        /**
         * Get compiled search URL.
         * @param  {String} query Search query
         * @return {String}
         * @async
         * @public
         */
        function getSearchURL (query) {
            return getUrl('searchUrl')(query);
        }

        /**
         * Set search engine as default.
         * @param {Number} searchId Id of the search engine
         * @public
         */
        function setAsDefault (searchId) {
            console.log(`Set search to ${searchId}`);
            $localStorage.searchId = searchId;
        }

        return {
            suggest,
            getSearchURL,
            getSearchOptions,
            getSearch,
            getSearchId,
            setAsDefault
        };
    }
];