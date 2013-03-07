(function() {
	var _ID 	= _X = 0;
	var _ACTIVE = _Y = 1;
	var _SCORE = 2;
	var _POS = 3;
	var _CONNS = 4;
	
	var MAX_CIRCLE_SCORE = 5;
	var CIRCLE_AREA_TO_SCREEN_REL = 0.04;
	
	var ADJUST_LAYOUT_STEPS = 200;
	var READJUST_LAYOUT_STEPS = 10;
	
	var ANTI_GRAVITY = 1.25;
	var ANTI_GRAVITY_EFFECTIVE_REACH = 0.1;
	var GRAVITY = 2;
	
	var INITIAL_SCREEN = 'welcome1';
	var ANIMATE_INITIAL_ADJUST = false;
	var FLUSH_DB = false;
	
	var FONTS = 'Actor';
	var BG_COUNT = 8;
	
	var swipeDirToSlideInFromDir = {
		left : 'right',
		right : 'left',
		up : 'bottom',
		down : 'top'
	};
		
	var invertSlide = {
		left : 'right',
		right : 'left',
		top : 'bottom',
		bottom : 'top'
	};
	
	var difficultyMenuIcons = ['',
        '➊', '➋', '➌',
        '➍', '➎', '➏'
	];
	
	var levelMenuIcons = {
		none:		'',
        unseen: 	'●',
        seen: 		'○',
        exceeded: 	'★',
        solved: 	'✓',
        failed: 	'✘'
	};
	
	// event handlers
	
	var layer = {};
	var gsLayers = [];
	var actionLayers = [];
	var state = { scores: {} };
	var bgRect;
	var topCanvas;
	var levelMenuFrontContent;
	var levelMenuBackContent;
	
	var screen;
	var gameScreen;
	var menuScreen;
	var emptyScreen;
	
	var running;
	var layoutManager;

	preloadSequentialImagesFromCSS(BG_COUNT);
	whenLoadedAndReady(function() {
		if (FLUSH_DB) db.clear();
		
		gameScreen = id('game');
		menuScreen = id('menu');
		emptyScreen = id('empty-screen');
		
		loadState();
		
		initStage();
		initLayers();
		initDOM();
		
		screen = id(state.screen);
		
		if (state.game) {
			changeBg(state.bg);
			loadGame(state.game.layout);
			redraw(actionLayers);
			afterGameLoaded();
		} else {
			loadNewGame(1, 1, afterGameLoaded);
		}
	});
	whenMenuPressed(function() {
		document.onswipe(attr('role', screen) == 'menu' ? 'left' : 'right');
	});
	whenPaused(function() {
		animatePause();
	});
	whenResumed(function() {
		animateResume();
	});
	
	function afterGameLoaded() {
		
		if (!screen) {
			var splashFade = id('splash-fade');
			var splashLogo = id('splash-logo');
			
			fullShadowing(splashFade);
			bringToFront(splashLogo);
			bringBelowFront(splashFade);
			bringToMiddle(emptyScreen);
			
			delay(1, function() {
				transition(splashLogo, 'opacity', 1, 'graceful', function() {
					delay(1, function() {
						normalShadowing(topCanvas);
						
						transition(splashLogo, 'opacity', 0, 'graceful', function() {
							sendToBack(splashLogo);
		
							saveState({ screen : INITIAL_SCREEN });
							screen = id(state.screen);
							
							bringToMiddle(screen);
							
							normalShadowing(splashFade, 'graceful', function() {
								sendToBack(splashFade);
								normalShadowing(emptyScreen);
		
								bringToFront(screen);
								
								running = true;
							});
						});
					});
				});
			});
		} else {
			bringToFront(screen);
			bringToMiddle(emptyScreen);
			
			delay(0.2, function() {
				normalShadowing(topCanvas, 'slow');
				normalShadowing(emptyScreen, 'fast');
			});
			
			running = true;
		}
	}
	
	function saveState(vars) {
		
		if (vars) {
			for (var k in vars) {
				state[k] = vars[k];
			}
		}
		
		db.state = JSON.stringify(state);
	}
	
	function loadState() {
		
		var s = db.state;
		
		if (s) {
			state = eval('(' + s + ')');
		}
	}
	
	function saveGameState() {
		
		state.game.layout = [];
		
		layer.circles.getChildren().forEach(function(circle) {
			var c = {};
			
			c[_ID] = circle.getName();
			c[_ACTIVE] = circle.isActive() ? 1 : 0;
			c[_SCORE] = circle.getScore();
			c[_POS] = {};
			c[_POS][_X] = circle.getX() / stage.w * 100;
			c[_POS][_Y] = circle.getY() / stage.h * 100;
			c[_CONNS] = [];
			
			circle.getOwnNeighbours().forEach(function(conn) {
				c[_CONNS].add(conn.getName());
			});
			
			state.game.layout.add(c);
		});
		
		saveState();
	}
	
	function redraw(layers) {
		
		layers.forEach(function(l) {
			l.draw();
		});
	}
	
	function changeBg(bgId) {
		
		if (!bgId) {
			bgId = Rand.i(1, img.count);
			state.bg = bgId;
		}
		
		bgRect.setFill({ image : img[bgId] });
		layer.bg.draw();
	}
	
	function sendToBack(s) {
		
		s.style.zIndex = 0;
	}
	
	function bringToMiddle(s) {
		
		s.style.zIndex = 5;
	}
	
	function bringBelowFront(s) {
		
		s.style.zIndex = 9;
	}
	
	function bringToFront(s) {
		
		s.style.zIndex = 10;
	}
	
	function animateMessage(msg) {

		msg = id(msg);

		animate(msg, 'fade-in-out', function() {
			sendToBack(msg);
		});
		
		bringToFront(msg);
	}
	
	var imageData = [];
	
	function animateGrayscaling(animTime, animStep, out) {
		var pct = 0;
		var animSteps = animTime / animStep;
		
		var loopId = setInterval(function() {
			pct += 1 / animSteps;
			
			gsLayers.forEach(function(l, i) {
				Kinetic.Filters.Grayscale(imageData[i], out ? 1 - pct : pct);

				l.getContext().putImageData(imageData[i], 0, 0);
			});
			
			if (pct >= 1.0) {
				clearInterval(loopId);
			}
		}, animStep);
	}
	
	function animatePause(callback) {
		
		gsLayers.forEach(function(l, i) {
			imageData[i] = l.getContext().getImageData(0, 0, stage.w, stage.h);
			imageData[i].origData = clone(imageData[i].data);
		});
		
		animateGrayscaling(1000, 100);

		strongShadowing(topCanvas, 'fast', callback);
	}
	
	function animateResume(callback) {
		
		animateGrayscaling(500, 100, true);
		
		normalShadowing(topCanvas, 'fast', callback);
	}
	
	function animateMenuItemClick(item, menu, nextMenu, callback) {
		
		animate(menu, 'fade-out', callback);
		each(all('[index="' + attr('index', item) + '"]:not([layer=click])', item.parentNode), function(d) {
			animate(d, 'change-color');
		});
		if (nextMenu) animate(nextMenu, 'fade-in');
	}
	
	function shadowing(el, speed, b, s, a, c) {
		
		var val = '0px 0px ' + stage.padding * b + 'px ' + stage.padding * s + 'px rgba(0,0,0,' + a + ') inset';
		
		if (!speed) {
			el.style.boxShadow = val;
		} else {
			transition(el, 'boxShadow', val, speed, c);
		}
	}
	
	function fullShadowing(el, speed, callback) {
		
		shadowing(el, speed, 200, 20, 1, callback);
	}
	
	function strongShadowing(el, speed, callback) {
		
		shadowing(el, speed, 23, 6, 0.9, callback);
	}
	
	function normalShadowing(el, speed, callback) {
		
		shadowing(el, speed, 3, 1, 0.7, callback);
	}
	
	function noShadowing(el, speed, callback) {
		
		shadowing(el, speed, 0, 0, 0, callback);
	}
	
	document.onswipe = function(dir) {
		
		if (!running || animating) return;
		
		var slideInFrom = swipeDirToSlideInFromDir[dir];
		var slideTo = invertSlide[slideInFrom];

		if (attr('role', screen) == 'menu') {
			animate(screen, 'slide-to-' + slideTo, function() {
				sendToBack(screen);
				
				screen = gameScreen;
			});
			
			animateResume();
		} else {
			var nextScreen = attr(slideInFrom, screen);
		
			if (nextScreen) {
				nextScreen = id(nextScreen);
	
				if (attr('role', nextScreen) == 'menu') {
					if (Kinetic.Animation.animRunning) return;
					
					animatePause();
					
					animate(nextScreen, 'slide-from-' + slideInFrom, function() {
						if (!state.difficultyMenuShown) {
							saveState({ difficultyMenuShown: true });
							animateMessage('choose-difficulty');
						}
						
						screen = nextScreen;
					});
				} else {
					saveState({ screen: nextScreen.id });
					
					animate(screen, 'slide-to-' + slideTo);
					animate(nextScreen, 'slide-from-' + slideInFrom, function() {
						sendToBack(screen);

						screen = nextScreen;
						
						if (!state.gameShown && screen.id == 'game') {
							layer.notifications.simulate('showMenuHint');
						}
					});
					
					var afterNextScreen = attr(slideInFrom, nextScreen);

					if (afterNextScreen) {
						afterNextScreen = id(afterNextScreen);
						
						if (attr('role', afterNextScreen) == 'screen') {
							bringToFront(afterNextScreen);
							
							animate(afterNextScreen, 'slide-from-' + slideInFrom + '-next', function() {
								sendToBack(afterNextScreen);
							});
						}
					}
				}
				
				bringToFront(nextScreen);
			} else {
				animate(screen, 'swipe-' + slideTo + '-blocked');
			}
		}
	};
	
	// init
	
	function loadNewGame(d, l, callback) {
		
		//loadJs('level/' + d + '/' + l, function(data) {
			changeBg();
			var levelCode = d + '-' + l;
			var data = LEVEL[levelCode];
			var prevScore = state.scores[levelCode];
			if (prevScore == null) state.scores[levelCode] = 0;
			loadGame(data.layout);
			saveState({ turnsMade: 0, level: levelCode, game: data });
			
			if (callback && ANIMATE_INITIAL_ADJUST) callback();
			
			layoutManager.run(ADJUST_LAYOUT_STEPS, ANIMATE_INITIAL_ADJUST);
			
			if (callback && !ANIMATE_INITIAL_ADJUST) callback();
		//});
	}
	
	function loadGame(data) {
		
		stage.getChildren().forEach(function(l) {
			if (l != layer.bg) {
				l.removeChildren();
			}
		});
	
		initCircles(data);
		connectCircles(data);
		setLevelMenuIcons();
		
		layoutManager = new ForceDirectedLayout({
			circles: layer.circles.getChildren(),
			padding: stage.padding,
			width: stage.w,
			height: stage.h,
			antiGravity: stage.perimeter * ANTI_GRAVITY,
			antiGravityEffectiveReach: stage.perimeter * ANTI_GRAVITY_EFFECTIVE_REACH,
			gravity: GRAVITY,
			redrawFunc: function() {
				redraw(actionLayers); 
			},
			onComplete: function() {
				saveGameState();
			}
		});
	}
	
	function animateGameOver(msg1, n, msg2) {
		msg1 = id(msg1);
		msg2 = id(msg2);
		
		var msgContent = msg1.innerHTML;
		
		if (n) {
			msg1.innerHTML = msgContent.replace('#', n);
		}
		
		animate(msg1, 'fade-in', function() {
			delay(5, function() {
				animate(msg1, 'fade-out', function() {
					sendToBack(msg1);
					msg1.innerHTML = msgContent;
				});
				animate(msg2, 'fade-in', function() {
					delay(2, function() {
						animate(msg2, 'fade-out', function() {
							sendToBack(msg2);
						});
						
						bringToFront(menuScreen);
						bringToFront(msg2);
						animate(menuScreen, 'fade-in');
						
						screen = menuScreen;
					});
				});
				bringToFront(msg2);
				bringToFront(msg1);
			});
		});
		
		bringToFront(msg1);
	}
	
	function gameOver() {
		
		running = false;
		var turns = state.turnsMade;
		var solution = state.game.solution;
		var score = solution / turns;
		state.scores[state.levelCode] = score;
		saveState();
		
		animatePause(function() {
			if (score < 1) {
				animateGameOver('failed', turns - solution, 'after-failed');
			} else if (score > 1) {
				animateGameOver('exceeded', solution - turns, 'after-solved');
			} else {
				animateGameOver('solved', '', 'after-solved');
			}
		});
	}
	
	var difficultySelected;
	
	function difficultyMenuItemPressed(evt) {
		
		if (animating) return;
		
		difficultySelected = attr('index', evt.target);
		var nextScreen = id('menu-difficulty-' + difficultySelected);
		
		animateMenuItemClick(evt.target, screen, nextScreen, function() {
			sendToBack(screen);

			screen = nextScreen;
			
			if (!state.levelMenuShown) {
				saveState({ levelMenuShown: true });
				
				animateMessage('choose-level');
			}
		});

		bringToFront(nextScreen);
		bringToFront(screen);
	}
	
	function levelMenuItemPressed(evt) {
		
		if (animating) return;

		var levelSelected = attr('index', evt.target);
		
		running = false;
		
		animateMenuItemClick(evt.target, screen, null, function() {
			sendToBack(screen);

			screen = gameScreen;
			
			fullShadowing(topCanvas, 'fast', function() {
				loadNewGame(difficultySelected, levelSelected, afterGameLoaded);
			});
		});
	}
	
	function initStage() {
		
		stage = new Kinetic.Stage({
			container : 'game',
			width : 800,//window.innerWidth,
			height : 480//window.innerHeight
		});
	
		stage.w = stage.getWidth();
		stage.h = stage.getHeight();
		stage.area = stage.w * stage.h;
		stage.perimeter = 2 * (stage.w + stage.h);
		stage.minSide = Math.min(stage.w, stage.h);
		stage.maxSide = Math.max(stage.w, stage.h);
		stage.padding = Math.ceil(stage.perimeter / 200);
	}
	
	function initLayers() {
		
		stage.add(layer.bg = new Kinetic.Layer());
		stage.add(layer.connections = new Kinetic.Layer());
		stage.add(layer.highlights = new Kinetic.Layer());
		stage.add(layer.circles = new Kinetic.Layer());
		stage.add(layer.notifications = new Kinetic.Layer());

		gsLayers = [ layer.bg, layer.circles, layer.connections ];
		actionLayers = [ layer.circles, layer.connections ];
		topCanvas = one('canvas:last-child');
		bgRect = new Kinetic.Rect({
			width: stage.w,
			height: stage.h
		});
		
		layer.bg.add(bgRect);
		
		layer.notifications.on('showMenuHint', function() {
			saveState({ gameShown: true });
			
			var text = new Kinetic.Text({
				width: stage.w,
				height: stage.h,
				opacity: 0,
				text: id('menu-hint').innerHTML.trim(),
				fontSize: stage.h / 9,
				fontStyle: 'bold',
				fontFamily: FONTS,
				textFill: 'white',
				align: 'center',
				listening: false,
				shadow: {
					offset: [5, 5],
					opacity: 0.3
				}
			});
			
			text.setY((stage.h - text.getTextHeight()) / 2);
			
			var arrowConf = {
				radius: stage.w / 6,
				scale: {
					x : 1,
					y : 0.3
				},
				opacity: 0,
				sides: 3,
				fill: 'white'
			};
			
			arrowConf.x = stage.w / 2;
			arrowConf.y = stage.h * 0.1;
			
			var topArrow = new Kinetic.RegularPolygon(arrowConf);
			
			arrowConf.x = stage.w * 0.93;
			arrowConf.y = stage.h / 2;
			arrowConf.rotationDeg = 90;
			
			var rightArrow = new Kinetic.RegularPolygon(arrowConf);
			
			arrowConf.x = stage.w / 2;
			arrowConf.y = stage.h * 0.9;
			arrowConf.rotationDeg = 180;
			
			var bottomArrow = new Kinetic.RegularPolygon(arrowConf);
			
			layer.notifications.add(text);
			layer.notifications.add(topArrow);
			layer.notifications.add(rightArrow);
			layer.notifications.add(bottomArrow);
			
			layer.notifications.getChildren().forEach(function(n) {
				n.transitionTo({
					opacity: 0.9,
					duration: 1,
					callback: function() {
						delay(1.5, function() {
							n.transitionTo({
								opacity: 0,
								duration: 1,
								callback: function() {
									n.remove();
								}
							});
						});
					}
				});
			});
		});
		
		layer.circles.on('onePressed', function() {
			state.turnsMade++;
			saveGameState();
	
			var pos = stage.getUserPosition();
			var text = new Kinetic.Text({
				x: pos.x,
				y: pos.y,
				scale : {
					x : 0.01,
					y : 0.01
				},
				opacity: 0.8,
				text: state.turnsMade,
				fontSize: stage.h / 3.2,
				fontStyle: 'bold',
				fontFamily: FONTS,
				textFill: 'white',
				listening: false,
				shadow: {
					offset: [5, 5],
					opacity: 0.3
				}
			});
			
			var l = layer.notifications;
			l.add(text);
			
			var initialScale = 1.3;
			var finalScale = 1.0;
			var yAdjust = 0.8;
			
			text.transitionTo({
				scale : {
					x: initialScale,
					y: initialScale
				},
				x : (stage.w - text.getTextWidth() * initialScale) / 2,
				y : (stage.h - text.getTextHeight() * yAdjust * initialScale) / 2,
				duration : 0.4,
				easing: 'ease-out',
				callback : function() {
					text.transitionTo({
						scale : {
							x: finalScale,
							y: finalScale
						},
						x : (stage.w - text.getTextWidth() * finalScale) / 2,
						y : (stage.h - text.getTextHeight() * yAdjust * finalScale) / 2,
						opacity : 0.0,
						duration : 0.6,
						callback : function() {
							text.off('click tap');
							text.remove();
						}
					});
				}
			});
		});
		
		layer.circles.on('standaloneRemoved', function() {
			saveGameState();
			
			if (layer.circles.getChildren().length === 0) {
				gameOver();
			}
		});
		
		layer.circles.on('connectedRemoved', function() {
			saveGameState();
			layoutManager.run(READJUST_LAYOUT_STEPS, true);
		});
		
		layer.circles.on('activePressed', function() {
			layoutManager.run(READJUST_LAYOUT_STEPS, true);
		});
	}
	
	function setLevelMenuIcons() {
		
		each(all('[id^=menu-difficulty-]'), function(d, i) {
			var difficulty = i + 1;
			var topIconNames = {};
			var topIcons = {};
			var bottomIconNames = {};
			var bottomIcons = {};
			var levelMenu = id('menu-difficulty-' + difficulty);
			
			each(levelMenu.children, function(mi) {
				var level = attr('index', mi);
				var layer = attr('layer', mi);
				var score = state.scores[difficulty + '-' + level];
				
				if (layer == 'top') {
					topIconNames[level] = score == null ? 'unseen' : 'seen';
					topIcons[level] = levelMenuIcons[topIconNames[level]];
				} else if (layer == 'bottom') {
					var icn;
					
					if (!score) {
						icn = 'none';
					} else if (score == 1) {
						icn = 'solved';
					} else if (score < 1) {
						icn = 'failed';
					} else if (score > 1) {
						icn = 'exceeded';
					}
					
					bottomIconNames[level] = icn; 
					bottomIcons[level] = levelMenuIcons[icn];
				}
			});
			
			setMenuIcons(levelMenu, 'top', topIcons, topIconNames);
			setMenuIcons(levelMenu, 'bottom', bottomIcons, bottomIconNames);
		});
	}
	
	function setMenuIcons(menu, layer, icons, iconNames) {
		
		each(all('#' + menu.id + ' [layer=' + layer + ']'), function(mi) {
			var i = attr('index', mi);
				
			mi.innerHTML = icons[i];
			if (iconNames) mi.setAttribute('icon', iconNames[i]);
		});
	}
	
	function initMenuItems(menu, layer, whenPressed) {
		
		var rows = toNumber(attr('row', menu));
		var cols = toNumber(attr('col', menu));
		var w = stage.w / cols;
		var h = stage.h / rows;
		
		for (var i = 0, r = 0, c = 0, n = rows * cols; i < n; i++) {
			var menuItem = document.createElement('div');

			if (whenPressed) bind(menuItem, 'click tap', whenPressed);
			if (layer) menuItem.setAttribute('layer', layer);
			
			menuItem.setAttribute('index', i + 1);
			menuItem.style.left = c * w + 'px';
			menuItem.style.top = r * h + 'px';
			menuItem.style.width = w + 'px';
			menuItem.style.height = h + 'px';
		
			if (++c % cols === 0) {
				c = 0;
				r++;
			}
					
			menu.appendChild(menuItem);
		}
	}
	
	function initDOM() {
		
		document.body.style.fontFamily = FONTS;
		document.body.style.fontSize = stage.h / 12 + 'px';
		
		var logoSize = stage.h - stage.padding * 2;
		id('splash-logo').style.backgroundSize = logoSize + 'px ' + logoSize + 'px';
		
		each(all('body > div'), function(d) {
			d.style.width = stage.w + 'px';
			d.style.height = stage.h + 'px';
		});

		initMenuItems(menuScreen, 'top');
		initMenuItems(menuScreen, 'click', difficultyMenuItemPressed);
		setMenuIcons(menuScreen, 'top', difficultyMenuIcons);
		
		each(all('[id^=menu-difficulty-]'), function(m) {
			initMenuItems(m, 'bottom');
			initMenuItems(m, 'top');
			initMenuItems(m, 'click', levelMenuItemPressed);
		});
	}
	
	function initCircles(levelData) {
		
		var maxRadius = Math.floor(Math.sqrt(stage.area * CIRCLE_AREA_TO_SCREEN_REL / Math.PI)) - 1;
		
		levelData.forEach(function(circle) {
			layer.circles.add(new Kinetic.GameCircle({
				name : circle[_ID] + '',
				x : circle[_POS][_X] / 100 * stage.w,
				y : circle[_POS][_Y] / 100 * stage.h,
				active : circle[_ACTIVE] == 1,
				score : circle[_SCORE],	
				stroke : 'black',
				font : FONTS,
				colors : {
					active : Color(0, 153, 0),
					passive : Color(178, 34, 34)
				},
				gradientFactors : {
					center : 1.2,
					border : 0.3
				},
				radiusFunc : function(s) { return maxRadius * Math.sqrt(s / MAX_CIRCLE_SCORE) },
				highlight : {
					layer : layer.highlights,
					overlap : 1.2,
					color : Color(255, 215, 0)
				},
				connection : {
					layer : layer.connections,
					color : '#ffd700',
					stroke : 'rgba(20,20,20,0.8)',
					strokeWidth : 0.5,
					stretchMarker : {
						minCount : 4,
						maxStretch : 1,
						radius : stage.padding / 2
					}
				}
			}));
		});
	}
	
	function connectCircles(levelData) {
		
		levelData.forEach(function(circle) {
			var v = stage.get('.' + circle[_ID])[0];
			
			circle[_CONNS].forEach(function(conn) {
				var u = stage.get('.' + conn)[0];
				
				v.connect(u);
			});
		});
	}
})();