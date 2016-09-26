'use strict';

export let tilesByCategoriesService = [
    '$http',
    '$httpParamSerializer',
    '$localStorage',
    (
        $http,
        $httpParamSerializer,
        $localStorage
    ) => {

        const URL = 'http://ext.orbitum.com/myspeed_tips/api/getBooks.php';

        if (!$localStorage.popupTiles) {
            $localStorage.popupTiles = {
                data: []
            };
        }
        let STORAGE = $localStorage.popupTiles;

        /**
         * Get timeout until which we shouldn't touch server.
         * @private
         */
        const getTimeout = () => {
            return STORAGE.timeout || 0;
        };

        /**
         * Set timeout until which we shouldn't touch server.
         * @return {Number} Timestamp of the timeout
         * @private
         */
        const setTimeout = () => {
            const delta = 7 * 24 * 60 * 60 * 1000;  // 1 week;
            return new Date(Date.now() + delta).getTime();
        }

        /**
         * Get tiles for popup.
         * @return {Promise}
         * @public
         */
        const get = () => {
            if (Date.now() > getTimeout()) {
                console.log('Retrieve new popup tiles...');
                return $http
                    .get(URL, {
                        params: {
                            act: 'popup',
                            catid: '1',  // TODO: 'catid' value doesn't matter
                            ccode: $localStorage.ccode || ''  // Such a backdoor (><,)
                        }
                    })
                    .then(res => {
                        console.log('Got new popup tiles', res.data);
                        STORAGE.data = res.data;
                        STORAGE.timeout = setTimeout();
                        return res.data;
                    });
            } else {
                return new Promise((resolve, reject) => {
                    if (STORAGE && STORAGE.data) {
                        console.log('Serve popup tiles from storage');
                        if (!STORAGE.data.length) {
                            console.log(`Actually there are no popup tiles in storage`);
                        }
                        resolve(STORAGE.data);
                    } else {
                        reject('Corrupted storage.');
                    }
                });
            }
        };

        return {
            get
        }
}];
