"use strict";

export default ['$q', '$http', '$filter', ($q, $http, $filter) => {
    const timeoutXHR = 3000;

    /**
     * Get preset image for the web-site via Orbitum API.
     * @param  {String} url
     * @return {Object}     {image, image_prop, image_url, result}
     * @async
     */
    function getSiteImage (url) {
        if (!url) return $q.resolve(null);

        return $http
            .get(`http://ext.orbitum.com/mspeed/preview_books/preview.php?url=${url}`, {timeout: timeoutXHR})
            .then(res => res.data)
            .catch(err => null);
    }

    /**
     * Extract domain from the URL.
     * @param  {String} value URL
     * @return {String}
     */
    function extractDomain (value) {
        if (!value) return null;

        let url;
        try {
            url = new URL(value);
        } catch (e) {
            return false;
        }

        let unpunied = $filter('unpunycode')(url.host);

        return unpunied;
    }

    /**
     * Get web-site title.
     * @param  {String} url
     * @return {String}     Web-site title
     * @async
     */
    function getSiteTitle (url) {
        if (!url) return $q.resolve(null);

        return $http
            .get(url, {timeout: timeoutXHR})
            .then(res => {
                let title = res.data.match(/<title.*>\s*(.*)\s*<\/title>/mi);
                return title ? title[1] : false;
            })
            .catch(err => null)
            .then(res => res || extractDomain(url));
    }

    /**
     * Parse web-site properties.
     * @param  {String} url
     * @return {Object}     {title, image}
     * @async
     */
    function getSiteMeta (url) {
        if (!url) return $q.resolve(null);

        return $http
            .get(url, {timeout: timeoutXHR})
            .then(res => {
                if (res && res.data) {
                    let getOpenGraphMeta = (property, data) => {
                        let r = new RegExp(`property="og:${property}"\\s+content="(.*)"`).exec(data);
                        return r && r[1];
                    };

                    let image;
                    let imageFromOG = getOpenGraphMeta('image', res.data);

                    if (imageFromOG) {
                        image = imageFromOG;
                    } else {
                        let imageFromLink = /rel="image_src"\s+href="(.*)"/.exec(res.data);
                        if (imageFromLink) {
                            image = imageFromLink[1];
                        }
                    }

                    let title;
                    let titleFromOG = getOpenGraphMeta('title', res.data);

                    if (titleFromOG) {
                        title = titleFromOG;
                    } else {
                        let titleFromTag = /<title>(.*)<\/title>/.exec(res.data);
                        if (titleFromTag) {
                            title = titleFromTag[1];
                        }
                    }

                    return {
                        title,
                        image
                    }
                }

                return null;
            });
    }

    //запрос на получение favicon.ico через сервис Google
    function getFavicon (domain) {
        // We can get favicons from browser's cache using chrome://favicon
        // but if user never navigated to the site then we can get only default
        // favicon which causes a wrong tile background color detection.
        /*return $q((resolve, reject) => {
            let image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = `chrome://favicon/size/16@1x/${domain}`;
        });*/

        let urlGetFavicon = `http://www.google.com/s2/favicons?domain=${domain}&_${Date.now()}`;
        return window.fetch(urlGetFavicon)
            .then(data => data.blob())
            .then(img => {
                return $q((resolve, reject) => {
                    let reader = new FileReader();
                    reader.onloadend = () => {
                        let image = new Image();
                        image.onload = () => resolve(image);
                        image.src = reader.result;
                    };
                    reader.onerror = err => reject(err);
                    reader.readAsDataURL(img);
                });
            })
            .catch(err => null);
    }

    /**
     * Convert object {r, g, b} into string 'r,g,b'.
     * @param  {Object} rgb {r, g, b}
     * @return {String}     'r,g,b'
     */
    function convertToStyleString (rgb) {
        let {r, g, b} = rgb;
        return `${r},${g},${b}`;
    }

    // TODO: check out the https://github.com/jariz/vibrant.js/
    //функция для получения основного цвета фавки
    function getAverageRGB (imgEl) {
        var blockSize = 5, // visit every 5 pixels
            defaultRGB = {r: 0, g: 0, b: 0}, // for non-supporting envs
            canvas = document.createElement('canvas'),
            context = canvas.getContext && canvas.getContext('2d'),
            data, width, height,
            i = -4,
            length,
            rgb = {r: 0, g: 0, b: 0},
            count = 0;

        if (!context) {
            return defaultRGB;
        }

        height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
        width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

        context.drawImage(imgEl, 0, 0);

        try {
            data = context.getImageData(0, 0, width, height);
        } catch (e) {
            /* security error, img on diff domain */
            return defaultRGB;
        }

        length = data.data.length;

        while ((i += blockSize * 4) < length) {
            ++count;
            rgb.r += data.data[i];
            rgb.g += data.data[i + 1];
            rgb.b += data.data[i + 2];
        }

        // ~~ used to floor values
        rgb.r = ~~(rgb.r / count);
        rgb.g = ~~(rgb.g / count);
        rgb.b = ~~(rgb.b / count);
        return rgb;
    }

    /**
     * Chooses text color for specified background color
     * @param  {String} rgb String with RGB values delimited with commas
     * @return {String}     String with RGB values delimited with commas
     */
    function getTextColor (rgb) {
        let ar = rgb.split(',');

        if (ar.length !== 3) return null;

        let r = ar[0];
        let g = ar[1];
        let b = ar[2];
        let yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return (yiq >= 208) ? '0,0,0' : '255,255,255';
    }

    /**
     * Create object with background color and matching text color.
     * @param  {String} color String like 'r,g,b'
     * @return {Object}       {color, textColor}
     */
    function createColorSet (color) {
        return {
            color: `rgb(${color})`,
            textColor: `rgb(${getTextColor(color)})`
        };
    }

    function getRandomColorPreview () {
        let rgbs = [
            // http://www.color-hex.com/color-palette/20657
            {r: 127, g: 214, b: 172},
            {r: 244, g: 201, b: 157},
            {r: 126, g: 154, b: 180},
            {r: 168, g: 140, b: 184},
            {r: 81,  g: 180, b: 133},

            // http://www.color-hex.com/color-palette/20620
            {r: 82,  g: 139, b: 46},
            {r: 189, g: 135, b: 53},
            {r: 66,  g: 48,  b: 42},
            {r: 81,  g: 81,  b: 81},
            {r: 0,   g: 124, b: 161},

            // http://www.color-hex.com/color-palette/20633 *
            {r: 180, g: 179, b: 135},
            {r: 245, g: 127,  b: 76},
            {r: 119, g: 138, b: 171},
            {r: 188, g: 170, b: 170},
            {r: 221, g: 187, b: 152}
        ];

        let color = convertToStyleString(rgbs[Math.floor(Math.random()*15)]);
        return createColorSet(color);
    }

    /**
     * Get tile preview.
     * @param  {String} url
     * @param  {String} title Title of the tile. If empty new title will be requested.
     * @return {Object}       {image, title}
     * @async
     * @public
     */
    function getTilePreview (url, title) {
        let imagePromise = getSiteImage(url);
        let titlePromise = title ? $q.resolve(title) : getSiteTitle(url);

        return $q.all([imagePromise, titlePromise])
            .then(res => {
                if (!res) return null;

                let image = res[0] && res[0].image_url;
                let title = res[1];

                if (image) {
                    return {image, title};
                }

                let favicon;
                let colorSet;
                return getFavicon(url)
                    .catch(err => null)
                    .then(res => {
                        if (res) {
                            favicon = res.src;
                            let avg = getAverageRGB(res);
                            let color = convertToStyleString(avg);
                            colorSet = createColorSet(color);

                            return {favicon, colorSet, title};
                        }

                        colorSet = getRandomColorPreview();
                        favicon = '/resources/default_favicon.png';

                        return {favicon, colorSet, title};
                    });
            });
    }

    return {getTilePreview};
}];