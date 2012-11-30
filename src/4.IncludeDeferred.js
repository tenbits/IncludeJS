var IncludeDeferred = Class({
	Construct: function() {
		this.callbacks = [];
	},

	/**	state observer */

	on: function(state, callback) {
		state <= this.state ? callback(this) : this.callbacks.unshift({
			state: state,
			callback: callback
		});
		return this;
	},
	readystatechanged: function(state) {
		this.state = state;
		for (var i = 0, x, length = this.callbacks.length; i < length; i++) {
			x = this.callbacks[i];
			
			if (x.state > this.state || x.callback == null) {
				continue;
			}
			x.callback(this);
			x.callback = null;
		}
	},

	/** idefer */

	ready: function(callback) {
		return this.on(4, function() {
			Events.ready(this.resolve.bind(this, callback));
		}.bind(this));
	},
	/** assest loaded and window is loaded */
	loaded: function(callback) {
		return this.on(4, function() {
			Events.load(callback);
		});
	},
	/** assets loaded */
	done: function(callback) {		
		return this.on(4, this.resolve.bind(this, callback));
	},
	resolve: function(callback) {
		var r = callback(this.response);
		if (r != null) {
			this.obj = r;
		}
	}
});