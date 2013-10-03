function bin_removeDelegate(url) {
    // use timeout as sys-file-change event is called twice
    var timeout;
    return function() {
        if (timeout)
            clearTimeout(timeout);

        timeout = setTimeout(function() {
            
            var triggerFn;
            if (typeof cfg.autoreload === 'object') {
                triggerFn = function(state){
                    state !== false && cfg.autoreload.fileChanged(url, 'include');
                };
            }
            
            bin_tryReload(url, triggerFn);
            
        }, 150);
    };
}

function bin_remove(mix) {
    if (mix == null)
        return;

    var type,
        id,
        index,
        res;

    var isUrl = typeof mix === 'string',
        url = isUrl ? mix : mix.url;


    for (type in bin) {

        for (id in bin[type]) {
            res = bin[type][id];

            if (isUrl === false) {
                if (res === mix) {
                    delete bin[type][id];
                    return res;
                }
                continue;
            }

            index = id.indexOf(url);
            if (index !== -1 && index === id.length - url.length) {

                delete bin[type][id];
                
                return type === 'load'
                    ? bin_remove(res.parent)
                    : res
                    ;
            }
        }

    }
    console.warn('<include:res:remove> Resource is not in cache', url);
}

function bin_load(resource) {
    if (resource == null)
        return;

    resource.content = null;
    resource.exports = null;

    var parent = resource.parent;
    return parent
        .create(
            resource.type,
            resource.route,
            resource.namespace,
            resource.xpath
        )
        .on(4, parent.childLoaded);

}

function bin_tryReload(path, callback) {
    var res = bin_remove(path);

    if (res == null) {
        callback && callback(false);
        return;
    }

    return bin_load(res)
        .done(callback);
}