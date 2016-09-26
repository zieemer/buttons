'use strict';

let themesCatalogService = [
    '$http',
    '$q',
    (
        $http,
        $q
    ) => {
        const THEMES_API = 'http://ext.orbitum.com/myspeed_tips/api/getBooks.php';

        let cache = {};
        let lastQuery;

        const getCategoryItems = categoryId => {
            if (cache[categoryId]) {
                return $q.when(cache[categoryId]);
            }

            if (lastQuery) {
                lastQuery.abort();
                lastQuery = null;
            }

            return $q((resolve, reject) => {
                // Use XHR instead of $http for better abortion
                let xhr = new XMLHttpRequest();
                lastQuery = xhr;
                xhr.addEventListener('load', response => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        let data;

                        try {
                            data = JSON.parse(xhr.responseText);
                        } catch (e) {
                            return reject(e);
                        }

                        cache[categoryId] = data;
                        return resolve(data);
                    }

                    return reject(response);
                });
                xhr.addEventListener('error', response => reject(response));
                xhr.addEventListener('abort', response => resolve());
                xhr.open('GET', `${THEMES_API}?act=themes&category=${categoryId}`);
                xhr.send();
            });
        };

        return {
            getCategoryItems
        };
    }
];

export default themesCatalogService;