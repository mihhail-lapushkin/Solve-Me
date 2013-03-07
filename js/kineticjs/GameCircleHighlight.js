Kinetic.GameCircleHighlight = function(config) {
	this.setDefaultAttrs({
    	opacity: 0
	});
		
	var that = this;
	var hc = config.color;
	config.cs = 'rgba(' + hc.red + ',' + hc.green + ',' + hc.blue + ',1)';
	config.ce = 'rgba(' + hc.red + ',' + hc.green + ',' + hc.blue + ',0)';
		
	Kinetic.Circle.call(this, config);

	config.circle.on('xChange.highlight', function(evt) { that.setX(evt.newVal); });
	config.circle.on('yChange.highlight', function(evt) { that.setY(evt.newVal); });
};

Kinetic.GameCircleHighlight.prototype = {
	turnOnFollowCircleRadius: function() {
		var that = this;
			
		this.attrs.circle.on('radiusChange.highlight', function(evt) {
			var r = evt.newVal * that.attrs.overlap;
				
			that.setFill({
				start : { x : 0, y : 0, radius : r * 0.6 },
				end : { x : 0, y : 0, radius : r },
				colorStops : [ 0.0, that.attrs.ce, 0.7, that.attrs.cs, 1.0, that.attrs.ce ]
			});
				
			that.setRadius(r);
		});
	},
	
	turnOffFollowCircleRadius: function() {
		this.attrs.circle.off('radiusChange.highlight');
	}
};

Kinetic.Global.extend(Kinetic.GameCircleHighlight, Kinetic.Circle);