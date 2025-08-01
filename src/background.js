// because of absolute insanity in vanilla JS handling of the statement export or import (causing catostrophic falure as a non module script)
// you must run build_exports.sh prior to reloading/deplying - otherwise you'll get outdated versions of any needed export below... sorry
// and special thanks to manifest version 3 basically forcing single file and modules on us....

import { extensionsKnown} from "./EXPORT_options_prefs.js";
//import {} from "./EXPORT_options_prefs_helpers.js";

var tabid;
var winid;
var snapwin
var snaptab;
var usePNG = true;

var snapping = false;
var lastSnap = '';
var lsnaptabid;

function sendImageToTabSoon(tabid){
	// the iamge may not be ready....
	if( snapping ){
		console.log('deferring....');
		setTimeout(function(){
			sendImageToTabSoon(tabid);
		}, 100)
	}else{
		chrome.runtime.sendMessage({setPickerImage:snaptab,setPickerImageWin:snapwin,pickerImage:lastSnap}, function(response) {
			setTimeout(function(){lastSnap = '';}, 100)  // clearLastSnapshot
			// presumably we can clear the lastSnap here (after some time??) as optional feature.....
			// downside is refresh will now loose place unless the session cacheSnapshots mode is enabled
		});
	}
}

function goToOrOpenTab(tab, completedCallback){
  var optionsUrl = chrome.runtime.getURL(tab); // typically "options.html"
  completedCallback = completedCallback || function(){};
  chrome.tabs.query({
    url: optionsUrl,
    currentWindow: true
  }, function(tabs){
    if( tabs.length > 0 ){
      chrome.tabs.update(tabs[0].id,{active:true}, completedCallback)
      //chrome.tabs.highlight({tabs:[tabs[0].index], windowId:tabs[0].windowId}, completedCallback);
    }else{
      chrome.tabs.create({
        url: optionsUrl,
        active: true
      }, function(t){
        chrome.tabs.update(t.id,{active:true}, completedCallback)
        // chrome.tabs.highlight({tabs:[t.index]}, completedCallback)
      });
    }
  });
}


var backupTimeout = 0;
var lastExternalEnabledMessage = {};
chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
	if (sender.id === extensionsKnown.color_pick){
		if(request.isEnabled){ // from color-pick content script

			if( request.imageDataUri && (backupTimeout > 0 || request.alsoLaunch) ){ // if backupTimeout < 0 we ran out of time
				//console.log("onMessageExternal with imageDataUri: ", request, sender);
				clearTimeout(backupTimeout);

				chrome.runtime.sendMessage({notifyPopupReady:request.imageDataUri, snapWin:request.win, snapTab: request.tab, x:request.x, y:request.y}, function(response) {});

				snaptab = request.tab;
				snapwin = request.win;
				lastSnap = request.imageDataUri;
				snapping = false;
				request.imageDataUri = null; // do not need to keep this string data uri reference around in lastExternalEnabledMessage
			}

			lastExternalEnabledMessage = request;

			if( lastSnap && request.alsoLaunch ){
				// just use getURL...
				window.open("chrome-extension://"+chrome.runtime.id+"/webasm/fullscreen.html?winid="+request.win+"&tabid="+request.tab+"&startX="+request.x+"&startY="+request.y);
				sendResponse({winOpened:true});
			}else{
				sendResponse({});
			}
		}else if( request.extInactive ){
			if( backupTimeout > 0 ){
				//console.log("onMessageExternal extInactive", request, sender);

				clearTimeout(backupTimeout);
				performClassicCapture(request.win, request.tab);
			}

			sendResponse({});
		}else if( request.testAvailable ){
			sendResponse({available:true});
		}else{
			sendResponse({});
		}
	}else{
		sendResponse({});
	}
});

function performClassicCapture(snapwin, snaptab){
	var cbf=function(dataUrl){
		if(chrome.runtime.lastError){
			//console.log('ok wt...', dataUrl, chrome.runtime.lastError.message)
			chrome.runtime.sendMessage({notifyPopupOfError:1,snapWin:snapwin, snapTab: snaptab}, function(response) {});

		}else{
			// we can shrink preview before sending it.... probably a good idea...
			chrome.runtime.sendMessage({notifyPopupReady:dataUrl,snapWin:snapwin, snapTab: snaptab}, function(response) {});
		}
		lastSnap = dataUrl;
		snapping = false;
	}
	chrome.tabs.captureVisibleTab(snapwin, {format:'png'}, cbf);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	// if(sender.tab && sender.tab.id >= 0){
	// 	tabid=sender.tab.id;
	// 	winid=sender.tab.windowId;
	// }
	if(request.tabi){
		tabid=request.tabi;
	}
	if(request.snapwin){
		snapwin=request.snapwin;
	}
	if(request.snaptab){
		snaptab=request.snaptab;
	}
	if (request.getImage){

		//console.log('sending resp')
		sendResponse({noImageAvailable:!lastSnap});
		//console.log('ongoings resp')

		sendImageToTabSoon(tabid);

	}else if (request.newImage){
		//todo need desired size for getFauxSnap... we can match aspect ratio vertically
		lsnaptabid=tabid;
		snapping = true;

		if(snapwin < 1)snapwin=null;
		lastExternalEnabledMessage = {};

		// in case other ext does not respond, errors, etc... this is really a backup-backupTimeout
		backupTimeout = setTimeout(function(){
			performClassicCapture(snapwin, snaptab);
			clearTimeout(backupTimeout);
			backupTimeout = -1;
		}, 500);
		
		chrome.runtime.sendMessage(extensionsKnown.color_pick, {getActivatedStatusFromBg: true, active_tab: snaptab, active_window: snapwin }, function(response) {
			if( !response || chrome.runtime.lastError || !response.askedTheTab ){
				console.log('got back after getActivatedStatusFromBg unexpected', chrome.runtime.lastError, response);
				performClassicCapture(snapwin, snaptab); // just snap it ourselves, ColorPick extension not responding...
			}else{
				//bg pg page is alive, we await the result.... we got askedTheTab.. so wait some time....
				clearTimeout(backupTimeout);
				backupTimeout = setTimeout(function(){
					//console.log('backupTimeout fired', lastExternalEnabledMessage);
					if( lastExternalEnabledMessage.isEnabled ){
						//cbf(lastExternalEnabledMessage.imageDataUri); //lastExternalEnabledMessage.x, lastExternalEnabledMessage.y
						// we handled this already if it responded sooner... see backupTimeout
						//console.log('we seem to believe the other ext will respond with the watermark free image...')
					}else{
						performClassicCapture(snapwin, snaptab);
						backupTimeout = -1;
					}

				}, 500);
			}
		});
		sendResponse({});

	}else if(request.goToOrVisitTab){
		goToOrOpenTab(request.goToOrVisitTab);
		sendResponse({});
	}else
		sendResponse({});

});
