var tabid, winid;
var snapwin, snaptab;
var usePNG = true;

var snapping = false;
var lastSnap = '';

function sendImageToTabSoon(tabid){
	// the iamge may not be ready....
	console.log('snapping results ready soon?' , lastSnap)
	if( snapping ){
		console.log('deferring....');
		setTimeout(function(){
			sendImageToTabSoon(tabid);
		}, 100)
	}else{
		chrome.runtime.sendMessage({setPickerImage:snaptab,setPickerImageWin:snapwin,pickerImage:lastSnap}, function(response) {});
	}
}

function goToOrOpenTab(tab, completedCallback){
  var optionsUrl = chrome.extension.getURL(tab); // typically "options.html"
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

// // Make a simple request:
// chrome.runtime.sendMessage(laserExtensionId, {getTargetData: true},
//   function(response) {
//     if (targetInRange(response.targetData))
//       chrome.runtime.sendMessage(laserExtensionId, {activateLasers: true});
//   });

chrome.runtime.onMessageExternal.addListener( function(request, sender, sendResponse){
    // if (sender.id == blocklistedExtension)
    //   return;  // don't allow this extension access
    // else if (request.getTargetData)
    //   sendResponse({targetData: targetData});
    // else if (request.activateLasers) {
    //   var success = activateLasers();
    //   sendResponse({activateLasers: success});
    // }

    sendResponse({});
});

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

		console.log('sending resp')
		sendResponse({});
		console.log('ongoings resp')

		sendImageToTabSoon(tabid);

	}else if (request.newImage){
		//todo need desired size for getFauxSnap... we can match aspect ratio vertically
		lsnaptabid=tabid;
		snapping = true;
		console.log('got new img...')
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
		if(chrome.runtime.lastError)console.log('pre existing err?', chrome.runtime.lastError.message);
		if(winid < 1)winid=null;
		chrome.tabs.captureVisibleTab(winid, {format:'png'}, cbf);
		if(chrome.runtime.lastError){
			sendResponse({errorSnapping: true, message: chrome.runtime.lastError.message});
		}else{
			sendResponse({});
		}
	}else if(request.goToOrVisitTab){
		goToOrOpenTab(request.goToOrVisitTab);
		sendResponse({});
	}else
		sendResponse({});

});
