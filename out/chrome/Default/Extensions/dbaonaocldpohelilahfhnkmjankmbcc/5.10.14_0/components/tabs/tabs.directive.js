'use strict';

import tabTemplate from './tab.html';
import tabsTemplate from './tabs.html';

export let tabDirective = ['$rootScope', ($rootScope) => {
    return {
        templateUrl: tabTemplate
    };
}];

export let tabsDirective = () => {
    return {
        templateUrl: tabsTemplate,
        controller: 'TabsController'
    };
};