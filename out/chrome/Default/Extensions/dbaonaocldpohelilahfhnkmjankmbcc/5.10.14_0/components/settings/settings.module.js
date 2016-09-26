import 'angular';
import 'ngStorage';
import {SettingsController} from './settings.controller.js';
import {
    settingsMain,
    backgroundImage,
    subColors,
    fileread,
    pin
} from './settings.directives.js';
import {settingsService} from './settings.service.js';


angular.module('settings', ['ngStorage'])
    .service('settingsService', settingsService)
    .controller('SettingsController', SettingsController)
    .directive('settingsMain', settingsMain)
    .directive('backgroundImage', backgroundImage)
    .directive('subColors', subColors)
    .directive('pin', pin)
    .directive('fileread', fileread);