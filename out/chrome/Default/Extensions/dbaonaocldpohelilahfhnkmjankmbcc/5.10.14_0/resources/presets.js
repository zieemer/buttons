'use strict';

function getUrl(path) {
    return chrome.extension.getURL(path);
}

export let presets = {
    ru: [
        {
            url: 'http://sprashivai.ru/',
            image: getUrl("resources/books/presets/ru/sprashivay.jpg")
        },
        {
            url: 'https://twitter.com/',
            image: getUrl("resources/books/presets/en/twitter.jpg")
        },
        {
            url: 'http://s.click.aliexpress.com/e/E2NbeUByn',
            image: getUrl("resources/books/presets/en/aliexpress.jpg")
        },
        {
            url: 'http://lenta.ru/',
            image: getUrl("resources/books/presets/ru/lenta.jpg")
        },
        {
            url: 'http://livejournal.com/',
            image: getUrl("resources/books/presets/ru/livejournal.jpg")
        },
        {
            url: 'http://vk.com/',
            image: getUrl("resources/books/presets/ru/vk.jpg")
        },
        {
            url: 'http://ok.ru/',
            image: getUrl("resources/books/presets/ru/ok.jpg")
        },
        {
            url: 'https://facebook.com/',
            image: getUrl("resources/books/presets/en/fb.jpg")
        },
        {
            url: 'http://last.fm/',
            image: getUrl("resources/books/presets/en/lastfm.jpg")
        },
        {
            url: 'http://instagram.com/',
            image: getUrl("resources/books/presets/en/instagramm.jpg")
        },
        {
            url: 'http://yandex.ru/?clid=2041984',
            image: getUrl("resources/books/presets/ru/ya.jpg")
        },
        {
            url: 'http://vk.com/games/',
            image: getUrl("resources/books/presets/ru/vkgames.jpg")
        },
        {
            url: 'http://steam.com/',
            image: getUrl("resources/books/presets/en/steam.jpg")
        },
        {
            url: 'http://kinopoisk.ru',
            image: getUrl("resources/books/presets/ru/kinopoisk.jpg")
        },
        {
            url: 'http://youtube.com/',
            image: getUrl("resources/books/presets/en/youtube.jpg")
        }
    ],
    en: [
        {
            url: 'http://facebook.com/',
            image: getUrl("resources/books/presets/en/fb.jpg")
        },
        {
            url: 'http://s.click.aliexpress.com/e/E2NbeUByn',
            image: getUrl("resources/books/presets/en/aliexpress.jpg")
        },
        {
            url: 'http://amazon.com/',
            image: getUrl("resources/books/presets/en/amazon.jpg")
        },
        {
            url: 'http://ebay.com/',
            image: getUrl("resources/books/presets/en/ebay.jpg")
        },
        {
            url: 'http://twitch.com/',
            image: getUrl("resources/books/presets/en/twitch.jpg")
        },
        {
            url: 'http://steam.com/',
            image: getUrl("resources/books/presets/en/steam.jpg")
        },
        {
            url: 'http://tumblr.com/',
            image: getUrl("resources/books/presets/en/tumblr.jpg")
        },
        {
            url: 'http://ask.com/',
            image: getUrl("resources/books/presets/en/ask.jpg")
        },
        {
            url: 'http://gmail.com/',
            image: getUrl("resources/books/presets/en/gmail.jpg")
        },
        {
            url: 'http://pinterest.com/',
            image: getUrl("resources/books/presets/en/pinterest.jpg")
        },
        {
            url: 'http://msn.com/',
            image: getUrl("resources/books/presets/en/msn.jpg")
        },
        {
            url: 'http://lastfm.com/',
            image: getUrl("resources/books/presets/en/lastfm.jpg")
        },
        {
            url: 'http://instagram.com/',
            image: getUrl("resources/books/presets/en/instagramm.jpg")
        },
        {
            url: 'http://youtube.com/',
            image: getUrl("resources/books/presets/en/youtube.jpg")
        },
        {
            url: 'http://twitter.com/',
            image: getUrl("resources/books/presets/en/twitter.jpg")
        }
    ]
};