declare var global: any;
declare var document: any;
declare var module: any;
declare var __eval: any;

export const loadBags = [
	document
];

export const IncludeLib = {
	loadBags,
	
};


export const emptyResponse = {
	load: {}
};


export const __require = {
    nativeRequire: null,
    includeRequire: null 
};


if (global.require) {
	let name = global.require.name;
	if (name !== 'amd' && name !== 'commonjs') {
		__require.nativeRequire = global.require;
	}
}

let _isBrowser = false, _isNode = false;

//#if (BROWSER)
_isBrowser = true;
_isNode = false;
//#endif

//#if (NODE)
_isBrowser = false;
_isNode = true;
//#endif


export const isBrowser = _isBrowser;
export const isNode = _isNode;
export const isWeb = !! (typeof location !== 'undefined' && location.protocol && /^https?:/.test(location.protocol));

export const refs = {
	XMLHttpRequest: global.XMLHttpRequest,
	evaluate: typeof __eval !== 'undefined' ? __eval : null 
};

export const handler = {
	onerror: null
};

const _global = typeof global === 'undefined' ? null : global;
const _module = typeof module === 'undefined' ? null : module;
const _document = typeof document === 'undefined' ? null : document;

export { _global as global, _module as module, _document as document };

const __noConflict = {
	require: _global.require,
	module: _global.module,
	include: _global.include,
	exports: _global.exports
};

export function noConflict () {
	for (let key in __noConflict) {
		try {
			_global[key] = __noConflict[key];
		} catch (error) {}
	}
}
