(function(){
    
    var npmPath,
        atmaPath
        ;
    
    obj_inherit(Resource, {
        
        isBrowser: false,
        isNode: true,
        
        bin_remove: bin_remove,
        bin_tryReload: bin_tryReload,
        path_getFile: function() {
            return path_getFile(this.url);
        },
    
        path_getDir: function() {
            return path_getDir(path_getFile(this.url));
        },
    
        inject: function() {
    
            var pckg = arguments.length === 1 ? arguments[0] : __array_slice.call(arguments);
    
            var current = this;
    
            current.state = current.state >= 3 ? 3 : 2;
    
            var bundle = current.create();
    
            bundle.url = this.url;
            bundle.location = this.location;
            bundle.load(pckg)
                .done(function(resp) {
    
                bundle.state = 3;
                bundle.on(4, function() {
    
                    current
                        .includes
                        .splice
                        .apply(current.includes, [bundle, 1].concat(bundle.includes));
    
                    current.readystatechanged(3);
                });
                    
                inject_process(bundle, 0);
            });
    
            return current;
        },
    
        instance: function(currentUrl) {
            if (typeof currentUrl === 'string') {
    
                var old = module,
                    next = new Module(currentUrl, old);
    
                next.filename = path_getFile(currentUrl);
                next.paths = Module._nodeModulePaths(path_getDir(next.filename));
    
    
                if (npmPath == null) {
                    
                    var PATH = process.env.PATH || process.env.path,
                        parts = PATH.split(require('path').delimiter),
                        npmPath;
                        
                    var i = parts.length,
                        rgx = /([\\\/]npm[\\\/])|([\\\/]npm$)/gi;
                    while ( --i > -1 ){
                        if (rgx.test(parts[i])) {
                            npmPath = parts[i];
                            break;
                        }
                    }
                        
                        
                    if (npmPath) {
                        npmPath = path_combine(npmPath, 'node_modules');
                        atmaPath = path_combine(
                            path_getDir(
                                path_normalize(
                                    process.mainModule.filename
                            )), 'node_modules'
                        );
                    } else {
                        console.error('Could not resolve global NPM Directory from system path');
                        console.log('searched with pattern /npm in', PATH, delimiter);
                    }
                }
    
    
                next.paths.unshift(atmaPath);
                next.paths.unshift(npmPath);
    
                global.module = module = next;
                global.require = require = next.require.bind(next);
            }
    
            var res = new Resource();
            res.state = 4;
            return res;
        }
    });
    
    
    function inject_process(bundle, index){
        if (index >= bundle.includes.length) 
            return bundle.readystatechanged(4);
        
        var include = bundle.includes[index],
            resource = include.resource,
            alias = include.route.alias,
            source = resource.exports
            ;

        resource.exports = null;
        resource.type = 'js';
        resource.includes = null;
        resource.state = 3;
        resource.parent = null;

        for (var key in bin.load) {
            if (bin.load[key] === resource) {
                delete bin.load[key];
                break;
            }
        }

        try {
            __eval(source, resource, true);
        } catch(error) {
            console.error('<inject> Evaluation error', resource.url, error);
            resource.state = 4;
        }
        
        resource.readystatechanged(3);
        resource.on(4, function(){
            
            if (resource.exports && alias) {
                global[alias] = resource.exports;
            }
            
            inject_process(bundle, ++index);
        });
    }
}());