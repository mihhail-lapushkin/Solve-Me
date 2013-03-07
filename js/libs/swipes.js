(function(w, doc, abs) {
	var swipeMaxTime = 1000;
	var swipeMinDist = 30;
	var swipeMaxWrongDist = 75;
	
	var startT;
	var startX;
	var startY;
	var endX;
	var endY;
	
	var detectSwipeStart = function(evt) {
		if (!doc.onswipe)
			return;
	
		evt.preventDefault();
	
		var evt = evt.touches ? evt.touches[0] : evt;
		startT = new Date().getTime();
		startX = evt.pageX;
		startY = evt.pageY;
	}
	
	var detectSwipeMove = function(evt) {
		if (!doc.onswipe)
			return;
	
		evt.preventDefault();
	
		var evt = evt.touches ? evt.touches[0] : evt;
		endX = evt.pageX;
		endY = evt.pageY;
	}
	
	var detectSwipeEnd = function(evt) {
		if (!doc.onswipe)
			return;
	
		evt.preventDefault();
	
		var endT = new Date().getTime();
	
		if (endT - startT < 1000) {
			var deltaX = abs(startX - endX);
			var deltaY = abs(startY - endY);
	
			if (deltaX >= swipeMinDist && deltaY < swipeMaxWrongDist) {
				if (startX > endX) {
					doc.onswipe('left');
				} else {
					doc.onswipe('right');
				}
			} else if (deltaY >= swipeMinDist && deltaX < swipeMaxWrongDist) {
				if (startY > endY) {
					doc.onswipe('up');
				} else {
					doc.onswipe('down');
				}
			}
		}
	}
	
	doc.addEventListener('mousedown', detectSwipeStart, false);
	doc.addEventListener('touchstart', detectSwipeStart, false);
	doc.addEventListener('mousemove', detectSwipeMove, false);
	doc.addEventListener('touchmove', detectSwipeMove, false);
	doc.addEventListener('mouseup', detectSwipeEnd, false);
	doc.addEventListener('touchend', detectSwipeEnd, false);
})(window, window.document, Math.abs);