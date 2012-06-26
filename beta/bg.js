
(function () {

    var website = "http://nyaframe.wasabii.com.tw/index.aspx";
    var queryInfo = {url: website};

	// read the setting of localStorage
    var config = new Object();
    window.config = config;
	
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
	}

	
    /*
    name (string): config name
    flag (boolean): config value
    */
    function setConfig(name, flag) {
        config[name] = flag;
        localStorage[name] = flag;
    }
    window.setConfig = setConfig;
	
	
	// direct user to the webpage of this extension, for them to vote
	function vote() {
		chrome.tabs.create({
			url: "https://chrome.google.com/webstore/detail/oeocjccojaaoejnphdledmkpjmnkflfi"
		});
	}
	window.vote = vote;
	

    // game tab
    var target;

    // flag whether the game is executing
    var isInGame = false;
	
	function ifInGame() {
		return isInGame;
	}
	window.ifInGame = ifInGame;

    //
    var notification;
    var isNotificationShown = false;
    var lastText;


    function convertStrBool(str) {
        return (str === 'true') ? true : false;
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
        }
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
			//console.log(request);

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


    function notifyPlayer(text) {
        if (config.isBrowserNotify) browserNotification();

        // notification only shown when the notification has not shown yet
        if (config.isDesktopNotify) {
            desktopNotification(text);
        }
    }


	// notify user by browser action icon
    function browserNotification() {
		// no intent to implement this function by now
    }


	// notify user by chrome notification
    function desktopNotification(text) {
        notification = webkitNotifications.createNotification("icon/notification.png", '信喵之野望通知', text);

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
		
		// play notice voice if the user set this
		if (config.isVoiceNotify) {
			var voice = document.getElementById("notice_voice");
			voice.play();
		}
    }


    function handleUpdate(msg) {
        //port.postMessage({ask: 1});

        var rsp = msg.content;
        var text = "";
        var show = false;
		
		if (rsp.nohome && config.isNohomeNotify && !rsp.quest && config.isQuestNotify) {
			text += "里 ";
			show = true;
		}

        if (rsp.quest && config.isQuestNotify) {
            text += "賊/合 ";
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
            text += "泉 ";
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


        // exit if no update need to be notified
        if (show) {

            if (isNotificationShown == false) {
                notifyPlayer(text);
            }
            else {

                if (text != lastText) {
                    notification.cancel();

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
		
		initSettings();
		initListeners();
		
		setGameUnconnected();
		
		chrome.tabs.query(queryInfo, function(arrtabs) {
			// only work under one game running
			if (arrtabs.length === 1) {
				// reload the game to insert latest content scripts
				chrome.tabs.reload(arrtabs[0].id);
			}
			else {
				if (arrtabs.length > 1) {
					console.log("Detect more than one game running, the extension is not going to operate.");
				}
				else {
					console.log("Detect no game running, the extension is not going to operate.");
				}
				
				setGameUnconnected();
				return;
			}
		});
	}
	
	start();

})();