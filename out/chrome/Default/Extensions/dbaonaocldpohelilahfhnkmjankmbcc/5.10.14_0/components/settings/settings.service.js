"use strict";

const week = 1000 * 60 * 60 * 24 * 7;
const API = 'http://ext.orbitum.com/myspeed_tips/api/getBooks.php?local_ts=1&features[]=themes';

export let settingsService = [
    '$localStorage',
    '$q',
    '$http',
    'migrationService',
    (
        $localStorage,
        $q,
        $http,
        migrationService
    ) => {
        function parseCategories (json) {
            let cats = json.data.themes.categories;
            if (cats.length < 1) return [];
            return cats.map(cat => {
                cat.model = true;
                return cat;
            });
        }

        function parseThemes (json) {
            return json.data.themes.themes;
        }

        function getThemeCategory (id) {
            return $http
                .get(`http://ext.orbitum.com/myspeed_tips/api/getBooks.php?act=themes&category=${id}`)
                .then(result => result.data)
                .then(json => {
                    json.id = id;
                    return json;
                });
        }

        let defaultThemeUrl = 'http://ext.orbitum.com/myspeed_tips/api/getBooks.php?act=themes&thid=64';

        let alreadyRunning;

        function getDataThemes () {
            if (alreadyRunning) {
                console.log('already getting themes');
                return alreadyRunning;
            }

            alreadyRunning = $q((resolve, reject) => {
                if ($localStorage.dataThemes &&
                    $localStorage.dataThemes.ts &&
                    $localStorage.userThemeSettings) {
                    console.info('fetch themes from localstorage');
                    //TODO ((Date.now() - $localStorage.dataThemes.ts) < week or month or add check of hash from server)
                    return resolve();
                } else {
                    console.info('fetch themes from server');
                    return $http
                        .get(API)
                        .then(result => result.data)
                        .then(json => {
                            let dataThemes = {
                                ts: Date.now(),
                                categories: parseCategories(json),
                                themes: parseThemes(json)
                            };

                            $localStorage.dataThemes = dataThemes;
                            $localStorage.userThemeSettings = $localStorage.userThemeSettings || {};

                            let ls = $localStorage.userThemeSettings;
                            // DO NOT rewrite previous values
                            ls.pinTheme             = ls.pinTheme           === undefined ? false                                     : ls.pinTheme;
                            ls.typeBackground       = ls.typeBackground     === undefined ? 'random-background'                       : ls.typeBackground;
                            ls.defaultTheme         = ls.defaultTheme       === undefined ? defaultThemeUrl                           : ls.defaultTheme;
                            ls.currentTheme         = ls.currentTheme       === undefined ? defaultThemeUrl                           : ls.currentTheme;
                            ls.themeOn              = ls.themeOn            === undefined ? true                                      : ls.themeOn;
                            ls.userPictureBase64    = ls.userPictureBase64  === undefined ? './resources/books/img/placeholder.jpg'   : ls.userPictureBase64;
                            ls.colorLayout          = ls.colorLayout        === undefined ? {color: '#ffffff', text: 'black'}         : ls.colorLayout;
                            ls.currentColor         = ls.currentColor       === undefined ? 0                                         : ls.currentColor;
                            ls.selectedCategories   = dataThemes.categories;
                            ls.selectedThemes       = dataThemes.themes;
                            ls.cacheTheme           = !!($localStorage.dataThemes && $localStorage.dataThemes.ts);

                            // $localStorage.userThemeSettings = {
                            //     pinTheme: false,
                            //     typeBackground: 'random-background',
                            //     defaultTheme: defaultThemeUrl,
                            //     currentTheme: defaultThemeUrl,
                            //     themeOn: true,
                            //     selectedCategories: dataThemes.categories,
                            //     selectedThemes: dataThemes.themes,
                            //     userPictureBase64: './resources/books/img/placeholder.jpg',
                            //     colorLayout: {color: '#000000', text: 'white'},
                            //     currentColor: 0,
                            //     cacheTheme: !!($localStorage.dataThemes && $localStorage.dataThemes.ts)
                            // };
                            console.log('update userThemeSettings');

                            return resolve();
                        })
                        .catch(err => reject(err))
                }
            })
            .then(() => migrationService.migrateThemes())
            .then(() => {
                alreadyRunning = null;

                return {
                    themes: $localStorage.dataThemes,
                    settings: $localStorage.userThemeSettings
                };
            });

            return alreadyRunning;
        }

        function getLayoutColors () {
            let settings = $localStorage.userThemeSettings.colorLayout;
            return settings || {color: 'rgb(105, 192, 205)', text: '#000'};
        }

        function getCategories () {
            if ($localStorage.dataThemes && $localStorage.dataThemes.categories) {
                return $q.when($localStorage.dataThemes.categories);
            }

            return getDataThemes().then(getCategories);
        }

        return {getDataThemes, getThemeCategory, getLayoutColors, getCategories};
    }
];
