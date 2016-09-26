'use strict';

import formTemplate from './tile-form.html';

export let tileFormDirective = function () {
    return {
        templateUrl: formTemplate,
        controller: 'TileFormController'
    };
};
