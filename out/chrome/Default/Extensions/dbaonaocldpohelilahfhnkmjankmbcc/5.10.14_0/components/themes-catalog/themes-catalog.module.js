'use strict';

import 'angular';
import themesCatalogController from './themes-catalog.controller';
import themesCatalogService from './themes-catalog.service';
import {themesCatalog} from './themes-catalog.directive';

angular
    .module('themesCatalog', [])
    .controller('themesCatalogController', themesCatalogController)
    .factory('themesCatalogService', themesCatalogService)
    .directive('themesCatalog', themesCatalog);