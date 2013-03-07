(function(w, doc) {
	// local vars
	var ArrayProto 			= Array.prototype,
		FuncProto 			= Function.prototype,
		StrProto 			= String.prototype,
		ObjProto			= Object.prototype,
		slice         		= ArrayProto.slice,
		hasOwnProperty		= ObjProto.hasOwnProperty,
		nativeForEach      	= ArrayProto.forEach,
	    nativeIndexOf      	= ArrayProto.indexOf,
	    breaker 			= {},
		identity 			= function(v) { return v };
	
	// convenience functions & shortcuts
	w.toNumber = parseFloat;
	w.delay = function(t, f) {
		setTimeout(f, t * 1000);
	};
	
	w.parsePixels = function(px) {
		return parseFloat(px.replace('px', ''));
	}
	
	w.id = function(id) {
		return doc.getElementById(id);
	}
	
	w.all = function(s, startAt) {
		return doc.querySelectorAll((startAt ? '#' + startAt.id + ' ' : '') + s);
	}
	
	w.one = function(s, startAt) {
		return doc.querySelector((startAt ? '#' + startAt.id + ' ' : '') + s);
	}
	
    w.isArray = function(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    }
    
    w.isObject = function(obj) {
        return Object.prototype.toString.call(obj) == '[object Object]';
    }
	
	var evtBase = function(funcName, evts, handler, el) {
		if (el) {
			var tmp = evts;
			evts = handler;
			handler = el;
			el = tmp;
		}
		
		evts.split(' ').forEach(function(evt) {
			((el ? el : doc)[funcName])(evt, handler, false);
		});
	}
	
	w.bind = function(evts, handler, el) {
		evtBase('addEventListener', evts, handler, el);
	}
	
	w.unbind = function(evts, handler, el) {
		evtBase('removeEventListener', evts, handler, el);
	}
	
	w.extend = function(obj) {
		slice.call(arguments, 1).forEach(function(source) {
			for (var prop in source) {
		        obj[prop] = source[prop];
			}
		});
		return obj;
	}
	
	w.clone = function(arr) {
		var newArr = [];
		
		for (var i = 0; i < arr.length; i++) {
			newArr.push(arr[i]);
		}
		
		return newArr;
	}
	
	w.each = function(obj, iterator) {
		if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (iterator(obj[i], i, obj) === false) return;
		 	}
		} else {
			for (var key in obj) {
				if (iterator(obj[key], key, obj) === false) return;
		  	}
		}
	}
	
	w.attr = function(attr, el) {
		return el.getAttribute(attr);
	}
	
	w.db = w.localStorage;
	w.pg = w.PhoneGap;
	
	// events
	w.whenPageLoaded = function(fn) {
		w.bind(w, 'DOMContentLoaded', fn);
	}
	
	w.whenDeviceReady = function(fn) {
		w.bind('deviceready', fn);
	}
	
	w.preloadSequentialImagesFromCSS = function(nImages) {
		var imgs = {};
		var breaked = false;
		
		each(w.document.styleSheets, function(sh) {
			var rules = sh.rules ? sh.rules : sh.cssRules;
			
			each(rules, function(rule, i) {
				var text = rule.selectorText;
				
				if (text && text.contains('#img-')) {
					for (var imgIndex = 1, j = i, n = i + nImages; j < n; imgIndex++, j++) {
						var rule = rules[j];
						var img = rule.style.backgroundImage;
						imgs[imgIndex] = img.substring(5, img.length - 2);
					}
					
					breaked = true;
					return false;
				}
			});
			
			if (breaked) return false;
		});
		
		/*for (var i = from; i <= to; i++) {
			div.id = 'img-' + i;
			document.body.appendChild(div);
			var img = w.getComputedStyle(div).backgroundImage;
			//var img = w.id('img-' + i).style.backgroundImage;
			imgs[i] = img.substring(5, img.length - 2);
			document.body.removeChild(div);
		}*/
		
		w.preloadImages(imgs);
	}
	
	w.preloadSequentialImages = function(from, to, basePath, ext) {
		var imgs = {};
		
		for (var i = from; i <= to; i++) {
			imgs[i] = basePath + i + '.' + ext;
		}
		
		w.preloadImages(imgs);
	}
	
	w.preloadImages = function(imgSrc) {
		w.img = imgSrc;
	}
	
	w.whenLoadedAndReady = function(fn) {
		var left = 1;
		
		if (w.pg) left++;
		if (w.img) left++;
		
		var callback = function() {
			if (--left == 0) {
				fn();
			}
		}
		
		w.whenPageLoaded(callback);
		
		if (w.pg) {
			w.whenDeviceReady(callback);
		}
		
		if (w.img) {
			var loadedImages = 0;
			var numImages = 0;
			var checkAllLoaded = function() {
				if (++loadedImages >= numImages) {
					w.img.count = numImages;
					callback();
				}
			}
			var setImg = function(image, src) {
				image.src = w.img[src];
				w.img[src] = image;
			}

			for (var src in w.img) { numImages++; }
			for (var src in w.img) {
				var image = new Image();

				if (w.img[src].contains('base64')) {
					setImg(image, src);
					checkAllLoaded();
				} else {
					image.onload = checkAllLoaded;
					setImg(image, src);
				}
			}
		}
	}
	
	w.whenMenuPressed = function(fn) {
		w.bind('menubutton', fn);
	}
	
	w.whenPaused = function(fn) {
		w.bind('pause', fn);
	}
	
	w.whenResumed = function(fn) {
		w.bind('resume', fn);
	}
	
	var isWebkit = RegExp(' AppleWebKit/').test(navigator.userAgent);
	
	// animation support
	var animationEvent = isWebkit ? 'webkitAnimationEnd' : 'animationend';
	var animations = 0;
	w.animating = false;
	w.animate = function(el, anim, callback) {
		el.setAttribute('animation', anim);
		
		animations++;
		w.animating = true;
		
		var handler = function(evt) {
			if (el == evt.target) {
				w.unbind(el, animationEvent, handler);
				
				el.removeAttribute('animation');
				
				if (--animations == 0) {
					w.animating = false;
				}
				
				if (callback) callback(evt);
			}
		}
		w.bind(el, animationEvent, handler);
	}
	
	// transition support
	var transitionEvent = isWebkit ? 'webkitTransitionEnd' : 'transitionend';
	w.transition = function(el, prop, val, speed, callback) {
		el.setAttribute('speed', speed);
		el.style[prop] = val;
		
		var handler = function(evt) {
			w.unbind(el, transitionEvent, handler);
			
			el.removeAttribute('speed');
			
			if (callback) callback(evt);
		}
		w.bind(el, transitionEvent, handler);
	}
	
	// dynamically load data using script hack
	w.loadJs = function(url, callback) {
		var head = doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement;
		var script = doc.createElement('script');

		script.async = 'async';
		script.charset = 'utf-8';
		script.src = url + '.js';

		script.onload = script.onreadystatechange = function(_) {

			if (!script.readyState || /loaded|complete/.test(script.readyState)) {
				script.onload = script.onreadystatechange = null;

				if (head && script.parentNode) {
					head.removeChild(script);
				}
				
				var loadedContent = w._C_;

				script = w._C_ = undefined;
				
				callback(loadedContent);
			}
		}

		head.insertBefore(script, head.firstChild);
	}
	
	// standard object extensions and improvements
	if (!nativeForEach) {
		ArrayProto.forEach = function(iterator, context) {
			if (this.length === +this.length) {
				for (var i = 0, l = this.length; i < l; i++) {
					if (i in this && iterator.call(context, this[i], i, this) === breaker) return;
			 	}
			} else {
				for (var key in this) {
			    	if (hasOwnProperty.call(this, key)) {
			    		if (iterator.call(context, this[key], key, this) === breaker) return;
			        }
			  	}
			}
		}
	}
	
	if (!nativeIndexOf) {
		var sortedIndex = function(array, obj, iterator) {
			iterator || (iterator = identity);
			var low = 0, high = array.length;
			while (low < high) {
				var mid = (low + high) >> 1;
			 	iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
			}
			return low;
		}
		
		ArrayProto.indexOf = function(item, isSorted) {
			var i, l;
			if (isSorted) {
			 	i = sortedIndex(array, item);
				return this[i] === item ? i : -1;
			}
			for (i = 0, l = this.length; i < l; i++) if (i in this && this[i] === item) return i;
			return -1;
		}
	}

	ArrayProto.contains = function(target) {
	    return this.indexOf(target) != -1;
	}
	
	ArrayProto.add = function(el) {
		this.push(el);
		
		return this;
	}
	
	ArrayProto.remove = function(el) {
		var i = this.indexOf(el);
		
		if (i != -1) {
			this.splice(i, 1);
		}
		
		return this;
	}
	
	ArrayProto.clone = function() {
		return this.splice(0);
	}
	
	FuncProto.repeat = function(n) {
		for (var i = 0; i < n; i++) {
			this.call();
		}
		
		return this;
	}
	
	StrProto.contains = function(s) {
		return this.indexOf(s) >= 0;
	}
	
	if (!StrProto.trim) {
		StrProto.trim = function() {
			return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}
	}
})(window, window.document);