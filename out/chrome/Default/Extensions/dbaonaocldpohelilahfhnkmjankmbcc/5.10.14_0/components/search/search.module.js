'use strict';

import 'angular';
import {SearchController} from './search.controller';
import {searchService} from './search.service';
import {searchDirective, arrowSelect} from './search.directive';

angular
    .module('search', [])
    .controller('SearchController', SearchController)
    .factory('searchService', searchService)
    .directive('search', searchDirective)
    .directive('arrowSelect', arrowSelect);
