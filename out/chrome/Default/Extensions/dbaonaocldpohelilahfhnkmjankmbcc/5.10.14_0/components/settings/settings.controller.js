"use strict";

export let SettingsController = [
    '$scope',
    '$rootScope',
    'settingsService',
    'searchService',
    '$localStorage',
    (
        $scope,
        $rootScope,
        settingsService,
        searchService,
        $localStorage
    ) => {

        searchService
            .getSearchOptions()
            .then(searchOptions => {
                // Set up the angular-dropdowns directive
                $scope.ddSelectOptions = searchOptions;

                let selected = 0;
                let selectedId = searchService.getSearchId();
                if (selectedId) {
                    let index = searchOptions.indexOf(searchOptions.filter(e => e.id === selectedId)[0]);
                    if (index > -1) {
                        selected = index;
                    }
                }
                $scope.ddSelectSelected = $scope.ddSelectOptions[selected];
            });

        $scope.componentsValue = {
            bgSettings:     chrome.i18n.getMessage('bgSettings'),
            searchSettings: chrome.i18n.getMessage('searchOptions'),
            bgRandom:       chrome.i18n.getMessage('bgRandom'),
            bgCatalog:      chrome.i18n.getMessage('bgCatalog'),
            select:         chrome.i18n.getMessage('select'),
            bgLocal:        chrome.i18n.getMessage('bgLocal'),
            bgColor:        chrome.i18n.getMessage('bgColor'),
            upload:         chrome.i18n.getMessage('upload')
        };

        const BACKGROUND_TYPE = {
            random: 'random-background',
            catalog: 'catalog-background',
            loading: 'loading-background'
        };
        const placeholder = './resources/books/img/placeholder.jpg';

        $scope.setSearch = selected => {
            searchService.setAsDefault(selected.id);
            $rootScope.$broadcast('searchUpdate');
        };

        //get all data about themes
        settingsService.getDataThemes()
            .then(data => {
                $scope.pinned = ($localStorage.userThemeSettings && $localStorage.userThemeSettings.pinTheme) || false;
                $scope.dataThemes = data.themes;
                $scope.userThemeSettings = data.settings;

                //states
                $scope.stateComponents = {
                    popupIsVisible: false,
                    isActiveBtnLoad: $scope.userThemeSettings.typeBackground !== BACKGROUND_TYPE.loading,
                    showThemeIcons: $scope.userThemeSettings.typeBackground === BACKGROUND_TYPE.random
                };

                //remove base64 user's picture
                $scope.removeUserPicture = () => {
                    if($scope.userThemeSettings.typeBackground === BACKGROUND_TYPE.loading) {
                        $localStorage.userThemeSettings.userPictureBase64 =$localStorage.userThemeSettings.currentTheme = placeholder;
                        $scope.$emit('setBg', {bg: placeholder});
                    }
                };

                //click on checkboxes return filtered themes
                $scope.categoriesOfRandom = () => {
                    let cats = $localStorage.dataThemes.categories;
                    let themes = $localStorage.dataThemes.themes;
                    let filteredThemes = {};
                    cats = cats.filter(item => item.model === true);
                    cats.forEach(cat => {
                        if (cat.id && themes.hasOwnProperty(cat.id)) {
                            filteredThemes[cat.id] = themes[cat.id];
                        }
                    });
                    $localStorage.userThemeSettings.selectedCategories = cats;
                    $localStorage.userThemeSettings.selectedThemes  = filteredThemes;
                    //if edit categories select random bg radio button
                    return filteredThemes;
                };

                //click btn random bg from theme selected by user from categories
                $scope.randomBg = () => {
                    if ($localStorage.userThemeSettings.pinTheme && $localStorage.userThemeSettings.lastRandomTheme) {
                        return $localStorage.userThemeSettings.lastRandomTheme;
                    }

                    let cats = $localStorage.userThemeSettings.selectedCategories;
                    let themes = $localStorage.dataThemes.themes;
                    let allThemes = [];
                    let filteredThemes = {};
                    if (cats.length > 0) {
                        cats.forEach(cat => {
                            if (cat.id && themes.hasOwnProperty(cat.id)) {
                                filteredThemes[cat.id] = themes[cat.id];
                            }
                        });
                        for (let i in filteredThemes) {
                            if (filteredThemes.hasOwnProperty(i)) {
                                allThemes = allThemes.concat(filteredThemes[i]);
                            }
                        }
                        let rand = Math.floor(Math.random() * allThemes.length);
                        let pic = allThemes[rand]['full_screen'];
                        $localStorage.userThemeSettings.currentTheme = pic;
                        $localStorage.userThemeSettings.lastRandomTheme = pic;
                        return pic;
                    }
                };

                $scope.changeTypeBg = () => {
                    $localStorage.userThemeSettings.typeBackground = $scope.userThemeSettings.typeBackground;
                    $scope.stateComponents.showThemeIcons = $scope.userThemeSettings.typeBackground === BACKGROUND_TYPE.random;

                    switch ($scope.userThemeSettings.typeBackground) {
                        case BACKGROUND_TYPE.random:
                            $scope.$emit('setBg', {bg: $scope.randomBg()});
                            break;
                        case BACKGROUND_TYPE.catalog:
                            let previouslyChosenTheme = $localStorage.userThemeSettings.catalogTheme;
                            if (previouslyChosenTheme) {
                                $scope.$emit('setBg', {bg: previouslyChosenTheme.full_screen});
                            } else {
                                $scope.$emit('showThemesCatalog');
                            }
                            break;
                        case BACKGROUND_TYPE.loading:
                                $scope.$emit('setBg', {bg: $localStorage.userThemeSettings.userPictureBase64});
                                $localStorage.userThemeSettings.currentTheme = $localStorage.userThemeSettings.userPictureBase64;
                            break;
                        default:
                            return false;
                            break;
                    }
                };

                //if no cache show default theme
                if ($localStorage.userThemeSettings.themeOn) {
                    let typeBackground = $localStorage.userThemeSettings.typeBackground;
                    if (typeBackground === BACKGROUND_TYPE.random) {
                        let bg;
                        if ($localStorage.userThemeSettings.pinTheme) {
                            bg = $localStorage.userThemeSettings.lastRandomTheme || $localStorage.userThemeSettings.currentTheme;
                        } else {
                            bg = $scope.randomBg();
                        }
                        if (bg) {
                            $localStorage.userThemeSettings.currentTheme = bg;
                            $scope.$emit('setBg', {bg});
                        }
                    } else if (typeBackground === BACKGROUND_TYPE.loading) {
                        let bg = $localStorage.userThemeSettings.userPictureBase64;
                        $scope.$emit('setBg', {bg});
                    } else {
                        if (typeBackground === BACKGROUND_TYPE.catalog) {
                            let th = $localStorage.userThemeSettings.currentTheme = $localStorage.userThemeSettings.catalogTheme;
                            let bg = th && th.full_screen || $localStorage.userThemeSettings.defaultTheme;
                            $scope.$emit('setBg', {bg});
                        }
                    }
                }

                $scope.closeThis = function () {
                    $scope.stateComponents.popupIsVisible = false;
                };

                $scope.changeBgToggle = () => {
                    $scope.$emit($scope.userThemeSettings.themeOn ? 'showBg' : 'hideBg');
                    $localStorage.userThemeSettings.themeOn = $scope.userThemeSettings.themeOn;
                };

                $scope.changeTheme = () => {
                    if (
                        !$scope.refreshingTheme &&
                        $localStorage.userThemeSettings.themeOn &&
                        $localStorage.userThemeSettings.typeBackground === BACKGROUND_TYPE.random
                    ) {
                        $scope.refreshingTheme = true;
                        let bg = $scope.randomBg();
                        if (bg) {
                            $localStorage.userThemeSettings.currentTheme = bg;
                            $scope.$emit('setBg', {bg: bg});
                        }
                    }
                };

                return data;
            })
            .catch(err => {
                console.log(err);
            });

        $rootScope.$on('pin', (e, data) => {
            $scope.pinned = data;
            $localStorage.userThemeSettings.pinTheme = data;
        });

        $scope.$on('user:loadBg', function userLoadBg(e, data) {
            let imgBase64 = data.bg;
            $localStorage.userThemeSettings.userPictureBase64 = $localStorage.userThemeSettings.currentTheme = imgBase64;
            $scope.$emit('setBg', {bg: imgBase64});
        });

        $scope.$on('setBgFromCatalog', (e, data) => {
            let {full_screen, bgcolor, bgfont, id} = data;
            $localStorage.userThemeSettings.catalogTheme = {full_screen, bgcolor, bgfont, id};
            $localStorage.userThemeSettings.currentTheme = data['full_screen'];
            $scope.$emit('setBg', {bg: full_screen});
        });

        $rootScope.$on('setOldPinnedTheme', (e, data) => {
            let {full_screen, bgcolor, bgfont, id} = data;
            $localStorage.userThemeSettings.currentTheme = full_screen;
            $localStorage.userThemeSettings.pinTheme = true;
            $scope.$emit('setBg', {bg: full_screen});
        });

        $scope.$on('setBgSuccess', (e, data) => {
            $scope.$apply(() => $scope.refreshingTheme = false);
            console.log('set bg', data);
        });

        $scope.showThemesCatalog = e => {
            e.preventDefault();
            console.log('click show catalog themes');
            if ($scope.userThemeSettings.typeBackground === BACKGROUND_TYPE.catalog) {
                $rootScope.$broadcast('showThemesCatalog');
            }
        };
    }
];
