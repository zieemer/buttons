'use strict';

import 'angular';
import {TabsController} from './tabs.controller';
import {tabsService} from './tabs.service';
import {tabDirective, tabsDirective} from './tabs.directive';

angular
    .module('tabs', [])
    .controller('TabsController', TabsController)
    .factory('tabsService', tabsService)
    .directive('tab', tabDirective)
    .directive('tabs', tabsDirective);