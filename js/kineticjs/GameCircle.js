Kinetic.GameCircle = function(config) {
	this.setDefaultAttrs({
		connections : [],
		_connections : [],
		neighbours : [],
		ownNeighbours : [],
		fillValues : config.active ? config.colors.active : config.colors.passive
	});

	Kinetic.Circle.call(this, config);

	config.highlight.layer.add(this.hili = new Kinetic.GameCircleHighlight(extend({
		x : config.x,
		y : config.y,
		circle : this
	}, config.highlight)));

	var drawFunc = this.attrs.drawFunc;

	this.attrs.drawFunc = function(context) {
		var presetFill = this.attrs.fill;
		
		drawFunc.call(this, context);

		var r = this.getRadius();
		var s = this.getScore();
		
		if (Kinetic.Type._isString(presetFill) && Kinetic.Global.shapes[presetFill.substring(1)]) {
			context.fillStyle = presetFill;
		} else {
			context.globalAlpha = 0.95;
			context.fillStyle = 'white';
		}

		context.font = 'bold ' + r * 1.4 + 'pt ' + this.getFont();
		context.fillText(s, -r / 2, r / 2 * 0.7);
	}

	var recalcFillAndStroke = function() {
		var c = this.attrs.gradientFactors.center;
		var b = this.attrs.gradientFactors.border;
		var r = this.getRadius();

		var middle = this.getFillValues();
		var start = Color(middle.red * c, middle.green * c, middle.blue * c);
		var end = Color(middle.red * b, middle.green * b, middle.blue * b);

		var f = {
			start : {
				x : 0,
				y : 0,
				radius : 0
			},
			end : {
				x : 0,
				y : 0,
				radius : r
			},
			colorStops : [ 0.0, Color.toString(start), 0.5, Color.toString(middle), 1.0, Color.toString(end) ]
		}

		this.setFill(f);
		this.setStrokeWidth(r / 50);
	}

	this.on('click tap', this._pressed);
	this.on('radiusChange.redraw', function() { this.attrs.connection.layer.draw() });
	this.on('fillValuesChange', recalcFillAndStroke);

	this.setRadius(this._calcRadius());
	this.simulate('fillValuesChange');
};

Kinetic.GameCircle.prototype = {
	_calcRadius: function() {
		return this.attrs.radiusFunc(this.getScore());
	},
	
	getConnections: function() {
		return this.attrs.connections;
	},
	
	_removeConnection: function(conn) {
		this.attrs.connections.remove(conn);
	},
	
	getNeighbours: function() {
		return this.attrs.neighbours;
	},
	
	_removeNeighbour: function(circle) {
		this.attrs.neighbours.remove(circle);
	},
	
	getOwnNeighbours: function() {
		return this.attrs.ownNeighbours;
	},
	
	_removeOwnNeighbour: function(circle) {
		this.attrs.ownNeighbours.remove(circle);
	},
	
	connections: function() {
		return this.getConnections().length;
	},
	
	connect: function(circle) {
		if (circle != this && !this.isConnected(circle)) {
			var conn = new Kinetic.Connection(extend({ circles : [ this, circle ] }, this.attrs.connection));
	
			this.getConnections().add(conn);
			circle.getConnections().add(conn);
			this.getNeighbours().add(circle);
			circle.getNeighbours().add(this);
	
			this.getOwnNeighbours().add(circle);
	
			this.attrs.connection.layer.add(conn);
		}
	},
	
	disconnect: function(circle) {
		if (circle != this && this.isConnected(circle)) {
			var delConn;
	
			this.getConnections().forEach(function(conn) {
				if (conn.hasCircle(circle)) {
					delConn = conn;
				}
			});
	
			this._removeConnection(delConn);
			circle._removeConnection(delConn);
			this._removeNeighbour(circle);
			circle._removeNeighbour(this);
	
			if (this.ownsConnectionWith(circle)) {
				this._removeOwnNeighbour(circle);
			} else {
				circle._removeOwnNeighbour(this);
			}
	
			delConn.remove();
		}
	},
	
	ownsConnectionWith: function(c) {
		return this.getOwnNeighbours().contains(c);
	},
	
	isConnected: function(c) {
		return this.getNeighbours().contains(c);
	},
	
	toggleActive: function() {
		this.attrs.active = !this.isActive();
	
		this.transitionTo({
			fillValues : this.isActive() ? this.attrs.colors.active : this.attrs.colors.passive,
			easing : 'ease-out',
			duration : 1.0
		});
	},
	
	isActive: function() {
		return this.attrs.active;
	},
	
	setScore: function(s) {
		this.attrs.score = s;
	},
	
	getScore: function() {
		return this.attrs.score;
	},
	
	decreaseScore: function() {
		this.setScore(this.getScore() - 1);
	},
	
	_animatePress: function() {
		var that = this;
		var hili = this.hili;
		var actualRadius = this._calcRadius();
		var currRadius = this.getRadius();
		var a = this.isActive();
		var r = a ? actualRadius : currRadius;
		var s = a ? 2 : 1;
	
		hili.turnOnFollowCircleRadius();
		hili.setOpacity(1);
	
		this.transitionTo({
			radius : currRadius * 1.2,
			duration : 0.2,
			easing : 'strong-ease-out',
			callback : function() {
				hili.turnOffFollowCircleRadius();
	
				hili.transitionTo({
					opacity : 0.0,
					scale : {
						x : s,
						y : s
					},
					duration : 1,
					easing : 'strong-ease-out',
					callback : function() {
						hili.setScale({
							x : 1,
							y : 1
						});
					}
				});
	
				that.transitionTo({
					radius : r,
					duration : 0.5,
					easing : 'back-ease-in-out'
				});
			}
		});
	},
	
	_removeCircle: function() {
		var that = this;
	
		this.off('mousedown touchstart');
		this.off('radiusChange');
		this.off('fillValuesChange');
		this.off('xChange');
		this.off('yChange');
		this.hili.remove();
	
		this.transitionTo({
			scale : {
				x : 0.001,
				y : 0.001
			},
			opacity : 0.1,
			rotation : Math.PI * 2,
			duration : 0.3,
			callback : function() {
				var conns = that.connections();
				var parent = that.getParent();
	
				that.getNeighbours().slice().forEach(function(circle) {
					that.disconnect(circle);
				});
	
				that.remove();
	
				if (conns > 0) {
					parent.simulate('connectedRemoved');
				} else {
					parent.simulate('standaloneRemoved');
				}
			}
		});
	
		this.getConnections().forEach(function(conn) {
			conn.transitionTo({
				opacity : 0.0,
				duration : 0.3
			});
		});
	},
	
	_pressed: function() {
		if (this.transAnimCount + this.hili.transAnimCount > 0) return;
	
		if (this.isActive()) {
			if (this.getScore() == 1) {
				this._removeCircle();
			} else {
				this.decreaseScore();
				this._animatePress();
				this.toggleActive();
	
				if (this.connections() > 0) {
					this.getParent().simulate('activePressed');
				}
			}
		} else {
			this._animatePress();
			this.toggleActive();
		}
	
		this.getNeighbours().forEach(function(circle) {
			circle.toggleActive();
		});
	
		this.getParent().simulate('onePressed');
	}
}

Kinetic.Global.extend(Kinetic.GameCircle, Kinetic.Circle);
Kinetic.Node.addGettersSetters(Kinetic.GameCircle, [ 'score', 'fillValues', 'font' ]);