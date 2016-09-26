'use strict';

let themesCatalogController = [
    '$rootScope',
    '$scope',
    'themesCatalogService',
    'settingsService',
    (
        $rootScope,
        $scope,
        themesCatalogService,
        settingsService
    ) => {
        $scope.themesHeader = chrome.i18n.getMessage('themesHeader');
        const loadingStartsText = chrome.i18n.getMessage('themesLoading');
        const loadingFailsText = chrome.i18n.getMessage('themesLoadingFailed');

        $scope.loadingText = loadingStartsText;
        $scope.catalogIsVisible = false;

        const setCatalogVisibility = visible => $scope.catalogIsVisible = visible;
        const hideThemesCatalog = () => setCatalogVisibility(false);
        const showThemesCatalog = () => setCatalogVisibility(true);

        $scope.categories = [];
        $scope.currentCategoryId = null;
        $scope.closeCatalog = function () {
            $scope.catalogIsVisible = false;
        };

        settingsService
            .getCategories()
            .then(categories => $scope.categories = categories);

        const selectCategory = id => {
            $scope.currentCategoryId = id;
            $scope.themes = [];
            $scope.loadingText = loadingStartsText;
            themesCatalogService
                .getCategoryItems(id)
                .then(res => {
                    if (res && res.themes) {
                        $scope.themes = res.themes;
                    }
                }, err => {
                    console.error(err);
                    $scope.loadingText = loadingFailsText;
                });
        };

        const selectTheme = theme => {
            $rootScope.$broadcast('setBgFromCatalog', theme);
        };

        $scope.selectCategory = selectCategory;
        $scope.selectTheme = selectTheme;

        $scope.$on('showThemesCatalog', () => {
            showThemesCatalog();
            selectCategory($scope.categories[0].id);
        });
        $scope.$on('ESC', hideThemesCatalog);
        $scope.$on('hideFormsAndPopups', () => {
            hideThemesCatalog();
        });
    }
];

export default themesCatalogController;
