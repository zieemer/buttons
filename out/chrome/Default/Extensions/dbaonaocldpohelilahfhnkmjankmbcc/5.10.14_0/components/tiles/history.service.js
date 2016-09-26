/*
* Get definite count visited sites
* */
export let historyService = ['$q', ($q) => {
    const COUNT = 22;

    let getTime = () => {
        let today = new Date().setHours(0, 0, 0, 0);
        let yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0, 0, 0, 0);
        return {
            today,
            yesterday
        }
    };

    let formatData = ms => {
        if(ms) {
            let time = new Date(ms);
            let hours = time.getHours().toString().length > 1
                            ? time.getHours()
                            : '0' + time.getHours();
            let minutes = time.getMinutes().toString().length > 1
                            ? time.getMinutes()
                            : '0' + time.getMinutes();
            return `${hours}:${minutes}`;
        }
    };

    let search = options => {
        return $q((resolve, reject) => {
            chrome.history.search({
                text: options.text || '',
                startTime: options.startTime,
                endTime: options.endTime,
                maxResults: COUNT
            }, resolve);
        });
    }

    let getHistory = options => {
        return search(options).then(result => {
            let res = [];

            if (result && result.length > 0) {
                res.push({date: options.time  || Date.now()});
                result.forEach(item => {
                    item.lastVisitTime = formatData(item.lastVisitTime);
                    item.locked = true;
                    res.push(item);
                });
            }

            return res;
        });
    };

    return { search, getHistory, getTime, formatData };
}];