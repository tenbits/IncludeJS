(function(global) {

	if (typeof io !== 'undefined' && io.sockets) {
		SocketIOReady();
	}
	else{
		global
			.include
			.instance()
			.embed(window.location.origin + '/socket.io/socket.io.js')
			.done(socketIOReady);	
	}
	
	function socketIOReady() {
		if (!global.io) {
			return;
		}

		var socket = global.io.connect(window.location.origin + '/browser');

		socket.on('filechange', function(path) {
			console.log('Changed:', path);

			fileChanged(path);
		});
	}


	function fileChanged(path) {
		var ext = /\w+$/g.exec(path)[0],
			resource = include.getResource(path);

		if (resource){
			if (resource.reload){
				XHR(path, function(path, response) {
					global.include = resource;
					resource.reload(response);
				});
				return;
			}

			if (resource.type === 'load' && resource.parent && resource.parent.reload){
				XHR(resource, function(resource, response) {
					resource.exports = response;
					resource.parent.includes = [];
					fileChanged(resource.parent.url);
				});
				return;
			}

		}


		var handler = Handlers[ext];

		if (handler) {
			handler(path);
			return;
		}
		
		
		global.location.reload();
	}


	var Handlers = {
		css: handler_Css,
		less: handler_Css,
		mask: function (path) {
			var resource = include.getResource(path);
			if (resource && resource.parent && resource.parent.reload) {
				XHR(resource, function(resource, response) {
					resource.exports = response;
					resource.parent.includes = [];
					fileChanged(resource.parent.url);
				});
				return;
			}
			include.removeFromCache(path);
			
			var reloader = mask.Module.reload;
			if (reloader == null) {
				global.location.reload();
				return;
			}
			if (reloader(path) === false) {
				global.location.reload();
				return;	
			}			
		}
	};
	
	function handler_Css(path) {
		var styles = document.getElementsByTagName('link'),
			imax = styles.length,
			i = 0,
			x, href;

		for (; i < imax; i++) {
			x = styles[i];
			href = x.getAttribute('href');

			if (!href) 
				continue;
			

			if (href[0] === '/')
				href = href.substring(1);
			

			if (href.indexOf('?') !== -1) 
				href = href.substring(0, href.indexOf('?'));
			
			var lPath = path.toLowerCase(),
				rPath = href.toLowerCase();
			if (lPath.indexOf(rPath) !== -1 || rPath.indexOf(lPath) !== -1) {
				reloadTag(x, 'href');
				break;
			}
		}
	}

	function reloadTag(node, srcAttribute) {
		var clone = node.cloneNode(),
			src = node.getAttribute(srcAttribute);

		src += (src.indexOf('?') > -1 ? '&' : '?') + Date.now() + '=true';

		clone.setAttribute(srcAttribute, src);

		node.parentNode.replaceChild(clone, node);
	}
	
	function XHR(resource, callback) {
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			xhr.readyState === 4 && callback && callback(resource, xhr.responseText);
		};

		xhr.open('GET', typeof resource === 'object' ? resource.url : resource, true);
		xhr.send();
	}

}(typeof window === 'undefined' ? global : window));
