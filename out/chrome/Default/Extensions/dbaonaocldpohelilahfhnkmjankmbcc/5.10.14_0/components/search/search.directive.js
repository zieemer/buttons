'use strict';

import searchTemplate from './search.html';

export let searchDirective = () => {
    return {
        templateUrl: searchTemplate,
        controller: 'SearchController'
    };
};

export let arrowSelect = [() => {
    return {
        restrict: 'A',
        scope: {
            arrowSelect: '&',       // fn to call when an item is selected
            arrowSelectReset: '&',  // fn ta call when non-down-up-arrow is pressed
            arrowSelectFrom: '@',   // css class name of the items container
            arrowSelectActive: '@'  // css class name of the active item
        },
        link: function (scope, element, attrs) {
            const UP = 38;
            const DOWN = 40;
            const cssActive = scope.arrowSelectActive;
            const cssContainer = scope.arrowSelectFrom;
            const callback = scope.arrowSelect;
            const resetCallback = scope.arrowSelectReset;
            const returnType = 'text';  // TODO: expose to scope attribute

            if (!cssContainer) {
                return console.warn('No list selector.');
            }

            if (!cssActive) {
                return console.warn('No active item selector.');
            }

            let list = document.querySelector(`.${cssContainer}`);
            if (list) {
                element.bind("keydown", event => {
                    if (list.children.length) {
                        let active = list.querySelector(`.${cssActive}`);
                        let selected;

                        switch (event.which) {
                            case UP:
                                event.preventDefault();

                                if (active) {
                                    // If there is an active item then check
                                    // its previous sibling
                                    if (active.previousElementSibling) {
                                        active.classList.remove(cssActive);
                                        active.previousElementSibling.classList.add(cssActive);
                                        selected = active.previousElementSibling;
                                    }
                                } else {
                                    list.lastElementChild.classList.add(cssActive);
                                    selected = list.lastElementChild;
                                }

                                break;
                            case DOWN:
                                event.preventDefault();

                                if (active) {
                                    // If there is an active item then check
                                    // its nex sibling
                                    if (active.nextElementSibling) {
                                        active.classList.remove(cssActive);
                                        active.nextElementSibling.classList.add(cssActive);
                                        selected = active.nextElementSibling;
                                    }
                                } else {
                                    list.firstElementChild.classList.add(cssActive);
                                    selected = list.firstElementChild;
                                }

                                break;
                            default:
                                if (typeof resetCallback === 'function') {
                                    resetCallback();
                                }

                                break;
                        }

                        let returnValue;
                        if (selected) {
                            switch (returnType) {
                                case 'text':
                                    returnValue = selected.textContent;
                                    break;
                            }
                        }

                        if (typeof callback === 'function') {
                            callback({element: returnValue});
                        }
                    }
                });
            } else {
                console.warn(`Can't find element by selector ".${cssContainer}"`);
            }
        }
    };
}];