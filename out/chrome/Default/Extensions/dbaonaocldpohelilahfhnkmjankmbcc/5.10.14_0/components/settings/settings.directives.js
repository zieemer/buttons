"use strict";

import settingsTemplate from './templates/settings.html';

export let settingsMain = [() => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: settingsTemplate
    };
}];

let calcDimensions = elem => {
    let bg = $('.all-background');
    let gabarits = {
        width: $(bg).width(),
        height: $(bg).height()
    };
    let data = elem.offset();
    let offsetsInvert = {
        top: -data.top,
        left: -data.left
    };
    elem.css({
        width: gabarits.width,
        height: gabarits.height,
        top: offsetsInvert.top,
        left: offsetsInvert.left
    });
};

export let backgroundImage = ['$localStorage', '$rootScope', 'utilsService',
                             ($localStorage, $rootScope, utilsService) => {
    return {
        restrict: 'A',
        link: (scope, elem, attrs) => {
            scope.subscribeIsResizeEvent = false;
            if(!scope.subscribeIsResizeEvent) {
                scope.subscribeIsResizeEvent = true;
                let debounced = utilsService.debounce(() => {
                    if(elem.hasClass('blur-bg')) {
                        calcDimensions(elem);
                    }
                }, 300);
                $(window).on('resize', debounced);
            }
            $rootScope.$on('setBg', (e, data) => {
                let bg = data.bg;
                let img = new Image();
                img.onload = () => {
                    $rootScope.$broadcast('setBgSuccess', true);
                    elem.css('background-image', `url(${img.src})`);
                    elem.parent().addClass('bg-on');
                    elem.css('opacity', '1');

                    // if(elem.hasClass('blur-bg')) {
                    //     calcDimensions(elem);
                    // }
                };
                img.onerror = err => {
                    $rootScope.$broadcast('setBgSuccess', false);
                    elem.parent().addClass('bg-on');
                    elem.css('background-image', `url(${$localStorage.userThemeSettings.defaultTheme})`);
                    elem.css('opacity', '1');
                    console.error(err);
                };
                img.src = bg;
                // setTimeout(() => {
                //     if (!img.complete || !img.naturalWidth) {
                //         console.log('default background');
                //         img.src = '/resources/default_bg.jpg';
                //     }
                // }, 5000);
            });
            $rootScope.$on('hideBg', () => {
                elem.parent().removeClass('bg-on');
                elem.css('opacity', '0');
            });
            $rootScope.$on('showBg', () => {
                scope.$emit('setBg', {bg: $localStorage.userThemeSettings.currentTheme});
            });
        }
    };
}];

export let fileread = ['$localStorage', $localStorage => {
  return {
    restrict: 'AE',
    scope: {
      fileread: "="
    },
    link: function (scope, element, attributes) {
      const MAXFILESIZE = 2000000;
      element.on("change", function (changeEvent) {
          if(changeEvent.target && changeEvent.target.files.length > 0) {
              if(changeEvent.target.files[0].size > MAXFILESIZE) {
                  alert('Limit file size 2Mb');
                  return false;
              }
              var reader = new FileReader();
              reader.onload = loadEvent => {
                  scope.fileread = loadEvent.target.result;
                  scope.$emit('user:loadBg', {bg: loadEvent.target.result});
              };
              reader.onerror = () => {
                  scope.$emit('user:loadBg', {bg: $localStorage.userThemeSettings.defaultTheme});
              };
              reader.readAsDataURL(changeEvent.target.files[0]);
          }
      });
    }
  }
}];

import colorsTemplate from './templates/colors.html';

export let subColors = ['$rootScope', '$localStorage', ($rootScope, $localStorage) => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: colorsTemplate,
        controller: $scope => {
            let ls = $localStorage;

            $scope.clickColor = (index, item) => {
                $scope.currentColor = index;
                $localStorage.userThemeSettings.colorLayout = item;
                $localStorage.userThemeSettings.currentColor = index;
                $rootScope.$emit('change:colors', item);
            };
            $scope.colors = [
                {color: '#ffffff', text: 'black'},
                {color: '#505050', text: 'white'},
                {color: '#ff4974', text: 'white'},
                {color: '#62d7c5', text: 'black'},
                {color: '#b1a64e', text: 'white'},
                {color: '#5d493a', text: 'white'},
                {color: '#fb732e', text: 'black'},
                {color: '#04a4c4', text: 'black'},
                {color: '#f4ff98', text: 'black'},
                {color: '#9879b8', text: 'white'},
                {color: '#99e280', text: 'black'},
                {color: '#98f2ff', text: 'black'}
            ];
            $scope.currentColor = ($localStorage.userThemeSettings && $localStorage.userThemeSettings.currentColor) || 0;

            let layout = ls && ls.userThemeSettings && ls.userThemeSettings.colorLayout;
            $rootScope.$emit('change:colors', layout || $scope.colors[0]);
        }
    };
}];

export let pin = [() => {
    return {
        restrict: 'E',
        template: '<div class="pin-it-icon" data-ng-class="{pinned: pinned}"></div>',
        replace: true,
        link: (scope, elem, attrs) => {
            const pinnedClass = 'pinned';

            elem.on('click', function (e) {
                $(this).toggleClass(pinnedClass);
                scope.pinned = !scope.pinned;
                scope.$emit('pin', scope.pinned);
            });
        }
    }
}];
