'use strict';

export let SearchController = [
    '$scope',
    '$rootScope',
    '$window',
    'searchService',
    'statService',
    'utilsService',
    (
        $scope,
        $rootScope,
        $window,
        searchService,
        statService,
        utilsService
    ) => {
    /**
     * Using this to prevent suggestions request after search was submitted
     * @type {Boolean}
     */
    let searchSubmitted = false;
    let suggestionsUpdateForbidden = false;

    const MIN_QUERY_LENGTH = 3;
    $scope.closeThis = () => {
        $scope.suggestions = [];
    };
    $scope.queryPlaceholder = '';
    $scope.searchButtonTitle = chrome.i18n.getMessage('searchButton');

    let SEARCH_ENGINE = '';
    let SEARCH_ID;

    function getSearchOptions () {
        return searchService
            .getSearch()
            .then(search => {
                suggestionsUpdateForbidden = false;

                SEARCH_ENGINE = search.name;
                SEARCH_ID = search.id;
                $scope.searchLogo = search.image;

                return search;
            });
    }

    getSearchOptions();

    $scope.focus = () => $rootScope.$broadcast('hideFormsAndPopups');

    $scope.search = () => {
        if (!$scope.query || !$scope.query.trim()) return false;

        searchSubmitted = true;

        if (!SEARCH_ENGINE) {
            getSearchOptions()
                .then(res => {
                    statService.send('searchSD', {SEARCH_ENGINE, searchId: SEARCH_ID, keyword: $scope.query});
                });
        } else {
            // TODO: DRY
            statService.send('searchSD', {SEARCH_ENGINE, searchId: SEARCH_ID, keyword: $scope.query});
        }

        searchService
            .getSearchURL(encodeURIComponent($scope.query))
            .then(res => {
                if (!res) return;

                $window.location.href = res;
            })
            .catch(err => console.error(err));
    };

    $scope.useSuggestion = suggestion => {
        $scope.query = suggestion;
        $scope.search();
    };

    $scope.selectSuggestion = suggestion => {
        if (suggestion) {
            suggestionsUpdateForbidden = true;
            $scope.query = suggestion;
        }
    };

    $scope.allowSuggests = () => {
        suggestionsUpdateForbidden = false;
    };

    $scope.$watch('query', utilsService.debounce((newValue, oldValue) => {
        if (searchSubmitted || suggestionsUpdateForbidden) return;

        if (!newValue || newValue.length < MIN_QUERY_LENGTH || newValue === oldValue) {
            $scope.suggestions = [];
            return;
        }

        console.log('Request suggestions', newValue);
        searchService
            .suggest(newValue)
            .then(res => {
                if (res[0] === $scope.query) {
                    console.log('Got suggestions', res[1]);
                    $scope.suggestions = res[1];
                } else {
                    console.log('Get outdated response');
                }
            }, err => console.error(err));
    }, 300));

    $scope.$on('hideFormsAndPopups', clearSuggestion);
    $scope.$on('ESC', clearSuggestion);
    $scope.$on('searchUpdate', getSearchOptions);

    function clearSuggestion () {
        $scope.suggestions = [];
        suggestionsUpdateForbidden = false;
    }
}];