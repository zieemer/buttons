'use strict';

import 'angular';
import 'ngStorage';
import punycode from 'punycode';
import {TilesController} from './tiles.controller';
import {tilesService} from './tiles.service';
import {
    tiles,
    tilePreview,
    tilePreviewDefault,
    preloader,
    historyView,
    removeHistoryItem,
    tilesAddButton,
    syncProgress,
    inTileHistory
} from './tiles.directive';
import {historyService} from './history.service';
import tilePreviewService from './tile-preview.service.js';

/**
 * Виды плиток:
 *     - Рекламная
 *     - Предустановленная (с заранее приготовленной картинкой)
 *     - Пользовательская
 *     - Виджет с историей (как ВК плитка)
 */

angular
    .module('tiles', ['ngStorage'])
    .controller('TilesController', TilesController)
    .factory('tilesService', tilesService)
    .service('historyService', historyService)
    .service('tilePreviewService', tilePreviewService)
    .directive('tiles', tiles)
    .directive('tilePreview', tilePreview)
    .directive('tilePreviewDefault', tilePreviewDefault)
    .directive('preloader', preloader)
    .directive('historyView', historyView)
    .directive('removeHistoryItem', removeHistoryItem)
    .directive('tilesAddButton', tilesAddButton)
    .directive('syncProgress', syncProgress)
    .directive('inTileHistory', inTileHistory)
    .filter('trimLink', () => {
        // Cut out the protocol and forward slash from weblink
        return (input='') => input.replace(/^https?:\/\//, '').replace(/\/$/, '');
    })
    .filter('unsafe', function ($sce) {
        return $sce.trustAsHtml;
    })
    .filter('unpunycode', () => {
        return (input='') => {
            // Do not use URL API because of so much hard constructing it back...
            // So don't care about search params, hashes and whatever else.
            let beginIndex = input.indexOf('xn--');
            if (beginIndex > -1) {
                let endIndex = input.indexOf('/', beginIndex);
                if (endIndex === -1) {
                    endIndex = undefined;
                }

                let puny = input.slice(beginIndex, endIndex);
                let unpuny = punycode.toUnicode(puny);
                let unpunied = input.slice(0, beginIndex) + unpuny + (endIndex ? input.slice(endIndex) : '');

                console.log(`unpunycode: ${input} ==> ${unpunied}`);
                return unpunied;
            } else {
                return input;
            }
        }
    });