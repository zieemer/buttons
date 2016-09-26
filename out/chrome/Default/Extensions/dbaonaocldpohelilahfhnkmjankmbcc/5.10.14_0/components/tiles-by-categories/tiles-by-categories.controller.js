'use strict';

export let TilesByCategoriesController = [
    '$scope',
    '$rootScope',
    'tilesByCategoriesService',
    (
        $scope,
        $rootScope,
        tilesByCategoriesService
    ) => {
        const ITEMS_LIMIT = 6;
        let categories = {};

        $scope.itemsLimit = 0;

        /**
         * Set limit of displayed tiles and check if "Show more" button also
         * should be displayed.
         * @param  {Number} value Limit value
         */
        const setItemsLimit = (value) => {
            $scope.itemsLimit = value;
            $scope.showMoreText = $scope.current.items.length > $scope.itemsLimit;
        };

        /**
         * Increase amount of displayed tiles by specified value.
         * @param  {Number} value
         */
        const addItemsLimit = value => setItemsLimit($scope.itemsLimit + value);

        /**
         * Reset amount of displayed tiles to its default value.
         */
        const resetItemsLimit = () => setItemsLimit(ITEMS_LIMIT);

        tilesByCategoriesService
            .get()
            .then(res => {
                if (!res || !res.length) return;

                for (let i=0, l=res.length; i<l; i++) {
                    let item = res[i];
                    categories[item.id] = {
                        id: item.id,
                        title: item.cname,
                        items: item.books
                    };
                }

                // Assign categories to scope
                $scope.categories = categories;

                // Select first category
                $scope.selectCategory(res[0].id);
            })
            .catch(err => console.error(err));

        /**
         * Tile click handler.
         * @param  {Object} data
         * @public
         */
        $scope.addSite = data => {
            // $scope.editMode will come as string so use JSON.parse to bool it
            let eventName = JSON.parse($scope.editMode) ? 'replaceTile' : 'addTile';

            $rootScope.$broadcast(eventName, {
                tile: {
                    url: new URL(data.url).href,
                    useThisImage: data.image_prop.data
                },
                index: $scope.editIndex
            });
            $rootScope.$broadcast('hideFormsAndPopups');
        };

        /**
         * "Show more" button click handler.
         * @public
         */
        $scope.showMore = addItemsLimit;

        /**
         * Select tiles category.
         * @param  {Number} categoryId Category ID
         * @public
         */
        $scope.selectCategory = categoryId => {
            $scope.current = categories[categoryId];
            resetItemsLimit();
        };

        // "Show more" button title
        $scope.moreText = chrome.i18n.getMessage('moreItems');
}];