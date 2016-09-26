'use strict';

import themesTemplate from './themes-catalog.html';

export let themesCatalog = ['$rootScope', ($rootScope) => {
    return {
        restrict: 'E',
        controller: 'themesCatalogController',
        replace: true,
        templateUrl: themesTemplate,
        link: (scope, elem, attrs) => {
            const categoriesClass = 'themes-cats-list';
            const imagesClass = 'theme-images';
            const activeClass = 'active';

            elem.find('.close-popup').on('click', (e) => {
                $rootScope.$broadcast('hideFormsAndPopups');
            });

            elem.find(`.${imagesClass}`).on('click', 'img', function (e) {
                elem.find(`.${imagesClass} .${activeClass}`).removeClass(activeClass);
                this.classList.add(activeClass);
                console.log('Theme image click');
            });

            elem.find(`.${categoriesClass}`).on('click', 'li', function (e) {
                console.log('Theme category click');
            });
        }
    }
}];