'use strict';

import 'angular';
import {TileFormController} from './tile-form.controller';
import {tileFormDirective} from './tile-form.directive';

angular
    .module('tileForm', [])
    .controller('TileFormController', TileFormController)
    .directive('tileForm', tileFormDirective);
