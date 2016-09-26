'use strict';

import 'angular';
import {TilesByCategoriesController} from './tiles-by-categories.controller';
import {tilesByCategoriesService} from './tiles-by-categories.service';
import {tilesByCategoriesDirective, tilesCategoriesDropdownDirective} from './tiles-by-categories.directive';

angular
    .module('tilesByCategories', [])
    .controller('TilesByCategoriesController', TilesByCategoriesController)
    .factory('tilesByCategoriesService', tilesByCategoriesService)
    .directive('tilesCategoriesDropdown', tilesCategoriesDropdownDirective)
    .directive('tilesByCategories', tilesByCategoriesDirective);
