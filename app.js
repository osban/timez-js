(function () {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var vnode;
	var hasRequiredVnode;

	function requireVnode () {
		if (hasRequiredVnode) { return vnode; }
		hasRequiredVnode = 1;

		function Vnode(tag, key, attrs, children, text, dom) {
			return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, domSize: undefined, state: undefined, events: undefined, instance: undefined}
		}
		Vnode.normalize = function(node) {
			if (Array.isArray(node)) { return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined) }
			if (node == null || typeof node === "boolean") { return null }
			if (typeof node === "object") { return node }
			return Vnode("#", undefined, undefined, String(node), undefined, undefined)
		};
		Vnode.normalizeChildren = function(input) {
			var children = [];
			if (input.length) {
				var isKeyed = input[0] != null && input[0].key != null;
				// Note: this is a *very* perf-sensitive check.
				// Fun fact: merging the loop like this is somehow faster than splitting
				// it, noticeably so.
				for (var i = 1; i < input.length; i++) {
					if ((input[i] != null && input[i].key != null) !== isKeyed) {
						throw new TypeError(
							isKeyed && (input[i] != null || typeof input[i] === "boolean")
								? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit keyed empty fragment, m.fragment({key: ...}), instead of a hole."
								: "In fragments, vnodes must either all have keys or none have keys."
						)
					}
				}
				for (var i = 0; i < input.length; i++) {
					children[i] = Vnode.normalize(input[i]);
				}
			}
			return children
		};

		vnode = Vnode;
		return vnode;
	}

	var hyperscriptVnode;
	var hasRequiredHyperscriptVnode;

	function requireHyperscriptVnode () {
		if (hasRequiredHyperscriptVnode) { return hyperscriptVnode; }
		hasRequiredHyperscriptVnode = 1;

		var Vnode = requireVnode();

		// Call via `hyperscriptVnode.apply(startOffset, arguments)`
		//
		// The reason I do it this way, forwarding the arguments and passing the start
		// offset in `this`, is so I don't have to create a temporary array in a
		// performance-critical path.
		//
		// In native ES6, I'd instead add a final `...args` parameter to the
		// `hyperscript` and `fragment` factories and define this as
		// `hyperscriptVnode(...args)`, since modern engines do optimize that away. But
		// ES5 (what Mithril.js requires thanks to IE support) doesn't give me that luxury,
		// and engines aren't nearly intelligent enough to do either of these:
		//
		// 1. Elide the allocation for `[].slice.call(arguments, 1)` when it's passed to
		//    another function only to be indexed.
		// 2. Elide an `arguments` allocation when it's passed to any function other
		//    than `Function.prototype.apply` or `Reflect.apply`.
		//
		// In ES6, it'd probably look closer to this (I'd need to profile it, though):
		// module.exports = function(attrs, ...children) {
		//     if (attrs == null || typeof attrs === "object" && attrs.tag == null && !Array.isArray(attrs)) {
		//         if (children.length === 1 && Array.isArray(children[0])) children = children[0]
		//     } else {
		//         children = children.length === 0 && Array.isArray(attrs) ? attrs : [attrs, ...children]
		//         attrs = undefined
		//     }
		//
		//     if (attrs == null) attrs = {}
		//     return Vnode("", attrs.key, attrs, children)
		// }
		hyperscriptVnode = function() {
			var arguments$1 = arguments;

			var attrs = arguments[this], start = this + 1, children;

			if (attrs == null) {
				attrs = {};
			} else if (typeof attrs !== "object" || attrs.tag != null || Array.isArray(attrs)) {
				attrs = {};
				start = this;
			}

			if (arguments.length === start + 1) {
				children = arguments[start];
				if (!Array.isArray(children)) { children = [children]; }
			} else {
				children = [];
				while (start < arguments.length) { children.push(arguments$1[start++]); }
			}

			return Vnode("", attrs.key, attrs, children)
		};
		return hyperscriptVnode;
	}

	var hasOwn;
	var hasRequiredHasOwn;

	function requireHasOwn () {
		if (hasRequiredHasOwn) { return hasOwn; }
		hasRequiredHasOwn = 1;

		hasOwn = {}.hasOwnProperty;
		return hasOwn;
	}

	var hyperscript_1$1;
	var hasRequiredHyperscript$1;

	function requireHyperscript$1 () {
		if (hasRequiredHyperscript$1) { return hyperscript_1$1; }
		hasRequiredHyperscript$1 = 1;

		var Vnode = requireVnode();
		var hyperscriptVnode = requireHyperscriptVnode();
		var hasOwn = requireHasOwn();

		var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g;
		var selectorCache = {};

		function isEmpty(object) {
			for (var key in object) { if (hasOwn.call(object, key)) { return false } }
			return true
		}

		function compileSelector(selector) {
			var match, tag = "div", classes = [], attrs = {};
			while (match = selectorParser.exec(selector)) {
				var type = match[1], value = match[2];
				if (type === "" && value !== "") { tag = value; }
				else if (type === "#") { attrs.id = value; }
				else if (type === ".") { classes.push(value); }
				else if (match[3][0] === "[") {
					var attrValue = match[6];
					if (attrValue) { attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\"); }
					if (match[4] === "class") { classes.push(attrValue); }
					else { attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true; }
				}
			}
			if (classes.length > 0) { attrs.className = classes.join(" "); }
			return selectorCache[selector] = {tag: tag, attrs: attrs}
		}

		function execSelector(state, vnode) {
			var attrs = vnode.attrs;
			var hasClass = hasOwn.call(attrs, "class");
			var className = hasClass ? attrs.class : attrs.className;

			vnode.tag = state.tag;
			vnode.attrs = {};

			if (!isEmpty(state.attrs) && !isEmpty(attrs)) {
				var newAttrs = {};

				for (var key in attrs) {
					if (hasOwn.call(attrs, key)) { newAttrs[key] = attrs[key]; }
				}

				attrs = newAttrs;
			}

			for (var key in state.attrs) {
				if (hasOwn.call(state.attrs, key) && key !== "className" && !hasOwn.call(attrs, key)){
					attrs[key] = state.attrs[key];
				}
			}
			if (className != null || state.attrs.className != null) { attrs.className =
				className != null
					? state.attrs.className != null
						? String(state.attrs.className) + " " + String(className)
						: className
					: state.attrs.className != null
						? state.attrs.className
						: null; }

			if (hasClass) { attrs.class = null; }

			for (var key in attrs) {
				if (hasOwn.call(attrs, key) && key !== "key") {
					vnode.attrs = attrs;
					break
				}
			}

			return vnode
		}

		function hyperscript(selector) {
			if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
				throw Error("The selector must be either a string or a component.");
			}

			var vnode = hyperscriptVnode.apply(1, arguments);

			if (typeof selector === "string") {
				vnode.children = Vnode.normalizeChildren(vnode.children);
				if (selector !== "[") { return execSelector(selectorCache[selector] || compileSelector(selector), vnode) }
			}

			vnode.tag = selector;
			return vnode
		}

		hyperscript_1$1 = hyperscript;
		return hyperscript_1$1;
	}

	var trust;
	var hasRequiredTrust;

	function requireTrust () {
		if (hasRequiredTrust) { return trust; }
		hasRequiredTrust = 1;

		var Vnode = requireVnode();

		trust = function(html) {
			if (html == null) { html = ""; }
			return Vnode("<", undefined, undefined, html, undefined, undefined)
		};
		return trust;
	}

	var fragment;
	var hasRequiredFragment;

	function requireFragment () {
		if (hasRequiredFragment) { return fragment; }
		hasRequiredFragment = 1;

		var Vnode = requireVnode();
		var hyperscriptVnode = requireHyperscriptVnode();

		fragment = function() {
			var vnode = hyperscriptVnode.apply(0, arguments);

			vnode.tag = "[";
			vnode.children = Vnode.normalizeChildren(vnode.children);
			return vnode
		};
		return fragment;
	}

	var hyperscript_1;
	var hasRequiredHyperscript;

	function requireHyperscript () {
		if (hasRequiredHyperscript) { return hyperscript_1; }
		hasRequiredHyperscript = 1;

		var hyperscript = requireHyperscript$1();

		hyperscript.trust = requireTrust();
		hyperscript.fragment = requireFragment();

		hyperscript_1 = hyperscript;
		return hyperscript_1;
	}

	var promise = {exports: {}};

	var polyfill;
	var hasRequiredPolyfill;

	function requirePolyfill () {
		if (hasRequiredPolyfill) { return polyfill; }
		hasRequiredPolyfill = 1;
		/** @constructor */
		var PromisePolyfill = function(executor) {
			if (!(this instanceof PromisePolyfill)) { throw new Error("Promise must be called with 'new'.") }
			if (typeof executor !== "function") { throw new TypeError("executor must be a function.") }

			var self = this, resolvers = [], rejectors = [], resolveCurrent = handler(resolvers, true), rejectCurrent = handler(rejectors, false);
			var instance = self._instance = {resolvers: resolvers, rejectors: rejectors};
			var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout;
			function handler(list, shouldAbsorb) {
				return function execute(value) {
					var then;
					try {
						if (shouldAbsorb && value != null && (typeof value === "object" || typeof value === "function") && typeof (then = value.then) === "function") {
							if (value === self) { throw new TypeError("Promise can't be resolved with itself.") }
							executeOnce(then.bind(value));
						}
						else {
							callAsync(function() {
								if (!shouldAbsorb && list.length === 0) { console.error("Possible unhandled promise rejection:", value); }
								for (var i = 0; i < list.length; i++) { list[i](value); }
								resolvers.length = 0, rejectors.length = 0;
								instance.state = shouldAbsorb;
								instance.retry = function() {execute(value);};
							});
						}
					}
					catch (e) {
						rejectCurrent(e);
					}
				}
			}
			function executeOnce(then) {
				var runs = 0;
				function run(fn) {
					return function(value) {
						if (runs++ > 0) { return }
						fn(value);
					}
				}
				var onerror = run(rejectCurrent);
				try {then(run(resolveCurrent), onerror);} catch (e) {onerror(e);}
			}

			executeOnce(executor);
		};
		PromisePolyfill.prototype.then = function(onFulfilled, onRejection) {
			var self = this, instance = self._instance;
			function handle(callback, list, next, state) {
				list.push(function(value) {
					if (typeof callback !== "function") { next(value); }
					else { try {resolveNext(callback(value));} catch (e) {if (rejectNext) { rejectNext(e); }} }
				});
				if (typeof instance.retry === "function" && state === instance.state) { instance.retry(); }
			}
			var resolveNext, rejectNext;
			var promise = new PromisePolyfill(function(resolve, reject) {resolveNext = resolve, rejectNext = reject;});
			handle(onFulfilled, instance.resolvers, resolveNext, true), handle(onRejection, instance.rejectors, rejectNext, false);
			return promise
		};
		PromisePolyfill.prototype.catch = function(onRejection) {
			return this.then(null, onRejection)
		};
		PromisePolyfill.prototype.finally = function(callback) {
			return this.then(
				function(value) {
					return PromisePolyfill.resolve(callback()).then(function() {
						return value
					})
				},
				function(reason) {
					return PromisePolyfill.resolve(callback()).then(function() {
						return PromisePolyfill.reject(reason);
					})
				}
			)
		};
		PromisePolyfill.resolve = function(value) {
			if (value instanceof PromisePolyfill) { return value }
			return new PromisePolyfill(function(resolve) {resolve(value);})
		};
		PromisePolyfill.reject = function(value) {
			return new PromisePolyfill(function(resolve, reject) {reject(value);})
		};
		PromisePolyfill.all = function(list) {
			return new PromisePolyfill(function(resolve, reject) {
				var total = list.length, count = 0, values = [];
				if (list.length === 0) { resolve([]); }
				else { for (var i = 0; i < list.length; i++) {
					(function(i) {
						function consume(value) {
							count++;
							values[i] = value;
							if (count === total) { resolve(values); }
						}
						if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
							list[i].then(consume, reject);
						}
						else { consume(list[i]); }
					})(i);
				} }
			})
		};
		PromisePolyfill.race = function(list) {
			return new PromisePolyfill(function(resolve, reject) {
				for (var i = 0; i < list.length; i++) {
					list[i].then(resolve, reject);
				}
			})
		};

		polyfill = PromisePolyfill;
		return polyfill;
	}

	/* global window */

	var hasRequiredPromise;

	function requirePromise () {
		if (hasRequiredPromise) { return promise.exports; }
		hasRequiredPromise = 1;

		var PromisePolyfill = requirePolyfill();

		if (typeof window !== "undefined") {
			if (typeof window.Promise === "undefined") {
				window.Promise = PromisePolyfill;
			} else if (!window.Promise.prototype.finally) {
				window.Promise.prototype.finally = PromisePolyfill.prototype.finally;
			}
			promise.exports = window.Promise;
		} else if (typeof commonjsGlobal !== "undefined") {
			if (typeof commonjsGlobal.Promise === "undefined") {
				commonjsGlobal.Promise = PromisePolyfill;
			} else if (!commonjsGlobal.Promise.prototype.finally) {
				commonjsGlobal.Promise.prototype.finally = PromisePolyfill.prototype.finally;
			}
			promise.exports = commonjsGlobal.Promise;
		} else {
			promise.exports = PromisePolyfill;
		}
		return promise.exports;
	}

	var render$1;
	var hasRequiredRender$1;

	function requireRender$1 () {
		if (hasRequiredRender$1) { return render$1; }
		hasRequiredRender$1 = 1;

		var Vnode = requireVnode();

		render$1 = function($window) {
			var $doc = $window && $window.document;
			var currentRedraw;

			var nameSpace = {
				svg: "http://www.w3.org/2000/svg",
				math: "http://www.w3.org/1998/Math/MathML"
			};

			function getNameSpace(vnode) {
				return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
			}

			//sanity check to discourage people from doing `vnode.state = ...`
			function checkState(vnode, original) {
				if (vnode.state !== original) { throw new Error("'vnode.state' must not be modified.") }
			}

			//Note: the hook is passed as the `this` argument to allow proxying the
			//arguments without requiring a full array allocation to do so. It also
			//takes advantage of the fact the current `vnode` is the first argument in
			//all lifecycle methods.
			function callHook(vnode) {
				var original = vnode.state;
				try {
					return this.apply(original, arguments)
				} finally {
					checkState(vnode, original);
				}
			}

			// IE11 (at least) throws an UnspecifiedError when accessing document.activeElement when
			// inside an iframe. Catch and swallow this error, and heavy-handidly return null.
			function activeElement() {
				try {
					return $doc.activeElement
				} catch (e) {
					return null
				}
			}
			//create
			function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
				for (var i = start; i < end; i++) {
					var vnode = vnodes[i];
					if (vnode != null) {
						createNode(parent, vnode, hooks, ns, nextSibling);
					}
				}
			}
			function createNode(parent, vnode, hooks, ns, nextSibling) {
				var tag = vnode.tag;
				if (typeof tag === "string") {
					vnode.state = {};
					if (vnode.attrs != null) { initLifecycle(vnode.attrs, vnode, hooks); }
					switch (tag) {
						case "#": createText(parent, vnode, nextSibling); break
						case "<": createHTML(parent, vnode, ns, nextSibling); break
						case "[": createFragment(parent, vnode, hooks, ns, nextSibling); break
						default: createElement(parent, vnode, hooks, ns, nextSibling);
					}
				}
				else { createComponent(parent, vnode, hooks, ns, nextSibling); }
			}
			function createText(parent, vnode, nextSibling) {
				vnode.dom = $doc.createTextNode(vnode.children);
				insertNode(parent, vnode.dom, nextSibling);
			}
			var possibleParents = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"};
			function createHTML(parent, vnode, ns, nextSibling) {
				var match = vnode.children.match(/^\s*?<(\w+)/im) || [];
				// not using the proper parent makes the child element(s) vanish.
				//     var div = document.createElement("div")
				//     div.innerHTML = "<td>i</td><td>j</td>"
				//     console.log(div.innerHTML)
				// --> "ij", no <td> in sight.
				var temp = $doc.createElement(possibleParents[match[1]] || "div");
				if (ns === "http://www.w3.org/2000/svg") {
					temp.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\">" + vnode.children + "</svg>";
					temp = temp.firstChild;
				} else {
					temp.innerHTML = vnode.children;
				}
				vnode.dom = temp.firstChild;
				vnode.domSize = temp.childNodes.length;
				// Capture nodes to remove, so we don't confuse them.
				vnode.instance = [];
				var fragment = $doc.createDocumentFragment();
				var child;
				while (child = temp.firstChild) {
					vnode.instance.push(child);
					fragment.appendChild(child);
				}
				insertNode(parent, fragment, nextSibling);
			}
			function createFragment(parent, vnode, hooks, ns, nextSibling) {
				var fragment = $doc.createDocumentFragment();
				if (vnode.children != null) {
					var children = vnode.children;
					createNodes(fragment, children, 0, children.length, hooks, null, ns);
				}
				vnode.dom = fragment.firstChild;
				vnode.domSize = fragment.childNodes.length;
				insertNode(parent, fragment, nextSibling);
			}
			function createElement(parent, vnode, hooks, ns, nextSibling) {
				var tag = vnode.tag;
				var attrs = vnode.attrs;
				var is = attrs && attrs.is;

				ns = getNameSpace(vnode) || ns;

				var element = ns ?
					is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
					is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag);
				vnode.dom = element;

				if (attrs != null) {
					setAttrs(vnode, attrs, ns);
				}

				insertNode(parent, element, nextSibling);

				if (!maybeSetContentEditable(vnode)) {
					if (vnode.children != null) {
						var children = vnode.children;
						createNodes(element, children, 0, children.length, hooks, null, ns);
						if (vnode.tag === "select" && attrs != null) { setLateSelectAttrs(vnode, attrs); }
					}
				}
			}
			function initComponent(vnode, hooks) {
				var sentinel;
				if (typeof vnode.tag.view === "function") {
					vnode.state = Object.create(vnode.tag);
					sentinel = vnode.state.view;
					if (sentinel.$$reentrantLock$$ != null) { return }
					sentinel.$$reentrantLock$$ = true;
				} else {
					vnode.state = void 0;
					sentinel = vnode.tag;
					if (sentinel.$$reentrantLock$$ != null) { return }
					sentinel.$$reentrantLock$$ = true;
					vnode.state = (vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function") ? new vnode.tag(vnode) : vnode.tag(vnode);
				}
				initLifecycle(vnode.state, vnode, hooks);
				if (vnode.attrs != null) { initLifecycle(vnode.attrs, vnode, hooks); }
				vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode));
				if (vnode.instance === vnode) { throw Error("A view cannot return the vnode it received as argument") }
				sentinel.$$reentrantLock$$ = null;
			}
			function createComponent(parent, vnode, hooks, ns, nextSibling) {
				initComponent(vnode, hooks);
				if (vnode.instance != null) {
					createNode(parent, vnode.instance, hooks, ns, nextSibling);
					vnode.dom = vnode.instance.dom;
					vnode.domSize = vnode.dom != null ? vnode.instance.domSize : 0;
				}
				else {
					vnode.domSize = 0;
				}
			}

			//update
			/**
			 * @param {Element|Fragment} parent - the parent element
			 * @param {Vnode[] | null} old - the list of vnodes of the last `render()` call for
			 *                               this part of the tree
			 * @param {Vnode[] | null} vnodes - as above, but for the current `render()` call.
			 * @param {Function[]} hooks - an accumulator of post-render hooks (oncreate/onupdate)
			 * @param {Element | null} nextSibling - the next DOM node if we're dealing with a
			 *                                       fragment that is not the last item in its
			 *                                       parent
			 * @param {'svg' | 'math' | String | null} ns) - the current XML namespace, if any
			 * @returns void
			 */
			// This function diffs and patches lists of vnodes, both keyed and unkeyed.
			//
			// We will:
			//
			// 1. describe its general structure
			// 2. focus on the diff algorithm optimizations
			// 3. discuss DOM node operations.

			// ## Overview:
			//
			// The updateNodes() function:
			// - deals with trivial cases
			// - determines whether the lists are keyed or unkeyed based on the first non-null node
			//   of each list.
			// - diffs them and patches the DOM if needed (that's the brunt of the code)
			// - manages the leftovers: after diffing, are there:
			//   - old nodes left to remove?
			// 	 - new nodes to insert?
			// 	 deal with them!
			//
			// The lists are only iterated over once, with an exception for the nodes in `old` that
			// are visited in the fourth part of the diff and in the `removeNodes` loop.

			// ## Diffing
			//
			// Reading https://github.com/localvoid/ivi/blob/ddc09d06abaef45248e6133f7040d00d3c6be853/packages/ivi/src/vdom/implementation.ts#L617-L837
			// may be good for context on longest increasing subsequence-based logic for moving nodes.
			//
			// In order to diff keyed lists, one has to
			//
			// 1) match nodes in both lists, per key, and update them accordingly
			// 2) create the nodes present in the new list, but absent in the old one
			// 3) remove the nodes present in the old list, but absent in the new one
			// 4) figure out what nodes in 1) to move in order to minimize the DOM operations.
			//
			// To achieve 1) one can create a dictionary of keys => index (for the old list), then iterate
			// over the new list and for each new vnode, find the corresponding vnode in the old list using
			// the map.
			// 2) is achieved in the same step: if a new node has no corresponding entry in the map, it is new
			// and must be created.
			// For the removals, we actually remove the nodes that have been updated from the old list.
			// The nodes that remain in that list after 1) and 2) have been performed can be safely removed.
			// The fourth step is a bit more complex and relies on the longest increasing subsequence (LIS)
			// algorithm.
			//
			// the longest increasing subsequence is the list of nodes that can remain in place. Imagine going
			// from `1,2,3,4,5` to `4,5,1,2,3` where the numbers are not necessarily the keys, but the indices
			// corresponding to the keyed nodes in the old list (keyed nodes `e,d,c,b,a` => `b,a,e,d,c` would
			//  match the above lists, for example).
			//
			// In there are two increasing subsequences: `4,5` and `1,2,3`, the latter being the longest. We
			// can update those nodes without moving them, and only call `insertNode` on `4` and `5`.
			//
			// @localvoid adapted the algo to also support node deletions and insertions (the `lis` is actually
			// the longest increasing subsequence *of old nodes still present in the new list*).
			//
			// It is a general algorithm that is fireproof in all circumstances, but it requires the allocation
			// and the construction of a `key => oldIndex` map, and three arrays (one with `newIndex => oldIndex`,
			// the `LIS` and a temporary one to create the LIS).
			//
			// So we cheat where we can: if the tails of the lists are identical, they are guaranteed to be part of
			// the LIS and can be updated without moving them.
			//
			// If two nodes are swapped, they are guaranteed not to be part of the LIS, and must be moved (with
			// the exception of the last node if the list is fully reversed).
			//
			// ## Finding the next sibling.
			//
			// `updateNode()` and `createNode()` expect a nextSibling parameter to perform DOM operations.
			// When the list is being traversed top-down, at any index, the DOM nodes up to the previous
			// vnode reflect the content of the new list, whereas the rest of the DOM nodes reflect the old
			// list. The next sibling must be looked for in the old list using `getNextSibling(... oldStart + 1 ...)`.
			//
			// In the other scenarios (swaps, upwards traversal, map-based diff),
			// the new vnodes list is traversed upwards. The DOM nodes at the bottom of the list reflect the
			// bottom part of the new vnodes list, and we can use the `v.dom`  value of the previous node
			// as the next sibling (cached in the `nextSibling` variable).


			// ## DOM node moves
			//
			// In most scenarios `updateNode()` and `createNode()` perform the DOM operations. However,
			// this is not the case if the node moved (second and fourth part of the diff algo). We move
			// the old DOM nodes before updateNode runs because it enables us to use the cached `nextSibling`
			// variable rather than fetching it using `getNextSibling()`.
			//
			// The fourth part of the diff currently inserts nodes unconditionally, leading to issues
			// like #1791 and #1999. We need to be smarter about those situations where adjascent old
			// nodes remain together in the new list in a way that isn't covered by parts one and
			// three of the diff algo.

			function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
				if (old === vnodes || old == null && vnodes == null) { return }
				else if (old == null || old.length === 0) { createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns); }
				else if (vnodes == null || vnodes.length === 0) { removeNodes(parent, old, 0, old.length); }
				else {
					var isOldKeyed = old[0] != null && old[0].key != null;
					var isKeyed = vnodes[0] != null && vnodes[0].key != null;
					var start = 0, oldStart = 0;
					if (!isOldKeyed) { while (oldStart < old.length && old[oldStart] == null) { oldStart++; } }
					if (!isKeyed) { while (start < vnodes.length && vnodes[start] == null) { start++; } }
					if (isOldKeyed !== isKeyed) {
						removeNodes(parent, old, oldStart, old.length);
						createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns);
					} else if (!isKeyed) {
						// Don't index past the end of either list (causes deopts).
						var commonLength = old.length < vnodes.length ? old.length : vnodes.length;
						// Rewind if necessary to the first non-null index on either side.
						// We could alternatively either explicitly create or remove nodes when `start !== oldStart`
						// but that would be optimizing for sparse lists which are more rare than dense ones.
						start = start < oldStart ? start : oldStart;
						for (; start < commonLength; start++) {
							o = old[start];
							v = vnodes[start];
							if (o === v || o == null && v == null) { continue }
							else if (o == null) { createNode(parent, v, hooks, ns, getNextSibling(old, start + 1, nextSibling)); }
							else if (v == null) { removeNode(parent, o); }
							else { updateNode(parent, o, v, hooks, getNextSibling(old, start + 1, nextSibling), ns); }
						}
						if (old.length > commonLength) { removeNodes(parent, old, start, old.length); }
						if (vnodes.length > commonLength) { createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns); }
					} else {
						// keyed diff
						var oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oe, ve, topSibling;

						// bottom-up
						while (oldEnd >= oldStart && end >= start) {
							oe = old[oldEnd];
							ve = vnodes[end];
							if (oe.key !== ve.key) { break }
							if (oe !== ve) { updateNode(parent, oe, ve, hooks, nextSibling, ns); }
							if (ve.dom != null) { nextSibling = ve.dom; }
							oldEnd--, end--;
						}
						// top-down
						while (oldEnd >= oldStart && end >= start) {
							o = old[oldStart];
							v = vnodes[start];
							if (o.key !== v.key) { break }
							oldStart++, start++;
							if (o !== v) { updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), ns); }
						}
						// swaps and list reversals
						while (oldEnd >= oldStart && end >= start) {
							if (start === end) { break }
							if (o.key !== ve.key || oe.key !== v.key) { break }
							topSibling = getNextSibling(old, oldStart, nextSibling);
							moveNodes(parent, oe, topSibling);
							if (oe !== v) { updateNode(parent, oe, v, hooks, topSibling, ns); }
							if (++start <= --end) { moveNodes(parent, o, nextSibling); }
							if (o !== ve) { updateNode(parent, o, ve, hooks, nextSibling, ns); }
							if (ve.dom != null) { nextSibling = ve.dom; }
							oldStart++; oldEnd--;
							oe = old[oldEnd];
							ve = vnodes[end];
							o = old[oldStart];
							v = vnodes[start];
						}
						// bottom up once again
						while (oldEnd >= oldStart && end >= start) {
							if (oe.key !== ve.key) { break }
							if (oe !== ve) { updateNode(parent, oe, ve, hooks, nextSibling, ns); }
							if (ve.dom != null) { nextSibling = ve.dom; }
							oldEnd--, end--;
							oe = old[oldEnd];
							ve = vnodes[end];
						}
						if (start > end) { removeNodes(parent, old, oldStart, oldEnd + 1); }
						else if (oldStart > oldEnd) { createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns); }
						else {
							// inspired by ivi https://github.com/ivijs/ivi/ by Boris Kaul
							var originalNextSibling = nextSibling, vnodesLength = end - start + 1, oldIndices = new Array(vnodesLength), li=0, i=0, pos = 2147483647, matched = 0, map, lisIndices;
							for (i = 0; i < vnodesLength; i++) { oldIndices[i] = -1; }
							for (i = end; i >= start; i--) {
								if (map == null) { map = getKeyMap(old, oldStart, oldEnd + 1); }
								ve = vnodes[i];
								var oldIndex = map[ve.key];
								if (oldIndex != null) {
									pos = (oldIndex < pos) ? oldIndex : -1; // becomes -1 if nodes were re-ordered
									oldIndices[i-start] = oldIndex;
									oe = old[oldIndex];
									old[oldIndex] = null;
									if (oe !== ve) { updateNode(parent, oe, ve, hooks, nextSibling, ns); }
									if (ve.dom != null) { nextSibling = ve.dom; }
									matched++;
								}
							}
							nextSibling = originalNextSibling;
							if (matched !== oldEnd - oldStart + 1) { removeNodes(parent, old, oldStart, oldEnd + 1); }
							if (matched === 0) { createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns); }
							else {
								if (pos === -1) {
									// the indices of the indices of the items that are part of the
									// longest increasing subsequence in the oldIndices list
									lisIndices = makeLisIndices(oldIndices);
									li = lisIndices.length - 1;
									for (i = end; i >= start; i--) {
										v = vnodes[i];
										if (oldIndices[i-start] === -1) { createNode(parent, v, hooks, ns, nextSibling); }
										else {
											if (lisIndices[li] === i - start) { li--; }
											else { moveNodes(parent, v, nextSibling); }
										}
										if (v.dom != null) { nextSibling = vnodes[i].dom; }
									}
								} else {
									for (i = end; i >= start; i--) {
										v = vnodes[i];
										if (oldIndices[i-start] === -1) { createNode(parent, v, hooks, ns, nextSibling); }
										if (v.dom != null) { nextSibling = vnodes[i].dom; }
									}
								}
							}
						}
					}
				}
			}
			function updateNode(parent, old, vnode, hooks, nextSibling, ns) {
				var oldTag = old.tag, tag = vnode.tag;
				if (oldTag === tag) {
					vnode.state = old.state;
					vnode.events = old.events;
					if (shouldNotUpdate(vnode, old)) { return }
					if (typeof oldTag === "string") {
						if (vnode.attrs != null) {
							updateLifecycle(vnode.attrs, vnode, hooks);
						}
						switch (oldTag) {
							case "#": updateText(old, vnode); break
							case "<": updateHTML(parent, old, vnode, ns, nextSibling); break
							case "[": updateFragment(parent, old, vnode, hooks, nextSibling, ns); break
							default: updateElement(old, vnode, hooks, ns);
						}
					}
					else { updateComponent(parent, old, vnode, hooks, nextSibling, ns); }
				}
				else {
					removeNode(parent, old);
					createNode(parent, vnode, hooks, ns, nextSibling);
				}
			}
			function updateText(old, vnode) {
				if (old.children.toString() !== vnode.children.toString()) {
					old.dom.nodeValue = vnode.children;
				}
				vnode.dom = old.dom;
			}
			function updateHTML(parent, old, vnode, ns, nextSibling) {
				if (old.children !== vnode.children) {
					removeHTML(parent, old);
					createHTML(parent, vnode, ns, nextSibling);
				}
				else {
					vnode.dom = old.dom;
					vnode.domSize = old.domSize;
					vnode.instance = old.instance;
				}
			}
			function updateFragment(parent, old, vnode, hooks, nextSibling, ns) {
				updateNodes(parent, old.children, vnode.children, hooks, nextSibling, ns);
				var domSize = 0, children = vnode.children;
				vnode.dom = null;
				if (children != null) {
					for (var i = 0; i < children.length; i++) {
						var child = children[i];
						if (child != null && child.dom != null) {
							if (vnode.dom == null) { vnode.dom = child.dom; }
							domSize += child.domSize || 1;
						}
					}
					if (domSize !== 1) { vnode.domSize = domSize; }
				}
			}
			function updateElement(old, vnode, hooks, ns) {
				var element = vnode.dom = old.dom;
				ns = getNameSpace(vnode) || ns;

				if (vnode.tag === "textarea") {
					if (vnode.attrs == null) { vnode.attrs = {}; }
				}
				updateAttrs(vnode, old.attrs, vnode.attrs, ns);
				if (!maybeSetContentEditable(vnode)) {
					updateNodes(element, old.children, vnode.children, hooks, null, ns);
				}
			}
			function updateComponent(parent, old, vnode, hooks, nextSibling, ns) {
				vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode));
				if (vnode.instance === vnode) { throw Error("A view cannot return the vnode it received as argument") }
				updateLifecycle(vnode.state, vnode, hooks);
				if (vnode.attrs != null) { updateLifecycle(vnode.attrs, vnode, hooks); }
				if (vnode.instance != null) {
					if (old.instance == null) { createNode(parent, vnode.instance, hooks, ns, nextSibling); }
					else { updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, ns); }
					vnode.dom = vnode.instance.dom;
					vnode.domSize = vnode.instance.domSize;
				}
				else if (old.instance != null) {
					removeNode(parent, old.instance);
					vnode.dom = undefined;
					vnode.domSize = 0;
				}
				else {
					vnode.dom = old.dom;
					vnode.domSize = old.domSize;
				}
			}
			function getKeyMap(vnodes, start, end) {
				var map = Object.create(null);
				for (; start < end; start++) {
					var vnode = vnodes[start];
					if (vnode != null) {
						var key = vnode.key;
						if (key != null) { map[key] = start; }
					}
				}
				return map
			}
			// Lifted from ivi https://github.com/ivijs/ivi/
			// takes a list of unique numbers (-1 is special and can
			// occur multiple times) and returns an array with the indices
			// of the items that are part of the longest increasing
			// subsequence
			var lisTemp = [];
			function makeLisIndices(a) {
				var result = [0];
				var u = 0, v = 0, i = 0;
				var il = lisTemp.length = a.length;
				for (var i = 0; i < il; i++) { lisTemp[i] = a[i]; }
				for (var i = 0; i < il; ++i) {
					if (a[i] === -1) { continue }
					var j = result[result.length - 1];
					if (a[j] < a[i]) {
						lisTemp[i] = j;
						result.push(i);
						continue
					}
					u = 0;
					v = result.length - 1;
					while (u < v) {
						// Fast integer average without overflow.
						// eslint-disable-next-line no-bitwise
						var c = (u >>> 1) + (v >>> 1) + (u & v & 1);
						if (a[result[c]] < a[i]) {
							u = c + 1;
						}
						else {
							v = c;
						}
					}
					if (a[i] < a[result[u]]) {
						if (u > 0) { lisTemp[i] = result[u - 1]; }
						result[u] = i;
					}
				}
				u = result.length;
				v = result[u - 1];
				while (u-- > 0) {
					result[u] = v;
					v = lisTemp[v];
				}
				lisTemp.length = 0;
				return result
			}

			function getNextSibling(vnodes, i, nextSibling) {
				for (; i < vnodes.length; i++) {
					if (vnodes[i] != null && vnodes[i].dom != null) { return vnodes[i].dom }
				}
				return nextSibling
			}

			// This covers a really specific edge case:
			// - Parent node is keyed and contains child
			// - Child is removed, returns unresolved promise in `onbeforeremove`
			// - Parent node is moved in keyed diff
			// - Remaining children still need moved appropriately
			//
			// Ideally, I'd track removed nodes as well, but that introduces a lot more
			// complexity and I'm not exactly interested in doing that.
			function moveNodes(parent, vnode, nextSibling) {
				var frag = $doc.createDocumentFragment();
				moveChildToFrag(parent, frag, vnode);
				insertNode(parent, frag, nextSibling);
			}
			function moveChildToFrag(parent, frag, vnode) {
				// Dodge the recursion overhead in a few of the most common cases.
				while (vnode.dom != null && vnode.dom.parentNode === parent) {
					if (typeof vnode.tag !== "string") {
						vnode = vnode.instance;
						if (vnode != null) { continue }
					} else if (vnode.tag === "<") {
						for (var i = 0; i < vnode.instance.length; i++) {
							frag.appendChild(vnode.instance[i]);
						}
					} else if (vnode.tag !== "[") {
						// Don't recurse for text nodes *or* elements, just fragments
						frag.appendChild(vnode.dom);
					} else if (vnode.children.length === 1) {
						vnode = vnode.children[0];
						if (vnode != null) { continue }
					} else {
						for (var i = 0; i < vnode.children.length; i++) {
							var child = vnode.children[i];
							if (child != null) { moveChildToFrag(parent, frag, child); }
						}
					}
					break
				}
			}

			function insertNode(parent, dom, nextSibling) {
				if (nextSibling != null) { parent.insertBefore(dom, nextSibling); }
				else { parent.appendChild(dom); }
			}

			function maybeSetContentEditable(vnode) {
				if (vnode.attrs == null || (
					vnode.attrs.contenteditable == null && // attribute
					vnode.attrs.contentEditable == null // property
				)) { return false }
				var children = vnode.children;
				if (children != null && children.length === 1 && children[0].tag === "<") {
					var content = children[0].children;
					if (vnode.dom.innerHTML !== content) { vnode.dom.innerHTML = content; }
				}
				else if (children != null && children.length !== 0) { throw new Error("Child node of a contenteditable must be trusted.") }
				return true
			}

			//remove
			function removeNodes(parent, vnodes, start, end) {
				for (var i = start; i < end; i++) {
					var vnode = vnodes[i];
					if (vnode != null) { removeNode(parent, vnode); }
				}
			}
			function removeNode(parent, vnode) {
				var mask = 0;
				var original = vnode.state;
				var stateResult, attrsResult;
				if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeremove === "function") {
					var result = callHook.call(vnode.state.onbeforeremove, vnode);
					if (result != null && typeof result.then === "function") {
						mask = 1;
						stateResult = result;
					}
				}
				if (vnode.attrs && typeof vnode.attrs.onbeforeremove === "function") {
					var result = callHook.call(vnode.attrs.onbeforeremove, vnode);
					if (result != null && typeof result.then === "function") {
						// eslint-disable-next-line no-bitwise
						mask |= 2;
						attrsResult = result;
					}
				}
				checkState(vnode, original);

				// If we can, try to fast-path it and avoid all the overhead of awaiting
				if (!mask) {
					onremove(vnode);
					removeChild(parent, vnode);
				} else {
					if (stateResult != null) {
						var next = function () {
							// eslint-disable-next-line no-bitwise
							if (mask & 1) { mask &= 2; if (!mask) { reallyRemove(); } }
						};
						stateResult.then(next, next);
					}
					if (attrsResult != null) {
						var next = function () {
							// eslint-disable-next-line no-bitwise
							if (mask & 2) { mask &= 1; if (!mask) { reallyRemove(); } }
						};
						attrsResult.then(next, next);
					}
				}

				function reallyRemove() {
					checkState(vnode, original);
					onremove(vnode);
					removeChild(parent, vnode);
				}
			}
			function removeHTML(parent, vnode) {
				for (var i = 0; i < vnode.instance.length; i++) {
					parent.removeChild(vnode.instance[i]);
				}
			}
			function removeChild(parent, vnode) {
				// Dodge the recursion overhead in a few of the most common cases.
				while (vnode.dom != null && vnode.dom.parentNode === parent) {
					if (typeof vnode.tag !== "string") {
						vnode = vnode.instance;
						if (vnode != null) { continue }
					} else if (vnode.tag === "<") {
						removeHTML(parent, vnode);
					} else {
						if (vnode.tag !== "[") {
							parent.removeChild(vnode.dom);
							if (!Array.isArray(vnode.children)) { break }
						}
						if (vnode.children.length === 1) {
							vnode = vnode.children[0];
							if (vnode != null) { continue }
						} else {
							for (var i = 0; i < vnode.children.length; i++) {
								var child = vnode.children[i];
								if (child != null) { removeChild(parent, child); }
							}
						}
					}
					break
				}
			}
			function onremove(vnode) {
				if (typeof vnode.tag !== "string" && typeof vnode.state.onremove === "function") { callHook.call(vnode.state.onremove, vnode); }
				if (vnode.attrs && typeof vnode.attrs.onremove === "function") { callHook.call(vnode.attrs.onremove, vnode); }
				if (typeof vnode.tag !== "string") {
					if (vnode.instance != null) { onremove(vnode.instance); }
				} else {
					var children = vnode.children;
					if (Array.isArray(children)) {
						for (var i = 0; i < children.length; i++) {
							var child = children[i];
							if (child != null) { onremove(child); }
						}
					}
				}
			}

			//attrs
			function setAttrs(vnode, attrs, ns) {
				// If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
				//
				// Also, the DOM does things to inputs based on the value, so it needs set first.
				// See: https://github.com/MithrilJS/mithril.js/issues/2622
				if (vnode.tag === "input" && attrs.type != null) { vnode.dom.setAttribute("type", attrs.type); }
				var isFileInput = attrs != null && vnode.tag === "input" && attrs.type === "file";
				for (var key in attrs) {
					setAttr(vnode, key, null, attrs[key], ns, isFileInput);
				}
			}
			function setAttr(vnode, key, old, value, ns, isFileInput) {
				if (key === "key" || key === "is" || value == null || isLifecycleMethod(key) || (old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || key === "type" && vnode.tag === "input") { return }
				if (key[0] === "o" && key[1] === "n") { return updateEvent(vnode, key, value) }
				if (key.slice(0, 6) === "xlink:") { vnode.dom.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(6), value); }
				else if (key === "style") { updateStyle(vnode.dom, old, value); }
				else if (hasPropertyKey(vnode, key, ns)) {
					if (key === "value") {
						// Only do the coercion if we're actually going to check the value.
						/* eslint-disable no-implicit-coercion */
						//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
						//setting input[type=file][value] to same value causes an error to be generated if it's non-empty
						if ((vnode.tag === "input" || vnode.tag === "textarea") && vnode.dom.value === "" + value && (isFileInput || vnode.dom === activeElement())) { return }
						//setting select[value] to same value while having select open blinks select dropdown in Chrome
						if (vnode.tag === "select" && old !== null && vnode.dom.value === "" + value) { return }
						//setting option[value] to same value while having select open blinks select dropdown in Chrome
						if (vnode.tag === "option" && old !== null && vnode.dom.value === "" + value) { return }
						//setting input[type=file][value] to different value is an error if it's non-empty
						// Not ideal, but it at least works around the most common source of uncaught exceptions for now.
						if (isFileInput && "" + value !== "") { console.error("`value` is read-only on file inputs!"); return }
						/* eslint-enable no-implicit-coercion */
					}
					vnode.dom[key] = value;
				} else {
					if (typeof value === "boolean") {
						if (value) { vnode.dom.setAttribute(key, ""); }
						else { vnode.dom.removeAttribute(key); }
					}
					else { vnode.dom.setAttribute(key === "className" ? "class" : key, value); }
				}
			}
			function removeAttr(vnode, key, old, ns) {
				if (key === "key" || key === "is" || old == null || isLifecycleMethod(key)) { return }
				if (key[0] === "o" && key[1] === "n") { updateEvent(vnode, key, undefined); }
				else if (key === "style") { updateStyle(vnode.dom, old, null); }
				else if (
					hasPropertyKey(vnode, key, ns)
					&& key !== "className"
					&& key !== "title" // creates "null" as title
					&& !(key === "value" && (
						vnode.tag === "option"
						|| vnode.tag === "select" && vnode.dom.selectedIndex === -1 && vnode.dom === activeElement()
					))
					&& !(vnode.tag === "input" && key === "type")
				) {
					vnode.dom[key] = null;
				} else {
					var nsLastIndex = key.indexOf(":");
					if (nsLastIndex !== -1) { key = key.slice(nsLastIndex + 1); }
					if (old !== false) { vnode.dom.removeAttribute(key === "className" ? "class" : key); }
				}
			}
			function setLateSelectAttrs(vnode, attrs) {
				if ("value" in attrs) {
					if(attrs.value === null) {
						if (vnode.dom.selectedIndex !== -1) { vnode.dom.value = null; }
					} else {
						var normalized = "" + attrs.value; // eslint-disable-line no-implicit-coercion
						if (vnode.dom.value !== normalized || vnode.dom.selectedIndex === -1) {
							vnode.dom.value = normalized;
						}
					}
				}
				if ("selectedIndex" in attrs) { setAttr(vnode, "selectedIndex", null, attrs.selectedIndex, undefined); }
			}
			function updateAttrs(vnode, old, attrs, ns) {
				if (old && old === attrs) {
					console.warn("Don't reuse attrs object, use new object for every redraw, this will throw in next major");
				}
				if (attrs != null) {
					// If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
					//
					// Also, the DOM does things to inputs based on the value, so it needs set first.
					// See: https://github.com/MithrilJS/mithril.js/issues/2622
					if (vnode.tag === "input" && attrs.type != null) { vnode.dom.setAttribute("type", attrs.type); }
					var isFileInput = vnode.tag === "input" && attrs.type === "file";
					for (var key in attrs) {
						setAttr(vnode, key, old && old[key], attrs[key], ns, isFileInput);
					}
				}
				var val;
				if (old != null) {
					for (var key in old) {
						if (((val = old[key]) != null) && (attrs == null || attrs[key] == null)) {
							removeAttr(vnode, key, val, ns);
						}
					}
				}
			}
			function isFormAttribute(vnode, attr) {
				return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode.dom === activeElement() || vnode.tag === "option" && vnode.dom.parentNode === $doc.activeElement
			}
			function isLifecycleMethod(attr) {
				return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
			}
			function hasPropertyKey(vnode, key, ns) {
				// Filter out namespaced keys
				return ns === undefined && (
					// If it's a custom element, just keep it.
					vnode.tag.indexOf("-") > -1 || vnode.attrs != null && vnode.attrs.is ||
					// If it's a normal element, let's try to avoid a few browser bugs.
					key !== "href" && key !== "list" && key !== "form" && key !== "width" && key !== "height"// && key !== "type"
					// Defer the property check until *after* we check everything.
				) && key in vnode.dom
			}

			//style
			var uppercaseRegex = /[A-Z]/g;
			function toLowerCase(capital) { return "-" + capital.toLowerCase() }
			function normalizeKey(key) {
				return key[0] === "-" && key[1] === "-" ? key :
					key === "cssFloat" ? "float" :
						key.replace(uppercaseRegex, toLowerCase)
			}
			function updateStyle(element, old, style) {
				if (old === style) ; else if (style == null) {
					// New style is missing, just clear it.
					element.style.cssText = "";
				} else if (typeof style !== "object") {
					// New style is a string, let engine deal with patching.
					element.style.cssText = style;
				} else if (old == null || typeof old !== "object") {
					// `old` is missing or a string, `style` is an object.
					element.style.cssText = "";
					// Add new style properties
					for (var key in style) {
						var value = style[key];
						if (value != null) { element.style.setProperty(normalizeKey(key), String(value)); }
					}
				} else {
					// Both old & new are (different) objects.
					// Update style properties that have changed
					for (var key in style) {
						var value = style[key];
						if (value != null && (value = String(value)) !== String(old[key])) {
							element.style.setProperty(normalizeKey(key), value);
						}
					}
					// Remove style properties that no longer exist
					for (var key in old) {
						if (old[key] != null && style[key] == null) {
							element.style.removeProperty(normalizeKey(key));
						}
					}
				}
			}

			// Here's an explanation of how this works:
			// 1. The event names are always (by design) prefixed by `on`.
			// 2. The EventListener interface accepts either a function or an object
			//    with a `handleEvent` method.
			// 3. The object does not inherit from `Object.prototype`, to avoid
			//    any potential interference with that (e.g. setters).
			// 4. The event name is remapped to the handler before calling it.
			// 5. In function-based event handlers, `ev.target === this`. We replicate
			//    that below.
			// 6. In function-based event handlers, `return false` prevents the default
			//    action and stops event propagation. We replicate that below.
			function EventDict() {
				// Save this, so the current redraw is correctly tracked.
				this._ = currentRedraw;
			}
			EventDict.prototype = Object.create(null);
			EventDict.prototype.handleEvent = function (ev) {
				var handler = this["on" + ev.type];
				var result;
				if (typeof handler === "function") { result = handler.call(ev.currentTarget, ev); }
				else if (typeof handler.handleEvent === "function") { handler.handleEvent(ev); }
				if (this._ && ev.redraw !== false) { (0, this._)(); }
				if (result === false) {
					ev.preventDefault();
					ev.stopPropagation();
				}
			};

			//event
			function updateEvent(vnode, key, value) {
				if (vnode.events != null) {
					vnode.events._ = currentRedraw;
					if (vnode.events[key] === value) { return }
					if (value != null && (typeof value === "function" || typeof value === "object")) {
						if (vnode.events[key] == null) { vnode.dom.addEventListener(key.slice(2), vnode.events, false); }
						vnode.events[key] = value;
					} else {
						if (vnode.events[key] != null) { vnode.dom.removeEventListener(key.slice(2), vnode.events, false); }
						vnode.events[key] = undefined;
					}
				} else if (value != null && (typeof value === "function" || typeof value === "object")) {
					vnode.events = new EventDict();
					vnode.dom.addEventListener(key.slice(2), vnode.events, false);
					vnode.events[key] = value;
				}
			}

			//lifecycle
			function initLifecycle(source, vnode, hooks) {
				if (typeof source.oninit === "function") { callHook.call(source.oninit, vnode); }
				if (typeof source.oncreate === "function") { hooks.push(callHook.bind(source.oncreate, vnode)); }
			}
			function updateLifecycle(source, vnode, hooks) {
				if (typeof source.onupdate === "function") { hooks.push(callHook.bind(source.onupdate, vnode)); }
			}
			function shouldNotUpdate(vnode, old) {
				do {
					if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") {
						var force = callHook.call(vnode.attrs.onbeforeupdate, vnode, old);
						if (force !== undefined && !force) { break }
					}
					if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeupdate === "function") {
						var force = callHook.call(vnode.state.onbeforeupdate, vnode, old);
						if (force !== undefined && !force) { break }
					}
					return false
				} while (false); // eslint-disable-line no-constant-condition
				vnode.dom = old.dom;
				vnode.domSize = old.domSize;
				vnode.instance = old.instance;
				// One would think having the actual latest attributes would be ideal,
				// but it doesn't let us properly diff based on our current internal
				// representation. We have to save not only the old DOM info, but also
				// the attributes used to create it, as we diff *that*, not against the
				// DOM directly (with a few exceptions in `setAttr`). And, of course, we
				// need to save the children and text as they are conceptually not
				// unlike special "attributes" internally.
				vnode.attrs = old.attrs;
				vnode.children = old.children;
				vnode.text = old.text;
				return true
			}

			var currentDOM;

			return function(dom, vnodes, redraw) {
				if (!dom) { throw new TypeError("DOM element being rendered to does not exist.") }
				if (currentDOM != null && dom.contains(currentDOM)) {
					throw new TypeError("Node is currently being rendered to and thus is locked.")
				}
				var prevRedraw = currentRedraw;
				var prevDOM = currentDOM;
				var hooks = [];
				var active = activeElement();
				var namespace = dom.namespaceURI;

				currentDOM = dom;
				currentRedraw = typeof redraw === "function" ? redraw : undefined;
				try {
					// First time rendering into a node clears it out
					if (dom.vnodes == null) { dom.textContent = ""; }
					vnodes = Vnode.normalizeChildren(Array.isArray(vnodes) ? vnodes : [vnodes]);
					updateNodes(dom, dom.vnodes, vnodes, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace);
					dom.vnodes = vnodes;
					// `document.activeElement` can return null: https://html.spec.whatwg.org/multipage/interaction.html#dom-document-activeelement
					if (active != null && activeElement() !== active && typeof active.focus === "function") { active.focus(); }
					for (var i = 0; i < hooks.length; i++) { hooks[i](); }
				} finally {
					currentRedraw = prevRedraw;
					currentDOM = prevDOM;
				}
			}
		};
		return render$1;
	}

	var render;
	var hasRequiredRender;

	function requireRender () {
		if (hasRequiredRender) { return render; }
		hasRequiredRender = 1;

		render = requireRender$1()(typeof window !== "undefined" ? window : null);
		return render;
	}

	var mountRedraw$1;
	var hasRequiredMountRedraw$1;

	function requireMountRedraw$1 () {
		if (hasRequiredMountRedraw$1) { return mountRedraw$1; }
		hasRequiredMountRedraw$1 = 1;

		var Vnode = requireVnode();

		mountRedraw$1 = function(render, schedule, console) {
			var subscriptions = [];
			var pending = false;
			var offset = -1;

			function sync() {
				for (offset = 0; offset < subscriptions.length; offset += 2) {
					try { render(subscriptions[offset], Vnode(subscriptions[offset + 1]), redraw); }
					catch (e) { console.error(e); }
				}
				offset = -1;
			}

			function redraw() {
				if (!pending) {
					pending = true;
					schedule(function() {
						pending = false;
						sync();
					});
				}
			}

			redraw.sync = sync;

			function mount(root, component) {
				if (component != null && component.view == null && typeof component !== "function") {
					throw new TypeError("m.mount expects a component, not a vnode.")
				}

				var index = subscriptions.indexOf(root);
				if (index >= 0) {
					subscriptions.splice(index, 2);
					if (index <= offset) { offset -= 2; }
					render(root, []);
				}

				if (component != null) {
					subscriptions.push(root, component);
					render(root, Vnode(component), redraw);
				}
			}

			return {mount: mount, redraw: redraw}
		};
		return mountRedraw$1;
	}

	var mountRedraw;
	var hasRequiredMountRedraw;

	function requireMountRedraw () {
		if (hasRequiredMountRedraw) { return mountRedraw; }
		hasRequiredMountRedraw = 1;

		var render = requireRender();

		mountRedraw = requireMountRedraw$1()(render, typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null);
		return mountRedraw;
	}

	var build$1;
	var hasRequiredBuild$1;

	function requireBuild$1 () {
		if (hasRequiredBuild$1) { return build$1; }
		hasRequiredBuild$1 = 1;

		build$1 = function(object) {
			if (Object.prototype.toString.call(object) !== "[object Object]") { return "" }

			var args = [];
			for (var key in object) {
				destructure(key, object[key]);
			}

			return args.join("&")

			function destructure(key, value) {
				if (Array.isArray(value)) {
					for (var i = 0; i < value.length; i++) {
						destructure(key + "[" + i + "]", value[i]);
					}
				}
				else if (Object.prototype.toString.call(value) === "[object Object]") {
					for (var i in value) {
						destructure(key + "[" + i + "]", value[i]);
					}
				}
				else { args.push(encodeURIComponent(key) + (value != null && value !== "" ? "=" + encodeURIComponent(value) : "")); }
			}
		};
		return build$1;
	}

	var assign;
	var hasRequiredAssign;

	function requireAssign () {
		if (hasRequiredAssign) { return assign; }
		hasRequiredAssign = 1;

		var hasOwn = requireHasOwn();

		assign = Object.assign || function(target, source) {
			for (var key in source) {
				if (hasOwn.call(source, key)) { target[key] = source[key]; }
			}
		};
		return assign;
	}

	var build;
	var hasRequiredBuild;

	function requireBuild () {
		if (hasRequiredBuild) { return build; }
		hasRequiredBuild = 1;

		var buildQueryString = requireBuild$1();
		var assign = requireAssign();

		// Returns `path` from `template` + `params`
		build = function(template, params) {
			if ((/:([^\/\.-]+)(\.{3})?:/).test(template)) {
				throw new SyntaxError("Template parameter names must be separated by either a '/', '-', or '.'.")
			}
			if (params == null) { return template }
			var queryIndex = template.indexOf("?");
			var hashIndex = template.indexOf("#");
			var queryEnd = hashIndex < 0 ? template.length : hashIndex;
			var pathEnd = queryIndex < 0 ? queryEnd : queryIndex;
			var path = template.slice(0, pathEnd);
			var query = {};

			assign(query, params);

			var resolved = path.replace(/:([^\/\.-]+)(\.{3})?/g, function(m, key, variadic) {
				delete query[key];
				// If no such parameter exists, don't interpolate it.
				if (params[key] == null) { return m }
				// Escape normal parameters, but not variadic ones.
				return variadic ? params[key] : encodeURIComponent(String(params[key]))
			});

			// In case the template substitution adds new query/hash parameters.
			var newQueryIndex = resolved.indexOf("?");
			var newHashIndex = resolved.indexOf("#");
			var newQueryEnd = newHashIndex < 0 ? resolved.length : newHashIndex;
			var newPathEnd = newQueryIndex < 0 ? newQueryEnd : newQueryIndex;
			var result = resolved.slice(0, newPathEnd);

			if (queryIndex >= 0) { result += template.slice(queryIndex, queryEnd); }
			if (newQueryIndex >= 0) { result += (queryIndex < 0 ? "?" : "&") + resolved.slice(newQueryIndex, newQueryEnd); }
			var querystring = buildQueryString(query);
			if (querystring) { result += (queryIndex < 0 && newQueryIndex < 0 ? "?" : "&") + querystring; }
			if (hashIndex >= 0) { result += template.slice(hashIndex); }
			if (newHashIndex >= 0) { result += (hashIndex < 0 ? "" : "&") + resolved.slice(newHashIndex); }
			return result
		};
		return build;
	}

	var request$1;
	var hasRequiredRequest$1;

	function requireRequest$1 () {
		if (hasRequiredRequest$1) { return request$1; }
		hasRequiredRequest$1 = 1;

		var buildPathname = requireBuild();
		var hasOwn = requireHasOwn();

		request$1 = function($window, Promise, oncompletion) {
			var callbackCount = 0;

			function PromiseProxy(executor) {
				return new Promise(executor)
			}

			// In case the global Promise is some userland library's where they rely on
			// `foo instanceof this.constructor`, `this.constructor.resolve(value)`, or
			// similar. Let's *not* break them.
			PromiseProxy.prototype = Promise.prototype;
			PromiseProxy.__proto__ = Promise; // eslint-disable-line no-proto

			function makeRequest(factory) {
				return function(url, args) {
					if (typeof url !== "string") { args = url; url = url.url; }
					else if (args == null) { args = {}; }
					var promise = new Promise(function(resolve, reject) {
						factory(buildPathname(url, args.params), args, function (data) {
							if (typeof args.type === "function") {
								if (Array.isArray(data)) {
									for (var i = 0; i < data.length; i++) {
										data[i] = new args.type(data[i]);
									}
								}
								else { data = new args.type(data); }
							}
							resolve(data);
						}, reject);
					});
					if (args.background === true) { return promise }
					var count = 0;
					function complete() {
						if (--count === 0 && typeof oncompletion === "function") { oncompletion(); }
					}

					return wrap(promise)

					function wrap(promise) {
						var then = promise.then;
						// Set the constructor, so engines know to not await or resolve
						// this as a native promise. At the time of writing, this is
						// only necessary for V8, but their behavior is the correct
						// behavior per spec. See this spec issue for more details:
						// https://github.com/tc39/ecma262/issues/1577. Also, see the
						// corresponding comment in `request/tests/test-request.js` for
						// a bit more background on the issue at hand.
						promise.constructor = PromiseProxy;
						promise.then = function() {
							count++;
							var next = then.apply(promise, arguments);
							next.then(complete, function(e) {
								complete();
								if (count === 0) { throw e }
							});
							return wrap(next)
						};
						return promise
					}
				}
			}

			function hasHeader(args, name) {
				for (var key in args.headers) {
					if (hasOwn.call(args.headers, key) && key.toLowerCase() === name) { return true }
				}
				return false
			}

			return {
				request: makeRequest(function(url, args, resolve, reject) {
					var method = args.method != null ? args.method.toUpperCase() : "GET";
					var body = args.body;
					var assumeJSON = (args.serialize == null || args.serialize === JSON.serialize) && !(body instanceof $window.FormData || body instanceof $window.URLSearchParams);
					var responseType = args.responseType || (typeof args.extract === "function" ? "" : "json");

					var xhr = new $window.XMLHttpRequest(), aborted = false, isTimeout = false;
					var original = xhr, replacedAbort;
					var abort = xhr.abort;

					xhr.abort = function() {
						aborted = true;
						abort.call(this);
					};

					xhr.open(method, url, args.async !== false, typeof args.user === "string" ? args.user : undefined, typeof args.password === "string" ? args.password : undefined);

					if (assumeJSON && body != null && !hasHeader(args, "content-type")) {
						xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
					}
					if (typeof args.deserialize !== "function" && !hasHeader(args, "accept")) {
						xhr.setRequestHeader("Accept", "application/json, text/*");
					}
					if (args.withCredentials) { xhr.withCredentials = args.withCredentials; }
					if (args.timeout) { xhr.timeout = args.timeout; }
					xhr.responseType = responseType;

					for (var key in args.headers) {
						if (hasOwn.call(args.headers, key)) {
							xhr.setRequestHeader(key, args.headers[key]);
						}
					}

					xhr.onreadystatechange = function(ev) {
						// Don't throw errors on xhr.abort().
						if (aborted) { return }

						if (ev.target.readyState === 4) {
							try {
								var success = (ev.target.status >= 200 && ev.target.status < 300) || ev.target.status === 304 || (/^file:\/\//i).test(url);
								// When the response type isn't "" or "text",
								// `xhr.responseText` is the wrong thing to use.
								// Browsers do the right thing and throw here, and we
								// should honor that and do the right thing by
								// preferring `xhr.response` where possible/practical.
								var response = ev.target.response, message;

								if (responseType === "json") {
									// For IE and Edge, which don't implement
									// `responseType: "json"`.
									if (!ev.target.responseType && typeof args.extract !== "function") {
										// Handle no-content which will not parse.
										try { response = JSON.parse(ev.target.responseText); }
										catch (e) { response = null; }
									}
								} else if (!responseType || responseType === "text") {
									// Only use this default if it's text. If a parsed
									// document is needed on old IE and friends (all
									// unsupported), the user should use a custom
									// `config` instead. They're already using this at
									// their own risk.
									if (response == null) { response = ev.target.responseText; }
								}

								if (typeof args.extract === "function") {
									response = args.extract(ev.target, args);
									success = true;
								} else if (typeof args.deserialize === "function") {
									response = args.deserialize(response);
								}
								if (success) { resolve(response); }
								else {
									var completeErrorResponse = function() {
										try { message = ev.target.responseText; }
										catch (e) { message = response; }
										var error = new Error(message);
										error.code = ev.target.status;
										error.response = response;
										reject(error);
									};

									if (xhr.status === 0) {
										// Use setTimeout to push this code block onto the event queue
										// This allows `xhr.ontimeout` to run in the case that there is a timeout
										// Without this setTimeout, `xhr.ontimeout` doesn't have a chance to reject
										// as `xhr.onreadystatechange` will run before it
										setTimeout(function() {
											if (isTimeout) { return }
											completeErrorResponse();
										});
									} else { completeErrorResponse(); }
								}
							}
							catch (e$1) {
								reject(e$1);
							}
						}
					};

					xhr.ontimeout = function (ev) {
						isTimeout = true;
						var error = new Error("Request timed out");
						error.code = ev.target.status;
						reject(error);
					};

					if (typeof args.config === "function") {
						xhr = args.config(xhr, args, url) || xhr;

						// Propagate the `abort` to any replacement XHR as well.
						if (xhr !== original) {
							replacedAbort = xhr.abort;
							xhr.abort = function() {
								aborted = true;
								replacedAbort.call(this);
							};
						}
					}

					if (body == null) { xhr.send(); }
					else if (typeof args.serialize === "function") { xhr.send(args.serialize(body)); }
					else if (body instanceof $window.FormData || body instanceof $window.URLSearchParams) { xhr.send(body); }
					else { xhr.send(JSON.stringify(body)); }
				}),
				jsonp: makeRequest(function(url, args, resolve, reject) {
					var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++;
					var script = $window.document.createElement("script");
					$window[callbackName] = function(data) {
						delete $window[callbackName];
						script.parentNode.removeChild(script);
						resolve(data);
					};
					script.onerror = function() {
						delete $window[callbackName];
						script.parentNode.removeChild(script);
						reject(new Error("JSONP request failed"));
					};
					script.src = url + (url.indexOf("?") < 0 ? "?" : "&") +
						encodeURIComponent(args.callbackKey || "callback") + "=" +
						encodeURIComponent(callbackName);
					$window.document.documentElement.appendChild(script);
				}),
			}
		};
		return request$1;
	}

	var request;
	var hasRequiredRequest;

	function requireRequest () {
		if (hasRequiredRequest) { return request; }
		hasRequiredRequest = 1;

		var PromisePolyfill = requirePromise();
		var mountRedraw = requireMountRedraw();

		request = requireRequest$1()(typeof window !== "undefined" ? window : null, PromisePolyfill, mountRedraw.redraw);
		return request;
	}

	var parse$1;
	var hasRequiredParse$1;

	function requireParse$1 () {
		if (hasRequiredParse$1) { return parse$1; }
		hasRequiredParse$1 = 1;

		function decodeURIComponentSave(str) {
			try {
				return decodeURIComponent(str)
			} catch(err) {
				return str
			}
		}

		parse$1 = function(string) {
			if (string === "" || string == null) { return {} }
			if (string.charAt(0) === "?") { string = string.slice(1); }

			var entries = string.split("&"), counters = {}, data = {};
			for (var i = 0; i < entries.length; i++) {
				var entry = entries[i].split("=");
				var key = decodeURIComponentSave(entry[0]);
				var value = entry.length === 2 ? decodeURIComponentSave(entry[1]) : "";

				if (value === "true") { value = true; }
				else if (value === "false") { value = false; }

				var levels = key.split(/\]\[?|\[/);
				var cursor = data;
				if (key.indexOf("[") > -1) { levels.pop(); }
				for (var j = 0; j < levels.length; j++) {
					var level = levels[j], nextLevel = levels[j + 1];
					var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10));
					if (level === "") {
						var key = levels.slice(0, j).join();
						if (counters[key] == null) {
							counters[key] = Array.isArray(cursor) ? cursor.length : 0;
						}
						level = counters[key]++;
					}
					// Disallow direct prototype pollution
					else if (level === "__proto__") { break }
					if (j === levels.length - 1) { cursor[level] = value; }
					else {
						// Read own properties exclusively to disallow indirect
						// prototype pollution
						var desc = Object.getOwnPropertyDescriptor(cursor, level);
						if (desc != null) { desc = desc.value; }
						if (desc == null) { cursor[level] = desc = isNumber ? [] : {}; }
						cursor = desc;
					}
				}
			}
			return data
		};
		return parse$1;
	}

	var parse;
	var hasRequiredParse;

	function requireParse () {
		if (hasRequiredParse) { return parse; }
		hasRequiredParse = 1;

		var parseQueryString = requireParse$1();

		// Returns `{path, params}` from `url`
		parse = function(url) {
			var queryIndex = url.indexOf("?");
			var hashIndex = url.indexOf("#");
			var queryEnd = hashIndex < 0 ? url.length : hashIndex;
			var pathEnd = queryIndex < 0 ? queryEnd : queryIndex;
			var path = url.slice(0, pathEnd).replace(/\/{2,}/g, "/");

			if (!path) { path = "/"; }
			else {
				if (path[0] !== "/") { path = "/" + path; }
				if (path.length > 1 && path[path.length - 1] === "/") { path = path.slice(0, -1); }
			}
			return {
				path: path,
				params: queryIndex < 0
					? {}
					: parseQueryString(url.slice(queryIndex + 1, queryEnd)),
			}
		};
		return parse;
	}

	var compileTemplate;
	var hasRequiredCompileTemplate;

	function requireCompileTemplate () {
		if (hasRequiredCompileTemplate) { return compileTemplate; }
		hasRequiredCompileTemplate = 1;

		var parsePathname = requireParse();

		// Compiles a template into a function that takes a resolved path (without query
		// strings) and returns an object containing the template parameters with their
		// parsed values. This expects the input of the compiled template to be the
		// output of `parsePathname`. Note that it does *not* remove query parameters
		// specified in the template.
		compileTemplate = function(template) {
			var templateData = parsePathname(template);
			var templateKeys = Object.keys(templateData.params);
			var keys = [];
			var regexp = new RegExp("^" + templateData.path.replace(
				// I escape literal text so people can use things like `:file.:ext` or
				// `:lang-:locale` in routes. This is all merged into one pass so I
				// don't also accidentally escape `-` and make it harder to detect it to
				// ban it from template parameters.
				/:([^\/.-]+)(\.{3}|\.(?!\.)|-)?|[\\^$*+.()|\[\]{}]/g,
				function(m, key, extra) {
					if (key == null) { return "\\" + m }
					keys.push({k: key, r: extra === "..."});
					if (extra === "...") { return "(.*)" }
					if (extra === ".") { return "([^/]+)\\." }
					return "([^/]+)" + (extra || "")
				}
			) + "$");
			return function(data) {
				// First, check the params. Usually, there isn't any, and it's just
				// checking a static set.
				for (var i = 0; i < templateKeys.length; i++) {
					if (templateData.params[templateKeys[i]] !== data.params[templateKeys[i]]) { return false }
				}
				// If no interpolations exist, let's skip all the ceremony
				if (!keys.length) { return regexp.test(data.path) }
				var values = regexp.exec(data.path);
				if (values == null) { return false }
				for (var i = 0; i < keys.length; i++) {
					data.params[keys[i].k] = keys[i].r ? values[i + 1] : decodeURIComponent(values[i + 1]);
				}
				return true
			}
		};
		return compileTemplate;
	}

	var censor;
	var hasRequiredCensor;

	function requireCensor () {
		if (hasRequiredCensor) { return censor; }
		hasRequiredCensor = 1;

		// Note: this is mildly perf-sensitive.
		//
		// It does *not* use `delete` - dynamic `delete`s usually cause objects to bail
		// out into dictionary mode and just generally cause a bunch of optimization
		// issues within engines.
		//
		// Ideally, I would've preferred to do this, if it weren't for the optimization
		// issues:
		//
		// ```js
		// const hasOwn = require("./hasOwn")
		// const magic = [
		//     "key", "oninit", "oncreate", "onbeforeupdate", "onupdate",
		//     "onbeforeremove", "onremove",
		// ]
		// module.exports = (attrs, extras) => {
		//     const result = Object.assign(Object.create(null), attrs)
		//     for (const key of magic) delete result[key]
		//     if (extras != null) for (const key of extras) delete result[key]
		//     return result
		// }
		// ```

		var hasOwn = requireHasOwn();
		// Words in RegExp literals are sometimes mangled incorrectly by the internal bundler, so use RegExp().
		var magic = new RegExp("^(?:key|oninit|oncreate|onbeforeupdate|onupdate|onbeforeremove|onremove)$");

		censor = function(attrs, extras) {
			var result = {};

			if (extras != null) {
				for (var key in attrs) {
					if (hasOwn.call(attrs, key) && !magic.test(key) && extras.indexOf(key) < 0) {
						result[key] = attrs[key];
					}
				}
			} else {
				for (var key in attrs) {
					if (hasOwn.call(attrs, key) && !magic.test(key)) {
						result[key] = attrs[key];
					}
				}
			}

			return result
		};
		return censor;
	}

	var router;
	var hasRequiredRouter;

	function requireRouter () {
		if (hasRequiredRouter) { return router; }
		hasRequiredRouter = 1;

		var Vnode = requireVnode();
		var m = requireHyperscript$1();
		var Promise = requirePromise();

		var buildPathname = requireBuild();
		var parsePathname = requireParse();
		var compileTemplate = requireCompileTemplate();
		var assign = requireAssign();
		var censor = requireCensor();

		var sentinel = {};

		function decodeURIComponentSave(component) {
			try {
				return decodeURIComponent(component)
			} catch(e) {
				return component
			}
		}

		router = function($window, mountRedraw) {
			var callAsync = $window == null
				// In case Mithril.js' loaded globally without the DOM, let's not break
				? null
				: typeof $window.setImmediate === "function" ? $window.setImmediate : $window.setTimeout;
			var p = Promise.resolve();

			var scheduled = false;

			// state === 0: init
			// state === 1: scheduled
			// state === 2: done
			var ready = false;
			var state = 0;

			var compiled, fallbackRoute;

			var currentResolver = sentinel, component, attrs, currentPath, lastUpdate;

			var RouterRoot = {
				onbeforeupdate: function() {
					state = state ? 2 : 1;
					return !(!state || sentinel === currentResolver)
				},
				onremove: function() {
					$window.removeEventListener("popstate", fireAsync, false);
					$window.removeEventListener("hashchange", resolveRoute, false);
				},
				view: function() {
					if (!state || sentinel === currentResolver) { return }
					// Wrap in a fragment to preserve existing key semantics
					var vnode = [Vnode(component, attrs.key, attrs)];
					if (currentResolver) { vnode = currentResolver.render(vnode[0]); }
					return vnode
				},
			};

			var SKIP = route.SKIP = {};

			function resolveRoute() {
				scheduled = false;
				// Consider the pathname holistically. The prefix might even be invalid,
				// but that's not our problem.
				var prefix = $window.location.hash;
				if (route.prefix[0] !== "#") {
					prefix = $window.location.search + prefix;
					if (route.prefix[0] !== "?") {
						prefix = $window.location.pathname + prefix;
						if (prefix[0] !== "/") { prefix = "/" + prefix; }
					}
				}
				// This seemingly useless `.concat()` speeds up the tests quite a bit,
				// since the representation is consistently a relatively poorly
				// optimized cons string.
				var path = prefix.concat()
					.replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponentSave)
					.slice(route.prefix.length);
				var data = parsePathname(path);

				assign(data.params, $window.history.state);

				function reject(e) {
					console.error(e);
					setPath(fallbackRoute, null, {replace: true});
				}

				loop(0);
				function loop(i) {
					// state === 0: init
					// state === 1: scheduled
					// state === 2: done
					for (; i < compiled.length; i++) {
						if (compiled[i].check(data)) {
							var payload = compiled[i].component;
							var matchedRoute = compiled[i].route;
							var localComp = payload;
							var update = lastUpdate = function(comp) {
								if (update !== lastUpdate) { return }
								if (comp === SKIP) { return loop(i + 1) }
								component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div";
								attrs = data.params, currentPath = path, lastUpdate = null;
								currentResolver = payload.render ? payload : null;
								if (state === 2) { mountRedraw.redraw(); }
								else {
									state = 2;
									mountRedraw.redraw.sync();
								}
							};
							// There's no understating how much I *wish* I could
							// use `async`/`await` here...
							if (payload.view || typeof payload === "function") {
								payload = {};
								update(localComp);
							}
							else if (payload.onmatch) {
								p.then(function () {
									return payload.onmatch(data.params, path, matchedRoute)
								}).then(update, path === fallbackRoute ? null : reject);
							}
							else { update("div"); }
							return
						}
					}

					if (path === fallbackRoute) {
						throw new Error("Could not resolve default route " + fallbackRoute + ".")
					}
					setPath(fallbackRoute, null, {replace: true});
				}
			}

			// Set it unconditionally so `m.route.set` and `m.route.Link` both work,
			// even if neither `pushState` nor `hashchange` are supported. It's
			// cleared if `hashchange` is used, since that makes it automatically
			// async.
			function fireAsync() {
				if (!scheduled) {
					scheduled = true;
					// TODO: just do `mountRedraw.redraw()` here and elide the timer
					// dependency. Note that this will muck with tests a *lot*, so it's
					// not as easy of a change as it sounds.
					callAsync(resolveRoute);
				}
			}

			function setPath(path, data, options) {
				path = buildPathname(path, data);
				if (ready) {
					fireAsync();
					var state = options ? options.state : null;
					var title = options ? options.title : null;
					if (options && options.replace) { $window.history.replaceState(state, title, route.prefix + path); }
					else { $window.history.pushState(state, title, route.prefix + path); }
				}
				else {
					$window.location.href = route.prefix + path;
				}
			}

			function route(root, defaultRoute, routes) {
				if (!root) { throw new TypeError("DOM element being rendered to does not exist.") }

				compiled = Object.keys(routes).map(function(route) {
					if (route[0] !== "/") { throw new SyntaxError("Routes must start with a '/'.") }
					if ((/:([^\/\.-]+)(\.{3})?:/).test(route)) {
						throw new SyntaxError("Route parameter names must be separated with either '/', '.', or '-'.")
					}
					return {
						route: route,
						component: routes[route],
						check: compileTemplate(route),
					}
				});
				fallbackRoute = defaultRoute;
				if (defaultRoute != null) {
					var defaultData = parsePathname(defaultRoute);

					if (!compiled.some(function (i) { return i.check(defaultData) })) {
						throw new ReferenceError("Default route doesn't match any known routes.")
					}
				}

				if (typeof $window.history.pushState === "function") {
					$window.addEventListener("popstate", fireAsync, false);
				} else if (route.prefix[0] === "#") {
					$window.addEventListener("hashchange", resolveRoute, false);
				}

				ready = true;
				mountRedraw.mount(root, RouterRoot);
				resolveRoute();
			}
			route.set = function(path, data, options) {
				if (lastUpdate != null) {
					options = options || {};
					options.replace = true;
				}
				lastUpdate = null;
				setPath(path, data, options);
			};
			route.get = function() {return currentPath};
			route.prefix = "#!";
			route.Link = {
				view: function(vnode) {
					// Omit the used parameters from the rendered element - they are
					// internal. Also, censor the various lifecycle methods.
					//
					// We don't strip the other parameters because for convenience we
					// let them be specified in the selector as well.
					var child = m(
						vnode.attrs.selector || "a",
						censor(vnode.attrs, ["options", "params", "selector", "onclick"]),
						vnode.children
					);
					var options, onclick, href;

					// Let's provide a *right* way to disable a route link, rather than
					// letting people screw up accessibility on accident.
					//
					// The attribute is coerced so users don't get surprised over
					// `disabled: 0` resulting in a button that's somehow routable
					// despite being visibly disabled.
					if (child.attrs.disabled = Boolean(child.attrs.disabled)) {
						child.attrs.href = null;
						child.attrs["aria-disabled"] = "true";
						// If you *really* do want add `onclick` on a disabled link, use
						// an `oncreate` hook to add it.
					} else {
						options = vnode.attrs.options;
						onclick = vnode.attrs.onclick;
						// Easier to build it now to keep it isomorphic.
						href = buildPathname(child.attrs.href, vnode.attrs.params);
						child.attrs.href = route.prefix + href;
						child.attrs.onclick = function(e) {
							var result;
							if (typeof onclick === "function") {
								result = onclick.call(e.currentTarget, e);
							} else if (onclick == null || typeof onclick !== "object") ; else if (typeof onclick.handleEvent === "function") {
								onclick.handleEvent(e);
							}

							// Adapted from React Router's implementation:
							// https://github.com/ReactTraining/react-router/blob/520a0acd48ae1b066eb0b07d6d4d1790a1d02482/packages/react-router-dom/modules/Link.js
							//
							// Try to be flexible and intuitive in how we handle links.
							// Fun fact: links aren't as obvious to get right as you
							// would expect. There's a lot more valid ways to click a
							// link than this, and one might want to not simply click a
							// link, but right click or command-click it to copy the
							// link target, etc. Nope, this isn't just for blind people.
							if (
								// Skip if `onclick` prevented default
								result !== false && !e.defaultPrevented &&
								// Ignore everything but left clicks
								(e.button === 0 || e.which === 0 || e.which === 1) &&
								// Let the browser handle `target=_blank`, etc.
								(!e.currentTarget.target || e.currentTarget.target === "_self") &&
								// No modifier keys
								!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
							) {
								e.preventDefault();
								e.redraw = false;
								route.set(href, null, options);
							}
						};
					}
					return child
				},
			};
			route.param = function(key) {
				return attrs && key != null ? attrs[key] : attrs
			};

			return route
		};
		return router;
	}

	var route;
	var hasRequiredRoute;

	function requireRoute () {
		if (hasRequiredRoute) { return route; }
		hasRequiredRoute = 1;

		var mountRedraw = requireMountRedraw();

		route = requireRouter()(typeof window !== "undefined" ? window : null, mountRedraw);
		return route;
	}

	var mithril;
	var hasRequiredMithril;

	function requireMithril () {
		if (hasRequiredMithril) { return mithril; }
		hasRequiredMithril = 1;

		var hyperscript = requireHyperscript();
		var request = requireRequest();
		var mountRedraw = requireMountRedraw();

		var m = function m() { return hyperscript.apply(this, arguments) };
		m.m = hyperscript;
		m.trust = hyperscript.trust;
		m.fragment = hyperscript.fragment;
		m.Fragment = "[";
		m.mount = mountRedraw.mount;
		m.route = requireRoute();
		m.render = requireRender();
		m.redraw = mountRedraw.redraw;
		m.request = request.request;
		m.jsonp = request.jsonp;
		m.parseQueryString = requireParse$1();
		m.buildQueryString = requireBuild$1();
		m.parsePathname = requireParse();
		m.buildPathname = requireBuild();
		m.vnode = requireVnode();
		m.PromisePolyfill = requirePolyfill();
		m.censor = requireCensor();

		mithril = m;
		return mithril;
	}

	var mithrilExports = requireMithril();
	var m = /*@__PURE__*/getDefaultExportFromCjs(mithrilExports);

	function state () { return ({
	  companies: [],
	  comp: {},

	  projects: [],
	  proj: {},

	  times: [],
	  time: {},
	  checks: {},

	  invoices: [],
	  invo: {},

	  classes: {
	    button: 'px-3.5 pt-0.5 pb-1 bg-sky-600 text-white rounded-md',
	    plus: 'flex justify-center items-end w-[30px] h-[30px] p-0 mt-1 ml-2.5 bg-sky-600 text-white rounded-md text-3xl'
	  },

	  loaded: false
	}); }

	var api = {
	  req : function (method, url, opts) { return m.request(Object.assign({}, {method: method, url: url}, opts)); },
	  get : function (url, opts) { return api.req('get',  url, opts); },
	  post: function (url, opts) { return api.req('post', url, opts); },
	  put : function (url, opts) { return api.req('put',  url, opts); },
	  del : function (url, opts) { return api.req('del',  url, opts); }
	};

	function actions (S, A) {
	  if ( A === void 0 ) A = {
	  init: function () {
	    S.loaded = false;
	    return Promise.all([
	      A.get('times'),
	      A.get('companies'),
	      A.get('projects'),
	      A.get('invoices')
	    ])
	    .then(function () { return S.loaded = true; })
	    .catch(console.log)
	  },

	  initChecks: function () { return S.checks = S.times.reduce(function (a,ref) {
	    var id = ref.id;

	    return (a[id] = false, a);
	    }, {}); },

	  get: function (table) { return api.get(`/api/${table}`)
	    .then(function (res) { return S[table] = res; })
	    .catch(console.log); },

	  post: function (table, body) { return api.post(`/api/${table}`, {body: body})
	    .then(function (res) {
	      if (table !== 'pdf') {
	        S[table].unshift(Object.assign({}, {id: res.id}, body));
	      }
	      else { return res }
	    })
	    .catch(console.log); },

	  put: function (table, id, body) { return api.put(`/api/${table}/${id}`, {body: body})
	    .then(function () {
	      var idx = S[table].findIndex(function (x) { return x.id === id; });
	      S[table][idx] = body;
	    })
	    .catch(console.log); },

	  del: function (table, id) { return api.del(`/api/${table}/${id}`, {method: 'DELETE'})
	    .then(function () {
	      S[table] = S[table].filter(function (x) { return x.id !== id; });
	    })
	    .catch(console.log); }
	};

	  return A;
	}

	var layout = {
	  view: function (ref) {
	      var children = ref.children;
	      var A = ref.attrs.A;

	      return m('.layout', {class: 'relative w-screen h-screen'},
	      m('div', {class: 'container mx-auto bg-sky-300'},
	        m('div', {class: 'text-center py-4'},
	          m('h1', {class: 'text-3xl font-bold tracking-widest'}, 'Timez')
	        ),
	        m('div', {class: 'bg-sky-950'},
	          m('ul', {class: 'flex justify-start items-center gap-14 ml-14 pt-3 pb-3.5 list-none'},
	            m('li', {class: 'inline-block text-white cursor-pointer select-none'},
	              m('a', {
	                onclick: function () {
	                  A.initChecks();
	                  m.route.set('/times');
	                }
	              }, 'Times')
	            ),
	            m('li', {class: 'inline-block text-white cursor-pointer select-none'},
	              m('a', {onclick: function () { return m.route.set('/invoices'); }}, 'Invoices')
	            ),
	            m('li', {class: 'inline-block text-white cursor-pointer select-none'},
	              m('a', {onclick: function () { return m.route.set('/config'); }}, 'Config')
	            )
	          )
	        ),
	        m('div', {class: 'bg-stone-100'},
	          children
	        )
	      )
	    );
	}
	};

	var svgs = {
	  edit: m('svg', {width: "26", height: "36", viewBox: "0 0 18 18", fill: "#0284c7", xmlns: "http://www.w3.org/2000/svg"},
	    m('path', {d: "M14.4714 4.86192C14.7317 5.12227 14.7317 5.54438 14.4714 5.80473L5.80472 14.4714C5.67969 14.5964 5.51013 14.6667 5.33331 14.6667L2.66665 14.6667C2.48983 14.6667 2.32026 14.5964 2.19524 14.4714C2.07022 14.3464 1.99998 14.1768 1.99998 14L1.99998 11.3333C1.99998 11.1565 2.07022 10.9869 2.19524 10.8619L10.8619 2.19525C11.1223 1.9349 11.5444 1.9349 11.8047 2.19525C12.0651 2.4556 12.0651 2.87771 11.8047 3.13806L3.33331 11.6095L3.33331 13.3333L5.05717 13.3333L13.5286 4.86192C13.7889 4.60157 14.211 4.60157 14.4714 4.86192Z"}),
	    m('path', {d: "M10.8619 2.19525C11.1223 1.9349 11.5444 1.9349 11.8047 2.19525L14.4714 4.86192C14.7317 5.12227 14.7317 5.54438 14.4714 5.80473C14.211 6.06508 13.7889 6.06508 13.5286 5.80473L10.8619 3.13806C10.6016 2.87771 10.6016 2.4556 10.8619 2.19525Z"}),
	    m('path', {d: "M11.5286 7.80473L8.86194 5.13806L9.80475 4.19525L12.4714 6.86192L11.5286 7.80473Z"})
	  ),

	  copy: m('svg', {width: "36", height: "36", viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg"},
	    m('path', {
	      d: "M66.4,71.1h-30c-1.7,0-3-1.3-3-3v-34c0-1.7,1.3-3,3-3h30c1.7,0,3,1.3,3,3v34C69.4,69.7,68,71.1,66.4,71.1z M37.4,67.1h28  v-32h-28V67.1z",
	      fill: "#000"
	    }),
	    m('path', {
	      d: "M73.4,64.1c-1.1,0-2-0.9-2-2v-33h-29c-1.1,0-2-0.9-2-2s0.9-2,2-2h29.6c1.6,0,3.4,1.2,3.4,3v34  C75.4,63.2,74.5,64.1,73.4,64.1z M71.9,29.1L71.9,29.1L71.9,29.1z",
	      fill: "#000"
	    })
	  ),

	  pdf: m('svg', {width: "22", height: "22", viewBox: "0 0 1000 1000", fill: "none", xmlns: "http://www.w3.org/2000/svg"},
	    m('path', {
	      d: "M988.6,636c-1.1-8.1-7.5-18-14.4-24.8l-0.1,0c-19.6-19.3-63-29.6-129.1-30.4c-44.7-0.5-98.6,3.5-155.3,11.4c-25.4-14.7-51.5-30.5-72-49.7c-55.2-51.5-101.3-123.1-130-201.8c1.9-7.3,3.4-13.8,5-20.4c0,0,31.1-176.6,22.9-236.4c-1.1-8.2-1.8-10.6-4-17l-2.7-6.9c-8.5-19.5-25-40.2-51.1-39L442,20.5c-29,0-52.7,14.8-58.9,37C364.3,127,383.8,231,419,365.7l-9,21.9c-25.3,61.6-56.9,123.5-84.8,178.3l-3.6,7.1c-29.4,57.5-56,106.2-80.1,147.6l-24.9,13.2c-1.8,1-44.5,23.6-54.6,29.6c-85,50.8-141.4,108.5-150.7,154.2c-3,14.6-0.8,33.3,14.4,41.9l24.1,12.2c10.5,5.2,21.5,7.9,32.8,7.9c60.6,0,130.9-75.5,227.8-244.6c111.8-36.4,239.2-66.7,350.8-83.4c85,47.9,189.7,81.2,255.7,81.2c11.7,0,21.8-1.1,30-3.3c12.7-3.4,23.3-10.6,29.9-20.4C989.5,689.8,992.1,663.2,988.6,636z M69.2,933.6c11.1-30.2,54.8-90,119.5-142.9c4-3.3,14-12.7,23.3-21.4C144.3,877.2,99,920.1,69.2,933.6z M452.2,51.7c19.5,0,30.6,49.1,31.5,95.1c0.9,46-9.8,78.3-23.2,102.2c-11.1-35.4-16.4-91.2-16.4-127.6C444.1,121.4,443.2,51.7,452.2,51.7z M338,680.2L338,680.2c13.5-24.3,27.7-49.9,42.1-77c35.1-66.5,57.4-118.5,73.9-161.3c32.9,59.9,73.8,110.7,122,151.5c6,5.1,12.3,10.2,19,15.3C497.1,628,412.5,651.6,338,680.2z M955.2,674.7L955.2,674.7c-5.9,3.7-23,5.8-34,5.8c-35.4,0-79.3-16.2-140.8-42.6c23.7-1.7,45.3-2.7,64.7-2.7c35.6,0,46.1-0.1,80.9,8.8C960.8,652.9,961.2,670.9,955.2,674.7z",
	      fill: "#ff0000"
	    })
	  ),

	  eye: m('svg', {width: "28", height: "28", viewBox: "0 0 512 512", fill: "none", xmlns: "http://www.w3.org/2000/svg"},
	    m('path', {
	      d: "m494.8,241.4l-50.6-49.4c-50.1-48.9-116.9-75.8-188.2-75.8s-138.1,26.9-188.2,75.8l-50.6,49.4c-11.3,12.3-4.3,25.4 0,29.2l50.6,49.4c50.1,48.9 116.9,75.8 188.2,75.8s138.1-26.9 188.2-75.8l50.6-49.4c4-3.8 11.7-16.4 0-29.2zm-238.8,84.4c-38.5,0-69.8-31.3-69.8-69.8 0-38.5 31.3-69.8 69.8-69.8 38.5,0 69.8,31.3 69.8,69.8 0,38.5-31.3,69.8-69.8,69.8zm-195.3-69.8l35.7-34.8c27-26.4 59.8-45.2 95.7-55.4-28.2,20.1-46.6,53-46.6,90.1 0,37.1 18.4,70.1 46.6,90.1-35.9-10.2-68.7-29-95.7-55.3l-35.7-34.7zm355,34.8c-27,26.3-59.8,45.1-95.7,55.3 28.2-20.1 46.6-53 46.6-90.1 0-37.2-18.4-70.1-46.6-90.1 35.9,10.2 68.7,29 95.7,55.4l35.6,34.8-35.6,34.7z",
	      fill: "#000"
	    })
	  ),

	  crossred: m('svg', {width: "32", height: "32", viewBox: "0 0 19 19", fill: "none", xmlns: "http://www.w3.org/2000/svg"},
	    m('path', {
	      d: "M9.49996 8.38058L13.4187 4.46183L14.5381 5.58125L10.6194 9.5L14.5381 13.4188L13.4187 14.5382L9.49996 10.6194L5.58121 14.5382L4.46179 13.4188L8.38054 9.5L4.46179 5.58125L5.58121 4.46183L9.49996 8.38058Z",
	      fill: "#EB5757"
	    })
	  ),

	  crossredsm: m('svg', {width: "32", height: "32", viewBox: "0 0 23 23", fill: "none", xmlns: "http://www.w3.org/2000/svg"},
	    m('path', {
	      d: "M9.49996 8.38058L13.4187 4.46183L14.5381 5.58125L10.6194 9.5L14.5381 13.4188L13.4187 14.5382L9.49996 10.6194L5.58121 14.5382L4.46179 13.4188L8.38054 9.5L4.46179 5.58125L5.58121 4.46183L9.49996 8.38058Z",
	      fill: "#EB5757"
	    })
	  ),

	  check: m('svg', {width: "32", height: "32", viewBox: "0 0 23 23", fill: "none", xmlns: "http://www.w3.org/2000/svg"},
	    m('path', {
	      d: "M7.54058 13.9785L3.62183 10.0597L4.74124 8.94029L7.54176 11.7376L7.54058 11.7388L14.2579 5.02154L15.3773 6.14096L8.65999 12.859L7.54137 13.9777L7.54058 13.9785Z",
	      fill: "#219653"
	    })
	  )
	};

	function objectWithoutProperties$3 (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

	function times (ref) {
	  var ref_attrs = ref.attrs;
	  var S = ref_attrs.S;
	  var A = ref_attrs.A;

	  if (!S.loaded) {
	    A.init()
	    .then(A.initChecks);
	  }

	  var curs = {USD: '$', EUR: '€'};
	  var proj = function (id, prop) {
	    var p = S.projects.find(function (proj) { return proj.id === id; });
	    return p ? p[prop] : ''
	  };

	  var getdate = function () {
	    var now = new Date(Date.now());
	    return now.toJSON().split('T')[0]
	  };

	  var createInvoice = function () {
	    var ids = Object.entries(S.checks)
	      .sort(function (a,b) { return +a[0] > +b[0] ? 1 : -1; })
	      .reduce(function (a,ref) {
	      var k = ref[0];
	      var v = ref[1];
	if (v) { a.push(+k); } return a}, []);
	    var projid = S.times.find(function (ref) {
	      var id = ref.id;

	      return id === ids[0];
	    }).id;
	    var total = S.times
	      .filter(function (ref) {
	        var id = ref.id;

	        return ids.includes(id);
	    })
	      .reduce(function (a,c) { return (a += c.total, a); }, 0);

	    A.post('invoices', {date: getdate(), projid: projid, total: total, times: ids.join(',')})
	    .then(function () {})
	    .catch(console.log);
	  };

	  return {
	    onbeforeupdate: function () {
	      if (!S.loaded) {
	        A.init()
	        .then(A.initChecks);
	      }
	    },

	    view: function () { return m('div', {class: 'p-4'},
	        m('div', {class: 'flex'},
	          m('h2', {class: 'text-2xl font-bold mb-3'}, 'Times'),
	          m('button', {
	            class: S.classes.plus,
	            onclick: function () {
	              S.time = {};
	              m.route.set('/time');
	            }
	          }, '+')
	        ),
	        m('div', {class: 'mb-3'},
	          m('button', {
	            class: 'mr-3 ' + S.classes.button,
	            onclick: function () { return m.route.set('/json'); }
	          }, 'Copy Json'),
	          m('button', {
	            class: S.classes.button,
	            onclick: createInvoice
	          }, 'Create Invoice')
	        ),
	        m('div',
	          S.times.length > 0
	          ? m('table',
	              m('thead',
	                m('tr',
	                  ['', 'date', 'project', 'hours', 'price', 'total', 'description', '']
	                  .map(function (x) { return m('th', {class: 'text-left px-3'}, x); }
	                  )
	                )
	              ),
	              m('tbody',
	                S.times.map(function (time) { return m('tr', {class: 'hover:bg-slate-50'},
	                    m('td',
	                      m('input', {
	                        type: 'checkbox',
	                        checked: S.checks[time.id],
	                        onchange: function () { return S.checks[time.id] = !S.checks[time.id]; }
	                      })
	                    ),
	                    ['date', 'projname', 'hours', 'price', 'total', 'description'].map(function (x) { return x === 'projname'
	                      ? m('td', {class: 'px-3'}, proj(time.projid, 'name'))
	                      : x === 'total'
	                        ? m('td', {class: 'px-3'},
	                            curs[(proj(time.projid, 'currency'))] +
	                            ((Math.round((time.hours * time.price) * 100)) / 100).toFixed(2)
	                          )
	                        : m('td', {class: 'px-3'}, time[x]); }
	                      ),
	                    m('td', {class: 'flex'},
	                      m('span', {
	                        class: 'cursor-pointer',
	                        title: 'edit',
	                        onclick: function () {
	                          S.time = time;
	                          m.route.set('/time');
	                        }
	                      }, svgs.edit),
	                      m('span', {
	                        class: 'cursor-pointer',
	                        title: 'copy',
	                        onclick: function () {
	                          time.id;
	                          var rest = objectWithoutProperties$3( time, ["id"] );
	                          var body = rest;
	                          A.post('times', body);
	                        }
	                      }, svgs.copy),
	                      m('span', {
	                        class: 'cursor-pointer mt-0.5',
	                        onclick: function () {
	                          if (confirm(`Are you sure you wish to delete this time entry?`)) {
	                            A.del('times', time.id);
	                          }
	                        }
	                      }, svgs.crossred)
	                    )
	                  ); }
	                )
	              )
	            )
	          : m('h5', {class: 'text-lg font-bold'}, 'No time entries found')
	        )
	      ); }
	  }
	}

	function objectWithoutProperties$2 (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

	function time (ref) {
	  var ref_attrs = ref.attrs;
	  var S = ref_attrs.S;
	  var A = ref_attrs.A;

	  if (!S.loaded) { A.init(); }

	  var action = S.time.id ? 'put' : 'post';
	  var cred = action === 'post' ? 'Create' : 'Edit';

	  var save = function () {
	    if (action === 'post') {
	      A.post('times', S.time)
	      .then(function () { return m.route.set('/times'); })
	      .catch(console.log);
	    }
	    else {
	      var ref = S.time;
	      var id = ref.id;
	      var rest = objectWithoutProperties$2( ref, ["id"] );
	      var body = rest;
	      A.put('times', id, body)
	      .then(function () { return m.route.set('/times'); })
	      .catch(console.log);
	    }
	  };

	  return {
	    onbeforeupdate: function () {
	      if (!S.loaded) { A.init(); }
	    },

	    view: function () { return m('div', {class: 'p-4'},
	        m('h2', {class: 'text-2xl font-bold mb-3'}, `${cred} time entry`),
	        m('form', {class: 'flex flex-col gap-[20px]'},
	          m('div', {class: 'flex'},
	            m('label', {class: 'w-[100px] capitalize'}, 'Date'),
	            m('input', {
	              type: 'date',
	              class: 'px-2',
	              value: S.time.date,
	              onchange: function (e) { return S.time.date = e.target.value; }
	            })
	          ),
	          ['description', 'hours', 'price', 'code'].map(function (x) { return m('div', {class: 'flex'},
	              m('label', {class: 'w-[100px] capitalize'}, x),
	              m('input', {
	                class: 'px-2',
	                value: S.time[x],
	                onchange: function (e) { return S.time[x] = (x === 'hours' || x === 'price') ? +e.target.value : e.target.value; }
	              })
	            ); }
	          ),
	          [{code: 'projid', name: 'Project', arr: 'projects'},
	           {code: 'compid', name: 'Company', arr: 'companies'}].map(function (x) { return m('div', {class: 'flex'},
	              m('label', {class: 'w-[100px] capitalize'}, x.name),
	              m('select', {
	                  name: x.code,
	                  style: 'padding: 0 8px',
	                  value: S.time[x.code],
	                  onchange: function (e) { return S.time[x.code] = +e.target.value; }
	                },
	                S[x.arr].map(function (y) { return m('option', {value: y.id}, y.name); }
	                )
	              )
	            ); }
	          )
	        ),
	        m('button', {
	          class: 'w-[120px] mt-5 ' + S.classes.button,
	          onclick: function () { return save(); }
	        }, 'Save')
	      ); }
	  }
	}

	function json (ref) {
	  var S = ref.attrs.S;

	  var make = function () { return S.times
	    .filter(function (time) { return S.checks[time.id]; })
	    .reduce(function (a,c) { return (a.push({project: c.code, who: 'Oscar Bannink', comment: c.description, hr: c.hours, date: c.date}), a); }, [])
	    .sort(function (a,b) { return a.date > b.date ? 1 : -1; }); };

	  return {
	    view: function () { return m('div', {class: 'p-4'},
	        m('div', {class: 'mb-3'},
	          m('button', {
	              class: S.classes.button,
	              onclick: function () {
	                navigator.clipboard.writeText(document.getElementById('json').innerHTML);
	              }
	            },
	            'Copy to Clipboard'
	          )
	        ),
	        m('pre#json', JSON.stringify(make(), null, 2))
	      ); }
	  }
	}

	var Modal = function () {
	  var txt = {
	    savHTML: `save HTML`,
	    makePDF: `make PDF`,
	    movePDF: `move PDF`,
	    delHTML: `delete HTML`
	  };

	  return {
	    view: function (ref) {
	        var ref_attrs = ref.attrs;
	        var res = ref_attrs.res;
	        var cls = ref_attrs.cls;
	        var click = ref_attrs.click;

	        return m('div', {class: 'fixed top-0 left-0 w-screen h-screen flex flex-col justify-center items-center bg-black opacity-80'},
	        m('div', {class: 'text-center mb-2.5 p-5 w-52 h-52 bg-white'},
	          ['savHTML', 'makePDF', 'movePDF', 'delHTML']
	          .map(function (x) { return m('div', {class: 'flex'},
	              m('span', {class: 'w-24 ml-4 mr-1 text-left'}, txt[x]),
	              m('span', res[x] ? svgs.crossredsm : svgs.check)); }
	            ),
	          m('div', {class: 'mt-2'},
	            m('button', {class: cls, onclick: click}, "OK")
	          )
	        )
	      );
	  }
	    }
	};

	function invoices (ref) {
	  var ref_attrs = ref.attrs;
	  var S = ref_attrs.S;
	  var A = ref_attrs.A;

	  if (!S.loaded) { A.init(); }

	  var curs = {USD: '$', EUR: '€'};
	  var proj = function (id, prop) {
	    var p = S.projects.find(function (proj) { return proj.id === id; });
	    return p ? p[prop] : ''
	  };
	  var pdfres = null;

	  var pdf = function () {
	    var proj = S.projects.find(function (ref) {
	      var id = ref.id;

	      return id === S.invo.projid;
	    });
	    var ids = S.invo.times.split(',').map(Number);
	    var times = S.times.filter(function (ref) {
	      var id = ref.id;

	      return ids.includes(id);
	    }).reverse();
	    var comp = S.companies.find(function (ref) {
	      var id = ref.id;

	      return id === times[0].compid;
	    });
	    A.post('pdf', {invo: S.invo, comp: comp, proj: proj, times: times})
	    .then(function (res) { return pdfres = res; })
	    .catch(console.log);
	  };

	  return {
	    onbeforeupdate: function () {
	      if (!S.loaded) { A.init(); }
	    },

	    view: function () { return m('div', {class: 'p-4'},
	        m('h2', {class: 'text-2xl font-bold mb-2'}, 'Invoices'),
	        m('div',
	          S.invoices.length > 0
	          ? m('table',
	              m('thead',
	                m('tr',
	                  ['date', 'project', 'total', '']
	                  .map(function (x) { return m('th', {class: 'text-left px-3'}, x); }
	                  )
	                )
	              ),
	              m('tbody',
	                S.invoices.map(function (invo) { return m('tr',
	                    m('td', {class: 'px-3'}, invo.date),
	                    m('td', {class: 'px-3'}, proj(invo.projid, 'name')),
	                    m('td', {class: 'px-3'}, curs[(proj(invo.projid, 'currency'))] + invo.total),
	                    m('td', {class: 'flex'},
	                      m('span', {
	                        class: 'cursor-pointer mr-1.5 mt-1',
	                        title: 'pdf',
	                        onclick: function () {
	                          S.invo = invo;
	                          pdf();
	                        }
	                      }, svgs.pdf),
	                      m('span', {
	                        class: 'cursor-pointer mt-0.5',
	                        title: 'preview',
	                        onclick: function () {
	                          S.invo = invo;
	                          m.route.set('/preview');
	                        }
	                      }, svgs.eye),
	                      m('span', {
	                        class: 'cursor-pointer',
	                        onclick: function () {
	                          if (confirm(`Are you sure you wish to delete ${invo.name}?`)) {
	                            A.del('invoices', invo.id);
	                          }
	                        }
	                      }, svgs.crossred)
	                    )
	                  ); }
	                )
	              )
	            )
	          : m('h5', {class: 'text-lg font-bold'}, 'No invoices found')
	        ),
	        pdfres && m(Modal, {res: pdfres, cls: S.classes.button, click: function () { return pdfres = null; }})
	      ); }
	  }
	}

	function config (ref) {
	  var ref_attrs = ref.attrs;
	  var S = ref_attrs.S;
	  var A = ref_attrs.A;

	  if (!S.loaded) { A.init(); }

	  return {
	    onbeforeupdate: function () {
	      if (!S.loaded) { A.init(); }
	    },

	    view: function () { return m('div', {class: 'p-4'},
	        m('div', {class: 'flex mb-2'},
	          m('h2', {class: 'text-2xl font-bold'}, 'Companies'),
	          m('button', {
	            class: S.classes.plus,
	            onclick: function () {
	              S.comp = {};
	              m.route.set('/company');
	            }
	          }, '+')
	        ),
	        m('div',
	          S.companies.length > 0
	          ? m('table',
	              m('tbody',
	                S.companies.map(function (company) { return m('tr',
	                    m('td', {class: 'px-3'}, company.name),
	                    m('td', {class: 'flex'},
	                      m('span', {
	                        class: 'cursor-pointer',
	                        title: 'edit',
	                        onclick: function () {
	                          S.comp = company;
	                          m.route.set('/company');
	                        }
	                      }, svgs.edit),
	                      m('span', {
	                        class: 'cursor-pointer mt-0.5',
	                        onclick: function () {
	                          if (confirm(`Are you sure you wish to delete ${company.name}?`)) {
	                            A.del('companies', company.id);
	                          }
	                        }
	                      }, svgs.crossred)
	                    )
	                  ); }
	                )
	              )
	            )
	          : m('h5', {class: 'text-lg font-bold'}, 'No company found')
	        ),

	        m('div', {class: 'flex mt-8 mb-2'},
	          m('h2', {class: 'text-2xl font-bold'}, 'Projects'),
	          m('button', {
	            class: S.classes.plus,
	            onclick: function () {
	              S.comp = {};
	              m.route.set('/project');
	            }
	          }, '+')
	        ),
	        m('div',
	          S.projects.length > 0
	          ? m('table',
	              m('tbody',
	                S.projects.map(function (project) { return m('tr',
	                    m('td', {class: 'px-3'}, project.name),
	                    m('td', {class: 'flex'},
	                      m('span', {
	                        class: 'cursor-pointer',
	                        title: 'edit',
	                        onclick: function () {
	                          S.proj = project;
	                          m.route.set('/project');
	                        }
	                      }, svgs.edit),
	                      m('span', {
	                        class: 'cursor-pointer mt-0.5',
	                        onclick: function () {
	                          if (confirm(`Are you sure you wish to delete ${project.name}?`)) {
	                            A.del('projects', project.id);
	                          }
	                        }
	                      }, svgs.crossred)
	                    )
	                  ); }
	                )
	              )
	            )
	          : m('h5', {class: 'text-lg font-bold'}, 'No projects found')
	        )
	      ); }
	  }
	}

	function objectWithoutProperties$1 (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

	function company (ref) {
	  var ref_attrs = ref.attrs;
	  var S = ref_attrs.S;
	  var A = ref_attrs.A;

	  if (!S.loaded) { A.init(); }

	  var action = S.comp.id ? 'put' : 'post';
	  var cred = action === 'post' ? 'Create' : 'Edit';

	  var save = function () {
	    if (action === 'post') {
	      A.post('companies', S.comp)
	      .then(function () { return m.route.set('/config'); })
	      .catch(console.log);
	    }
	    else {
	      var ref = S.comp;
	      var id = ref.id;
	      var rest = objectWithoutProperties$1( ref, ["id"] );
	      var body = rest;
	      A.put('companies', id, body)
	      .then(function () { return m.route.set('/config'); })
	      .catch(console.log);
	    }
	  };

	  return {
	    onbeforeupdate: function () {
	      if (!S.loaded) { A.init(); }
	    },

	    view: function () { return m('div', {class: 'p-4'},
	        m('h2', {class: 'text-2xl font-bold mb-3'}, `${cred} company`),
	        m('form', {class: 'flex flex-col gap-[20px]'},
	          ['name', 'address', 'city', 'country', 'coc', 'vat'].map(function (x) { return m('div', {class: 'flex'},
	              m('label', {class: 'w-[100px] capitalize'},
	                x === 'coc' ? 'CoC/KvK' :
	                x === 'vat' ? 'VAT/BTW' :
	                x
	              ),
	              m('input', {
	                class: 'px-2',
	                value: S.comp[x],
	                onchange: function (e) { return S.comp[x] = e.target.value; }
	              })
	            ); }
	          )
	        ),
	        m('button', {
	          class: 'w-[120px] mt-5 ' + S.classes.button,
	          onclick: function () { return save(); }
	        }, 'Save')
	      ); }
	  }
	}

	function objectWithoutProperties (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

	function project (ref) {
	  var ref_attrs = ref.attrs;
	  var S = ref_attrs.S;
	  var A = ref_attrs.A;

	  if (!S.loaded) { A.init(); }

	  var action = S.proj.id ? 'put' : 'post';
	  var cred = action === 'post' ? 'Create' : 'Edit';

	  var save = function () {
	    if (action === 'post') {
	      A.post('projects', S.proj)
	      .then(function () { return m.route.set('/config'); })
	      .catch(console.log);
	    }
	    else {
	      var ref = S.proj;
	      var id = ref.id;
	      var rest = objectWithoutProperties( ref, ["id"] );
	      var body = rest;
	      A.put('projects', id, body)
	      .then(function () { return m.route.set('/config'); })
	      .catch(console.log);
	    }
	  };

	  return {
	    onbeforeupdate: function () {
	      if (!S.loaded) { A.init(); }
	    },

	    view: function () { return m('div', {class: 'p-4'},
	        m('h2', {class: 'text-2xl font-bold mb-3'}, `${cred} project`),
	        m('form', {class: 'flex flex-col gap-[20px]'},
	          ['name', 'address', 'city', 'country', 'bank', 'currency', 'tax', 'language'].map(function (x) { return m('div', {class: 'flex'},
	              m('label', {class: 'w-[100px] capitalize'}, x),
	              x === 'currency'
	              ? m('select', {
	                    style: 'padding: 0 8px',
	                    value: S.proj[x],
	                    onchange: function (e) { return S.proj[x] = e.target.value; }
	                  },
	                  ['USD', 'EUR'].map(function (y) { return m('option', {value: y}, y); })
	                )
	              : x === 'language'
	                ? m('select', {
	                      style: 'padding: 0 8px',
	                      value: S.proj[x],
	                      onchange: function (e) { return S.proj[x] = e.target.value; }
	                    },
	                    Object.entries({EN: 'English', NL: 'Nederlands'})
	                    .map(function (ref) {
	                      var k = ref[0];
	                      var v = ref[1];

	                      return m('option', {value: k}, v);
	              })
	                  )
	                : m('input', {
	                    class: 'px-2',
	                    value: S.proj[x],
	                    onchange: function (e) { return S.proj[x] = x === 'tax' ? +e.target.value : e.target.value; }
	                  })
	            ); }
	          )
	        ),
	        m('button', {
	          class: 'w-[120px] mt-5 ' + S.classes.button,
	          onclick: function () { return save(); }
	        }, 'Save')
	      ); }
	  }
	}

	var txt = function (field, idx) { return ({
	  title: ['Invoice', 'Factuur'],
	  coc: ['CoC: ', 'KvK: '],
	  vat: ['VAT: ', 'BTW: '],
	  nr: ['Invoice number: ', 'Factuurnummer: '],
	  date: ['Date', 'Datum'],
	  description: ['Description', 'Omschrijving'],
	  price: ['Price', 'Prijs'],
	  hours: ['Hours', 'Uren'],
	  total: ['Total', 'Totaal'],
	  sub: ['Subtotal', 'Subtotaal'],
	  tax: ['Tax ',  'BTW ']
	}[field][idx]); };

	function preview (ref) {
	  var S = ref.attrs.S;

	  var proj = S.projects.find(function (ref) {
	    var id = ref.id;

	    return id === S.invo.projid;
	  });
	  var ids = S.invo.times.split(',').map(Number);
	  var times = S.times.filter(function (ref) {
	    var id = ref.id;

	    return ids.includes(id);
	  }).reverse();
	  var comp = S.companies.find(function (ref) {
	    var id = ref.id;

	    return id === times[0].compid;
	  });

	  var idx = proj.language === 'EN' ? 0 : 1;
	  var curs = {USD: '$', EUR: '€'};
	  var getym = function (date) { return date.replaceAll('-', '').slice(2); };
	  var calctax = function (perc, total) { return ((Math.round(((perc / 100) * total) * 100)) / 100); };

	  return {
	    view: function () { return m('div', {style: 'position:relative; width:100vw; height:100vh'},
	        m('div', {style: 'width:970px; margin:0 auto; padding:20px'},
	          m('div', {style: 'display:flex; justify-content:space-between; align-items:center'},
	            m('div', {style: 'font-size: 2.25rem'}, txt('title', idx)),
	            m('div', {style: 'margin-top:9px; font-size: 1rem; font-style:italic'}, S.invo.date)
	          ),
	          m('hr', {style: 'border-top:1px solid black'}),
	          m('div', {style: 'display:flex; justify-content:space-between; margin-top:20px'},
	            m('div',
	              m('div', {style: 'font-weight:bold'}, proj.name),
	              m('div', proj.address),
	              m('div', proj.city),
	              m('div', proj.country)
	            ),
	            m('div', {style: 'margin-right:20px'},
	              m('div', {style: 'font-weight:bold'}, comp.name),
	              m('div', comp.address),
	              m('div', comp.city),
	              m('div', comp.country),
	              m('div', {style: 'margin-top:3px'}, txt('coc', idx) + comp.coc),
	              m('div', txt('vat', idx) + comp.vat),
	              m('div', `Bank: ${proj.bank}`)
	            )
	          ),
	          m('div', {style: 'margin-top:90px'}, txt('nr', idx) + getym(S.invo.date)),
	          m('div', {style: 'margin-top:60px'},
	            m('table', {style: 'width:100%; text-align:left; font-size:18px'},
	              m('thead',
	                ['date', 'description', 'price', 'hours', 'total']
	                .map(function (x) { return m('th', txt(x, idx)); })
	              ),
	              m('tbody',
	                times.map(function (time) { return m('tr', {style: 'height:28px'},
	                    m('td', {style: 'width:120px'}, time.date),
	                    m('td', time.description),
	                    m('td', curs[proj.currency] + time.price.toFixed(2)),
	                    m('td', time.hours.toFixed(1)),
	                    m('td', {style: 'width:100px'}, curs[proj.currency] + time.total.toFixed(2))
	                  ); }
	                ),
	                m('tr',
	                  m('td', {colspan: 4}),
	                  m('td',
	                    m('hr', {style: 'border-top:1px solid black'})
	                  )
	                ),
	                m('tr',
	                  m('td', {colspan: 3}),
	                  m('td', {style: 'padding-top:8px'}, txt('sub', idx)),
	                  m('td', curs[proj.currency] + S.invo.total.toFixed(2))
	                ),
	                m('tr',
	                  m('td', {colspan: 3}),
	                  m('td', {style: 'padding-top:5px'}, `${txt('tax', idx)} (${proj.tax}%)`),
	                  m('td', curs[proj.currency] + calctax(proj.tax, S.invo.total).toFixed(2))
	                ),
	                m('tr', {style: 'font-weight:bold'},
	                  m('td', {colspan: 3}),
	                  m('td', {style: 'padding-top:5px; font-size:18px; font-weight:bold'}, txt('total', idx)),
	                  m('td', curs[proj.currency] + (S.invo.total + calctax(proj.tax, S.invo.total)).toFixed(2))
	                )
	              )
	            )
	          )
	        )
	      ); }
	  }
	}

	var S = state();
	var A = actions(S);

	var routes = {
	  '/'        : {render: function () { return m(layout, {A: A}, m(times,    {S: S,A: A})); }},
	  '/times'   : {render: function () { return m(layout, {A: A}, m(times,    {S: S,A: A})); }},
	  '/time'    : {render: function () { return m(layout, {A: A}, m(time,     {S: S,A: A})); }},
	  '/json'    : {render: function () { return m(layout, {A: A}, m(json,     {S: S})); }},
	  '/invoices': {render: function () { return m(layout, {A: A}, m(invoices, {S: S,A: A})); }},
	  '/config'  : {render: function () { return m(layout, {A: A}, m(config,   {S: S,A: A})); }},
	  '/company' : {render: function () { return m(layout, {A: A}, m(company,  {S: S,A: A})); }},
	  '/project' : {render: function () { return m(layout, {A: A}, m(project,  {S: S,A: A})); }},
	  '/preview' : {render: function () { return m(preview, {S: S}); }}
	};

	m.route(document.body, '/', routes);

})();
