
/**
 *	.cfg
 *		: path :=	root path. @default current working path, im browser window.location;
 *		: eval := in node.js this conf. is forced
 *		: lockedToFolder := makes current url as root path
 *			Example "/script/main.js" within this window.location "{domain}/apps/1.html"
 *			will become "{domain}/apps/script/main.js" instead of "{domain}/script/main.js"
 */

var bin = {},
	isWeb = !! (global.location && global.location.protocol && /^https?:/.test(global.location.protocol)),
	cfg = {
		eval: document == null
	},	
	handler = {},
	hasOwnProp = {}.hasOwnProperty,
	rewrites = typeof IncludeRewrites != 'undefined' ? IncludeRewrites : null,
	currentParent = null,
	XMLHttpRequest = global.XMLHttpRequest;
	