'use strict';

import tilesTemplate from './templates/tiles.html';
import previewTemplate from './templates/tile-preview.html';
import previewDefaultTemplate from './templates/tile-preview-default.html';
import preloaderTemplate from './templates/preloader.html';
import historyTemplate from './templates/history.html';
import tilesAddButtonTemplate from './templates/tiles-add-button.html';
import syncProgressTemplate from './templates/sync-progress.html';

export let tiles = function() {
    return {
        templateUrl: tilesTemplate
    };
};

export let tilePreview = function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: previewTemplate
    };
};

export let tilePreviewDefault = function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: previewDefaultTemplate
    };
};

export let preloader = function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: preloaderTemplate
    };
};

export let historyView = function() {
    return {
        restrict: 'E',
        templateUrl: historyTemplate,
        replace: true,
        link: (scope, elem, attrs) => {
            console.log('history directive');
        }
    };
};

export let removeHistoryItem = () => {
    return {
        restrict: 'A',
        link: (scope, elem, attrs) => {
            elem.on('click', '.del-history-item', e => {
                e.preventDefault();
                let target = e.target;
                if(target && target.href) {
                    chrome.history.deleteUrl({url: target.href}, () => {
                        $(target).closest('.js-hist').remove();
                        scope.$emit('delete:history');
                    });
                }
            });
        }
    };
};

export let tilesAddButton = () => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: tilesAddButtonTemplate,
        link: (scope, elem, attrs) => {
            scope.$on('toggleTilesAddButton', (e, data) => {
                elem.toggle(data);
            });
        }
    }
};

export let syncProgress = () => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: syncProgressTemplate
    }
};

export let inTileHistory = ['$timeout', ($timeout) => {
    return {
        restrict: 'A',
        link: (scope, elem, attrs) => {
            let timer;
            const className = 'inTileHistory';

            elem.on('click', '.inTileHistoryTrigger', () => {
                elem.addClass(className);
            });

            elem.on('mouseover', e => {
                e.preventDefault();

                $timeout.cancel(timer);

                // Check if element has attribute `data-in-tile-history-stop`
                if (e.target.dataset.inTileHistoryStop !== undefined) return;

                timer = $timeout(() => {
                    // If tile is been dragging right now then leave
                    if (elem.hasClass('ui-sortable-helper')) return;

                    let trigger = elem.find('.inTileHistoryTrigger');
                    if (trigger.hasClass('active')) {
                        console.log('no widget because already widget');
                        return;
                    }
                    scope.$emit('getHistoryForWebsite', scope.tile.url);
                }, 100);
            });

            elem.on('mouseleave', e => {
                $timeout.cancel(timer);
                elem.removeClass(className);
                $('.inTileHistoryTrigger.active').removeClass('active');
                scope.$evalAsync(() => {
                    delete scope.tile.widget;
                })
            });

            scope.$on('gotHistoryForWebsite', (e, data) => {
                let items = data[scope.tile.url];
                if (items) {
                    let trigger = elem.find('.inTileHistoryTrigger');
                    if (trigger) {
                        $('.inTileHistoryTrigger.active').removeClass('active');
                    }

                    scope.$evalAsync(() => {
                        trigger.addClass('active');
                        scope.tile.widget = {
                            items
                        }
                    })
                }
            })
        }
    }
}];