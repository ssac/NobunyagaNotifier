﻿
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-39548375-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


(function () {
	var websiteTW = "http://nyaframe.wasabii.com.tw/index.aspx";
	var websiteJP = "http://yahoo-mbga.jp/game/*/play";
	var websiteCN = "http://86game.com/GameIndex.aspx*"
	var queryInfoTW = { url: websiteTW };
	var queryInfoJP = { url: websiteJP };
	var queryInfoCN = { url: websiteCN };
	var config = {};
	var onlineTrackInterval = 1000 * 60 * 3;
	var onlineTrackId = null;
	window.config = config;

	/*
		read from localstorage and set config
	*/
	function initSettings() {
		config.isVoiceNotify = (localStorage['isVoiceNotify']) ? convertStrBool(localStorage['isVoiceNotify']) : false;
		config.isBuildNotify = (localStorage['isBuildNotify']) ? convertStrBool(localStorage['isBuildNotify']) : false;
		config.isPrepareNotify = (localStorage['isPrepareNotify']) ? convertStrBool(localStorage['isPrepareNotify']) : false;
		config.isSkillNotify = (localStorage['isSkillNotify']) ? convertStrBool(localStorage['isSkillNotify']) : false;
		config.isSoakNotify = (localStorage['isSoakNotify']) ? convertStrBool(localStorage['isSoakNotify']) : false;
		config.isFoodNotify = (localStorage['isFoodNotify']) ? convertStrBool(localStorage['isFoodNotify']) : false;
		config.isQuestNotify = (localStorage['isQuestNotify']) ? convertStrBool(localStorage['isQuestNotify']) : false;
		config.isFireNotify = (localStorage['isFireNotify']) ? convertStrBool(localStorage['isFireNotify']) : false;
		config.isLandNotify = (localStorage['isLandNotify']) ? convertStrBool(localStorage['isLandNotify']) : false;
		config.isWindNotify = (localStorage['isWindNotify']) ? convertStrBool(localStorage['isWindNotify']) : false;
		config.isWaterNotify = (localStorage['isWaterNotify']) ? convertStrBool(localStorage['isWaterNotify']) : false;
		config.isSkyNotify = (localStorage['isSkyNotify']) ? convertStrBool(localStorage['isSkyNotify']) : false;
		config.isNohomeNotify = (localStorage['isNohomeNotify']) ? convertStrBool(localStorage['isNohomeNotify']) : false;
		config.isBrowserNotify = (localStorage['isBrowserNotify']) ? convertStrBool(localStorage['isBrowserNotify']) : true;
		config.isDesktopNotify = (localStorage['isDesktopNotify']) ? convertStrBool(localStorage['isDesktopNotify']) : true;

		// this volume is the notification sound volume
		config.volume = (localStorage['volume']) ? parseFloat(localStorage['volume']) : 1;
	}


	/*
		function to set config calling from popup.html
		name (string): config name
		flag (boolean): config value
	*/
	function setConfig(name, flag) {
		config[name] = flag;
		localStorage[name] = flag;
	}
	window.setConfig = setConfig;


	function openlink(url) {
		chrome.tabs.create({
			url: url
		});
	}
	window.openlink = openlink;


	/*
		call function from popup.html
		bool == true: increase volume by 0.1
		bool == false: decrease volume by 0.1
	*/
	function modifyVolume(bool) {
		if (bool) {
			if (config.volume < 1) {
				config.volume = parseFloat((config.volume + 0.1).toFixed(1));
				localStorage['volume'] = config.volume;
			}
		}
		else {
			if (config.volume > 0) {
				config.volume = parseFloat((config.volume - 0.1).toFixed(1));
				localStorage['volume'] = config.volume;
			}
		}
	}
	window.modifyVolume = modifyVolume;


	// game tab to keep tracking the current playing game
	var target;


	// flag whether the game is executing
	var isInGame = false;


	// function called from popup.html
	// to check if the user has entered the game
	function ifInGame() {
		return isInGame;
	}
	window.ifInGame = ifInGame;


	// function called from popup.html
	// to get the volume of config
	function getVolume() {
		return config.volume;
	}
	window.getVolume = getVolume;


	// notification-related variable
	var notification;
	var isNotificationShown = false;
	var lastText = "";
	var firstTimeToNotifyNohome;
	var nohomeDelay = 3000;
	var isLastTimeShowNohome = false;

	// when this is true, the debug msg will display in console of background.html
	var isDebug = true;

	function debug(content) {
		if (isDebug) {
			console.log(content);
		}
	}


	function ifInNoShowNohomePeriond() {
		return !((new Date().getTime()) - firstTimeToNotifyNohome > nohomeDelay);
	}


	// since localStorage only save string value, the extension has to convert string to value manually
	function convertStrBool(str) {
		return (str === 'true');
	}


	function setGameConnected(tab) {
		chrome.browserAction.setBadgeBackgroundColor({ color: [0, 255, 0, 255] });
		chrome.browserAction.setBadgeText({ text: "ok" });

		target = tab;
		isInGame = true;
	}


	function setGameUnconnected() {
		chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
		chrome.browserAction.setBadgeText({ text: "...." });

		target = null;
		isInGame = false;

		if (isNotificationShown) {
			notification.cancel();
			isNotificationShown = false;
		}

		onlineTrack(false);
	}


	function ifShowNohome() {
		var currentTime = new Date().getTime();
		return ((currentTime - firstTimeToNotifyNohome) > nohomeDelay)
	}


	function initListeners() {
		// when user close the tab, reset variables for next tab to open game
		chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
			if (isInGame && tabId == target.id) {
				console.log("Game Tab is Closing.");
				setGameUnconnected();
			}
		});

		/*
			ask == 1: game leave
			ask == 2: game update
			ask == 3: game enter
		*/
		chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
			if (request.ask === 2) {
				// this background page is not supposed to received ask=2 message while it has not connect to game, print the error
				if (!isInGame) {
					console.log("Received DOM update while the game is not connected");
					return;
				}

				handleUpdate(request);

				// ask cs.js update data
				if (target) {
					chrome.tabs.sendRequest(target.id, { ask: 1 });
				}
			}
			else if (request.ask === 1) {
				if (isInGame && sender.tab.id === target.id) {
					console.log("Game Leaving");
					setGameUnconnected();
				}
			}
			else if (request.ask === 3) {
				if (!isInGame) {
					console.log("Game Connecting...");
					setGameConnected(sender.tab);
					console.log("Game Connected.");
					sendResponse({ans: true});
				}
				else {
					console.log("Game can not connect because the extension is monitoring a game currently.");
					sendResponse({ans: false});
				}
			}
		});
	}


	function onlineTrack(startOrEnd) {
		if (startOrEnd) {
			onlineTrackId = window.setInterval( function(){
				_gaq.push(['_trackEvent', 'Online', 'Online Track']);
				console.log('tracking...');
			}, onlineTrackInterval);
		}
		else {
			if (onlineTrackId) {
				window.clearInterval(onlineTrackId);
				_gaq.push(['_trackEvent', 'Offline', 'Online Track']);
			}
		}
	}


	function notifyPlayer(text) {
		// browser notification, not implemented yet
		if (config.isBrowserNotify) browserNotification();

		// notification only shown when the notification has not shown yet
		if (config.isDesktopNotify) desktopNotification(text);

		_gaq.push(['_trackEvent', text, 'Notification']);
	}


	// notify user by browser action icon
	function browserNotification() {
		// no intent to implement this function by now
	}


	// notify user by chrome notification
	function desktopNotification(text) {
		// notification = webkitNotifications.createNotification("icon/notification.png", 'nyaNotifier', text);
		notification = chrome.notifications.create('nyaNotifier', {
			type: "basic",
			title: "nyaNotifier",
			message: text,
			iconUrl: "icon/notification.png"
		}, function () {});

		notification.ondisplay = function () {
			isNotificationShown = true;
		}

		notification.onclose = function () {
			isNotificationShown = false;
		}

		// when user click the notification, focus the game
		notification.onclick = function () {
			if (target) {
				chrome.windows.update(target.windowId, { focused: true });
				chrome.tabs.update(target.id, { active: true });
			}
		}

		notification.show();

		// the reason for re-claim this (compare to notification.ondisplay event, same statement) is
		// in browser fullscreen mode, notification.ondisplay event
		// does not trigger. it's still workable for deleting notification.ondisplay event statement and
		// only leave this statement. I leave the ondisplay event statement for further reference.
		isNotificationShown = true;

		// play notice voice if the user set this
		if (config.isVoiceNotify) {
			var voice = document.getElementById("notice_voice");
			voice.volume = config.volume;
			voice.play();
		}
	}


	// decide whether to show notification according to user settings
	function handleUpdate(msg) {

		var rsp = msg.content;
		var text = "";
		var show = false;

		if (rsp.nohome && config.isNohomeNotify && !rsp.quest && config.isQuestNotify) {
			// if this is the first time to detect no home msg, update the first time to notify no home
			if (!isLastTimeShowNohome) {
				firstTimeToNotifyNohome = new Date().getTime();
			}

			if (!ifInNoShowNohomePeriond()) {
				text += "里 ";
				show = true;
			}

			isLastTimeShowNohome = true;
		}
		else {
			isLastTimeShowNohome = false;
		}

		if (rsp.quest && config.isQuestNotify) {
			text += "賊/合/場 ";
			show = true;
		}

		if (rsp.build && config.isBuildNotify) {
			text += "建 ";
			show = true;
		}

		if (rsp.prepare && config.isPrepareNotify) {
			text += "準 ";
			show = true;
		}

		if (rsp.skill && config.isSkillNotify) {
			text += "奧 ";
			show = true;
		}

		if (rsp.soak && config.isSoakNotify) {
			text += "湯 ";
			show = true;
		}

		if (rsp.food && config.isFoodNotify) {
			text += "糧 ";
			show = true;
		}

		if (rsp.fire && config.isFireNotify) {
			text += "火 ";
			show = true;
		}

		if (rsp.land && config.isLandNotify) {
			text += "地 ";
			show = true;
		}

		if (rsp.wind && config.isWindNotify) {
			text += "風 ";
			show = true;
		}

		if (rsp.water && config.isWaterNotify) {
			text += "水 ";
			show = true;
		}

		if (rsp.sky && config.isSkyNotify) {
			text += "空 ";
			show = true;
		}

		if (show) {
			if (!isNotificationShown) {
				notifyPlayer(text);
			}
			else {

				// only notify user when the notification text had changed
				if (text != lastText) {

					if (notification) {
						notification.cancel();
					}

					// this double check ensure no duplicate notification shown when chrome browser
					// busy (this program can chrome close notification are running asynchronize,
					// chrome may not trigger notification.onclose in time)
					// but the communication between bg.js and cs.js keep running.
					if (!isNotificationShown) {
						notifyPlayer(text);
					}
				}
			}

			lastText = text;
		}
		else {
			if (isNotificationShown) {
				notification.cancel();
			}
		}
    }


	function start() {
		// exit if localStorage is not supported
		if (!window.localStorage) {
			console.log("The browser does not support localStorage, it's going to exit.");
			return;
		}

		setGameUnconnected();

		// only work under one game
		chrome.tabs.query(queryInfoTW, function(arrtabsTW) {

			chrome.tabs.query(queryInfoJP, function(arrtabsJP){

				chrome.tabs.query(queryInfoCN, function(arrtabsCN) {

					if (arrtabsTW.length + arrtabsJP.length + arrtabsCN.length === 1) {
						var gameTabID = null;

						if (arrtabsTW.length === 1) {
							gameTabID = arrtabsTW[0].id;
							_gaq.push(['_trackEvent', 'Taiwan', 'Playing Server']); // google analytic track
						}
						else if (arrtabsJP.length === 1) {
							gameTabID = arrtabsJP[0].id;
							_gaq.push(['_trackEvent', 'Japan', 'Playing Server']); // google analytic track
						}
						else if (arrtabsCN.length === 1) {
							gameTabID = arrtabsCN[0].id;
							_gaq.push(['_trackEvent', 'China', 'Playing Server']); // google analytic track
						}

						onlineTrack(true);
						chrome.tabs.reload(gameTabID);
					}
					else {

						if (arrtabsTW.length === 0 && arrtabsJP.length === 0 && arrtabsCN.length === 0) {
							console.log("Detect no game running, the extension is not going to operate untill new game found.");
						}

						if (arrtabsTW.length > 1 || arrtabsJP.length > 1 || arrtabsCN.length > 1) {
							console.log("Detect more than one game running, the extension is not going to operate.");
						}

						setGameUnconnected();
					}

				});
			});
		});
	}
	window.start = start;

	initSettings();
	initListeners();
	start();

})();