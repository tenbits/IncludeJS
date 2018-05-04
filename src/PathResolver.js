var PathResolver;
(function(){
	PathResolver = {
		configMap: function(map){
			for(var key in map) {
				_map[key] = map;
			}
		},
		configExt: function(config){
			var def = config.def,
				types = config.types;
			for (var key in def) {
				_ext[key] = def[key];
			}
			for(var key in types) {
				_extTypes[key] = types[key];
			}
		},
		resolveBasic: function(path_, type, parent) {
			if (type === 'js' && isNodeModuleResolution(path_)) {
				return path_;
			}
			var path = path_resolveUrl(map(path_), parent);
			return ensureExtension(path, type);
		},
		isNpm: isNodeModuleResolution,
		getType: getTypeForPath,
		resolveNpm: function(path_, type, parent, cb){
			var path = map(path_);
			if (path.indexOf('.') > -1) {
				cb(null, path);
				return;
			}
			if (type === 'js') {
				if (isNodeModuleResolution(path)) {
					var parentsPath = parent && parent.location;
					if (!parentsPath || parentsPath === '/') {
						parentsPath = path_resolveCurrent();
					}
					nodeModuleResolve(parentsPath, path, cb);
					return;
				}
			}
			if (hasExt(path) === false) {
				path += '.' + _ext[type];
			}
			cb(null, path);
		},
		isNodeNative: function (path) {
			return _nodeBuiltIns.indexOf(path) !== -1;
		}
	};
	var _map = {};
	var _ext = {
		'js': 'js',
		'css': 'css',
		'mask': 'mask'
	};
	var _extTypes = {
		'js': 'js',
		'es6': 'js',
		'ts': 'js',
		'css': 'css',
		'less': 'css',
		'scss': 'css',
		'mask': 'mask',
		'json': 'load',
		'yml': 'load'
	};
	var _nodeBuiltIns = [
		"assert",
		"async_hooks",
		"buffer",
		"child_process",
		"cluster",
		"console",
		"constants",
		"crypto",
		"dgram",
		"dns",
		"domain",
		"events",
		"fs",
		"http",
		"http2",
		"https",
		"inspector",
		"module",
		"net",
		"os",
		"path",
		"perf_hooks",
		"process",
		"punycode",
		"querystring",
		"readline",
		"repl",
		"stream",
		"string_decoder",
		"timers",
		"tls",
		"tty",
		"url",
		"util",
		"v8",
		"vm",
		"zlib"
	];
	function map(path) {
		return _map[path] || path;
	}
	function hasExt(path) {
		return /\.[\w]{1,8}($|\?|#)/.test(path);
	}
	function isNodeModuleResolution(path){
		return /^([\w\-]+)(\/[\w\-_]+)*$/.test(path);
	}
	function nodeModuleResolve(current_, path, cb){
		var name = /^([\w\-]+)/.exec(path)[0];
		var resource = path.substring(name.length + 1);
		if (resource && hasExt(resource) === false) {
			resource += '.js';
		}
		var current = current_.replace(/[^\/]+\.[\w]{1,8}$/, '');
		function check(){
			var nodeModules = current + '/node_modules/' + name + '/';
			var pckg = nodeModules + 'package.json';
			XHR_LOAD(pckg, function(error, text){
				var json;
				if (text) {
					try { json = JSON.parse(text); }
					catch (error) {}
				}
				if (error != null || json == null) {
					var next = current.replace(/[^\/]+\/?$/, '');
					if (next === current) {
						cb('Not found');
						return;
					}
					current = next;
					check();
					return;
				}
				if (resource) {
					cb(null, nodeModules + resource);
					return;
				}
				if (json.main) {
					combineMain(nodeModules, json.main, cb);
					return;
				}

				cb(null, path_combine(nodeModules, 'index.js'));
			});
		}
		check();
	}
	function ensureExtension(path, type) {
		if (hasExt(path)) {
			return path;
		}
		var ext = _ext[type];
		if (ext == null) {
			console.warn('Extension is not defined for ' + type);
			return path;
		}
		var i = path.indexOf('?');
		if (i === -1) return path + '.' + ext;

		return path.substring(0, i) + '.' + ext + path.substring(i);
	}
	function getTypeForPath(path){
		var match = /\.([\w]{1,8})($|\?|:)/.exec(path);
		if (match === null) {
			return _extTypes.js;
		}
		var ext = match[1];
		var type = _extTypes[ext];
		return type || 'load';
	}
	
	function combineMain (dir, fileName, cb) {
		var path = path_combine(dir, fileName);
		if (hasExt(path)) {
			cb(null, path);
			return;
		}
		var url = path + '.js';
		XHR_LOAD(url, function(error, text){
			if (error == null) {
				cb(null, url);
				return;
			}
			url = path + '/index.js';
			XHR_LOAD(url, function(error, text){
				if (error == null) {
					cb(null, url);
					return;
				}
				cb('Entry File does not exist: ' + fileName + ' in ' + dir);
			});
		});
	}

}());