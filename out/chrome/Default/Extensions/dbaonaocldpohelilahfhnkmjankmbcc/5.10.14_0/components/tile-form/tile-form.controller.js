'use strict';

export let TileFormController = [
    '$scope',
    '$rootScope',
    (
        $scope,
        $rootScope
    ) => {

    let editMode = false;

    let addTitle = chrome.i18n.getMessage('addWebsite');
    let editTitle = chrome.i18n.getMessage('editWebsite');
    let addButton = chrome.i18n.getMessage('add');
    let editButton = chrome.i18n.getMessage('edit');

    const setTitles = (editMode) => {
        console.log('set titles', editMode);
        $scope.editMode = editMode === undefined ? false : true;
        $scope.formTitle = $scope.editMode ? editTitle : addTitle;
        $scope.submitButton = $scope.editMode ? editButton : addButton;
    };

    $scope.urlPlaceholder = chrome.i18n.getMessage('newWebsiteURL');
    $scope.titlePlaceholder = chrome.i18n.getMessage('newWebsiteTitle');
    $scope.showForm = false;

    const _showForm = show => {
        const val = !!show;
        if (val) {
            $rootScope.$broadcast('hideFormsAndPopups');
        }
        $scope.showForm = val;
    };
    const hideForm = () => _showForm(false);
    const showForm = () => _showForm(true);
    const toggleForm = () => _showForm(!$scope.showForm);

    // Variable to store old tile data
    let oldTile = {};

    // Add tile button handler
    $scope.addTile = () => {
        delete $scope.index;
        $scope.tile = {};
        oldTile = {};
        setTitles();
        toggleForm();
    };

    $scope.save = function (tile) {
        if (!tile || !tile.url) return;

        if (!/^https?:\/\//.test(tile.url)) {
            tile.url = `http://${tile.url}`;
        }

        // Use URL constructor to solve forward slash problem in url comparison
        tile.url = new URL(tile.url).href;

        $scope.$emit('saveTile', { tile, oldTile, index: $scope.index });
        $scope.reset();
    };

    $scope.reset = function () {
        $scope.tile = {};
        oldTile = {};
        hideForm();
    };

    $scope.closeThis = hideForm;

    $scope.$on('showForm', (e, data, index) => {
        $scope.tile = angular.copy(data);
        $scope.index = index;
        oldTile = angular.copy(data);
        setTitles(true);
        showForm();
    });

    $scope.$on('hideFormsAndPopups', hideForm);
    $scope.$on('ESC', hideForm);
}];