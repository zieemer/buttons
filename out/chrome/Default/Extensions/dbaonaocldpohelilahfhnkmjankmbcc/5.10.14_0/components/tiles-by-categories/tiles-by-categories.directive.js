'use strict';

import tilesTemplate from './tiles-by-categories.html';

export let tilesByCategoriesDirective = function () {
    return {
        templateUrl: tilesTemplate,
        controller: 'TilesByCategoriesController',
        scope: {
            editMode: '@',
            editIndex: '@'
        }
    };
};

export let tilesCategoriesDropdownDirective = () => {
    return {
        restrict: 'A',
        link: (scope, element, attrs) => {
            let dropdown = element.find('.listCat');
            let dropdownItems = element.find('.listCatItems');

            dropdown.on('click', (e) => {
                dropdownItems.toggle();
            });

            dropdownItems.on('click', (e) => {
                dropdownItems.hide();
            });
        }
    };
};