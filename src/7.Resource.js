var Resource = function(type, route, namespace, xpath, parent, id) {
		Include.call(this);
		IncludeDeferred.call(this);

		////if (type == null) {
		////	this.state = 3;
		////	return this;
		////}
		
		var url = route && route.path;
		
		if (url != null) {
			this.url = url = Helper.uri.resolveUrl(url, parent);
		}
		
		this.route = route;
		this.namespace = namespace;
		this.type = type;
		this.xpath = xpath;
		
		
		
		if (id == null && url){
			id = (url[0] == '/' ? '' : '/') + url;
		}
		
		
		var resource = bin[type] && bin[type][id];		
		if (resource) {
			resource.route = route;			
			return resource;
		}
		
		if (url == null){
			this.state = 3;
			return this;
		}
		
		
		this.location = Helper.uri.getDir(url);



		(bin[type] || (bin[type] = {}))[id] = this;

		var tag;
		switch (type) {
		case 'js':
			ScriptStack.load(this, parent);
			
			break;
		case 'ajax':
		case 'load':
		case 'lazy':
			Helper.xhr(url, this.onXHRLoaded.bind(this));
			break;
		case 'css':
			this.state = 4;

			tag = document.createElement('link');
			tag.href = url;
			tag.rel = "stylesheet";
			tag.type = "text/css";
			break;
		case 'embed':
			tag = document.createElement('script');
			tag.type = 'application/javascript';
			tag.src = url;
			tag.onload = tag.onerror = this.readystatechanged.bind(this, 4);			
			break;
		}
		if (tag != null) {
			document.querySelector('head').appendChild(tag);
			tag = null;
		}
		return this;
	};

Resource.prototype = Helper.extend({}, IncludeDeferred, Include, {
	include: function(type, pckg) {
		//-this.state = 1;
		this.state = this.state >= 3 ? 3 : 1;

		if (this.includes == null) {
			this.includes = [];
		}


		Routes.each(type, pckg, function(namespace, route, xpath) {
			var resource = new Resource(type, route, namespace, xpath, this);

			this.includes.push(resource);

			resource.index = this.calcIndex(type, namespace);
			resource.on(4, this.childLoaded.bind(this));
		}.bind(this));

		return this;
	},
	/** Deprecated
	 *	Use Resource Alias instead
	 */
	calcIndex: function(type, namespace) {
		if (this.response == null) {
			this.response = {};
		}
		switch (type) {
		case 'js':
		case 'load':
		case 'ajax':
			var key = type + 'Index';
			if (this.response[key] == null) {
				this.response[key] = -1;
			}
			return ++this.response[key];
		}
		return -1;
	},

	childLoaded: function(resource) {


		if (resource && resource.exports) {

			switch (resource.type) {
			case 'js':
			case 'load':
			case 'ajax':

				//////if (this.response == null) {
				//////	this.response = {};
				//////}
				
				if (resource.route.alias){
					this.response[resource.route.alias] = resource.exports;
					break;
				}

				var obj = (this.response[resource.type] || (this.response[resource.type] = []));

				if (resource.namespace != null) {
					obj = Helper.ensureArray(obj, resource.namespace);
				}
				obj[resource.index] = resource.exports;
				break;
			}
		}

		var includes = this.includes;
		if (includes && includes.length) {
			if (this.state < 3/* && this.url != null */){
				/** resource still loading/include is in process, but one of sub resources are already done */
				return;
			}
			for (var i = 0; i < includes.length; i++) {
				if (includes[i].state != 4) {
					return;
				}
			}
		}

		this.readystatechanged(4);

	},

	onXHRLoaded: function(url, response) {
		if (response) {
			switch (this.type) {
			case 'load':
			case 'ajax':
				this.exports = response;
				break;
			case 'lazy':
				LazyModule.create(this.xpath, response);
				break;
			}
			
		} else {
			console.warn('Resource cannt be loaded', this.url);
		}

		this.readystatechanged(4);
	}

});