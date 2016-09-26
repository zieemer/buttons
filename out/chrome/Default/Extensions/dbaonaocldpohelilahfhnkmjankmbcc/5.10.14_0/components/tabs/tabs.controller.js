'use strict';

export let TabsController = [
    '$scope',
    '$rootScope',
    '$confirm',
    'tabsService',
    (
        $scope,
        $rootScope,
        $confirm,
        tabsService
    ) => {

    $scope.addCategoryTitle = chrome.i18n.getMessage('addCategory');
    $scope.moreTitle = chrome.i18n.getMessage('more');

    $scope.maxShowedTabs = 4;
    $scope.addCategory = toggleForm;
    $scope.showMore = val => $scope.showMoreTabs = !!val;

    const emptyNewTab = chrome.i18n.getMessage('addFavorites');
    const emptyRecentTab = chrome.i18n.getMessage('emptyRecentTab');

    setEmptyTabOptions('new');

    function _showForm (show) {
        const val = !!show;
        if (val) {
            $rootScope.$broadcast('hideFormsAndPopups');
        }
        $scope.showCategoryForm = val;
    }

    function hideForm () {
        _showForm(false);
    }

    function toggleForm () {
        _showForm(!$scope.showCategoryForm);
    }

    function setEmptyTabOptions (tab) {
        switch (tab) {
            case 'new':
                $scope.noTilesText = emptyNewTab;
                $scope.addSiteArrowVisible = true;
                break;
            case 'recent':
                $scope.noTilesText = emptyRecentTab;
                $scope.addSiteArrowVisible = false;
                break;
        }
    }

    function removeTab (e, tab) {
        e.stopPropagation();

        $confirm({
            text: chrome.i18n.getMessage('confirmCatDelete'),
            ok: chrome.i18n.getMessage('confirm'),
            cancel: chrome.i18n.getMessage('decline')
        },
        {
            templateUrl: './components/tabs/confirm.html'
        })
        .then(() => {
            if (tabsService.isCurrentTab(tab)) {
                $rootScope.$broadcast('selectTab', tabsService.getPrevious());
            }

            return tabsService.removeTab(tab);
        })
        .then(res => $scope.tabs = res);

    }

    function selectTab (e, tab) {
        if (tabsService.isCurrentTab(tab)) return;

        let isRecentTab = tab.id === tabsService.getRecentTabId();
        setEmptyTabOptions(isRecentTab ? 'recent' : 'new');
    }

    $scope.removeTab = removeTab;
    $scope.selectTab = (e, tab) => {
        $rootScope.$broadcast('selectTab', tab);
    };
    $scope.closeCategoryForm = hideForm;
    $scope.currentTab = tabsService.getCurrentTab();

    $scope.$on('hideFormsAndPopups', hideForm);
    $scope.$on('ESC', hideForm);
    $scope.$on('tabsUpdate', (e, firstRun) => {
        // Load tabs list
        tabsService
            .getTabs()
            .then(tabs => {
                $scope.tabs = tabs;

                if (firstRun) {
                    $rootScope.$broadcast('selectTab', tabsService.getCurrentTab());
                }
            });
    });

    function removeByBookmark (e, bookmark) {
        tabsService
            .removeByBookmark(bookmark)
            .then(res => console.log('removed', res))
            .catch(err => console.info(err))
            .then(() => $rootScope.$broadcast('tabsUpdate'));
    }

    $scope.$on('selectTab', selectTab);
    $scope.$on('removeTab', removeByBookmark);
    $scope.$on('importTab', (e, data) => {
        tabsService
            .importTab(data)
            .then(tab => $rootScope.$broadcast('tabsUpdate'));
    });

    $scope.addCategoryForm = {
        titlePlaceholder: chrome.i18n.getMessage('addNewCategory'),
        title: '',
        submit () {
            let title = $scope.addCategoryForm.title.trim();
            tabsService
                .addTab({title})
                .then(tab => {
                    $rootScope.$broadcast('tabsUpdate');
                    $rootScope.$broadcast('selectTab', tab);
                });

            $scope.addCategoryForm.title = '';
            $scope.categoryForm.$setPristine();
            $scope.categoryForm.$setUntouched();
            hideForm();
        }
    };
    $scope.$broadcast('tabsUpdate', true);
}];