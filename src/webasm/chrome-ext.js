var tabid, winid;
var preReqLoaded = false;
var settingsState = {};

var hash = {};

var externalFullExtHistoryString = null; // not up to date, just for one time use at load

function parseHash(){
	var parts = window.location.search.replace(/^\?/,'&').split('&');
	for( var i=0; i<parts.length; i++ ){
		var kv=parts[i].split('=');
		if( kv[0] ){
			hash[kv[0]] = kv[1];
		} 
	}
}

function start(){
	parseHash();
	winResized();

	//console.log('winlochash: ', hash);

	chrome.windows.getCurrent(function(window){
		winid = window.id;
		chrome.tabs.query({windowId: window.id, active: true}, function(tabs){
			var tab = tabs[0];
			tabid=tab.id;


			chrome.runtime.sendMessage({getImage:true,tabi:tabid},function(r){});

		})
	});

	window.onbeforeunload=function(){
		if( settingsState.warnBeforeClosing ){
			return "You want to save your work before closing the window!";
		}
	}

}

function preStart(){

	if( typeof(__Z19load_img_canvas_nowii) != 'function' || typeof(__Z17is_program_bootedv) != 'function' || !Module.calledRun || !Module["asm"]["__Z17is_program_bootedv"] || !__Z17is_program_bootedv() ){
		console.log("retrying...");
		setTimeout(preStart, 10);
	}else{
		start();
	}
}



function loadPreRequisites(){

	settingsState = loadExtensionPreferences();

	console.log('settingsState', settingsState);

	if(!localStorage['pickedHistory']) localStorage['pickedHistory'] = '';

	if( settingsState.loadBaseExtHistory ){
		chrome.runtime.sendMessage(extensionsKnown.color_pick, {getAllHistories: true}, function(response){
			if( !response || chrome.runtime.lastError ){
				console.log("no response from ColorPick extension for getAllHistories.....", chrome.runtime.lastError)
			}else{
				externalFullExtHistoryString = response.allExtHistories;
			}
		});
	}

	preReqLoaded = true; // app doesn't care if our pre-req are finished loading!  this could present issues.... we should possibly defer app launch until these are loaded.... or make the app poll for this status once launched...
}

loadPreRequisites();
preStart();


function makeImageDataUrlActive(dUrl){
	var img = new Image();
    // todo: error handling??? maybe it already is...
    img.onload = function() {

        var cvs = document.createElement('canvas');
        cvs.width = img.naturalWidth;
        cvs.height= img.naturalHeight;
        var ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0,0);
        //alert('the image is drawn');

        //Module["preloadedImages"][fauxPath] = cvs;
        Module["preloadedImages"]['/latest-custom-img'] = cvs;

        __Z19load_img_canvas_nowii(hash.startX || 0, hash.startY || 0); // changes a few places....
    };
    img.src = dUrl;

}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	console.log('tab messge', request, sender)

	if( request.setPickerImage ){

		if( request.setPickerImage == hash.tabid && request.setPickerImageWin == hash.winid ){

	        makeImageDataUrlActive(request.pickerImage);

	        if( settingsState.cacheSnapshots ){
	        	sessionStorage['temp-pick-cache-'+hash.winid+'-'+hash.tabid] = request.pickerImage;
	        }

		}else{
			var archivedSnap = sessionStorage['temp-pick-cache-'+hash.winid+'-'+hash.tabid];
			if( settingsState.cacheSnapshots && archivedSnap ){
				makeImageDataUrlActive(archivedSnap);
			}
		}
	}else if(request.reloadprefs){
		settingsState = loadExtensionPreferences();
		winResized();
	}



	sendResponse({});

});

function RGBtoHex(R,G,B) {return toHex(R)+toHex(G)+toHex(B);}
function toHex(N) {//http://www.javascripter.net/faq/rgbtohex.htm
 if (N==null) return "00";
 N=parseInt(N); if (N==0 || isNaN(N)) return "00";
 N=Math.max(0,N); N=Math.min(N,255); N=Math.round(N);
 return "0123456789ABCDEF".charAt((N-N%16)/16)
      + "0123456789ABCDEF".charAt(N%16);
}
function rgb2hsl(r, g, b){//http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(l * 100)
    };
}

// ***************************************************************
//  MESSAGES WE MAY RECIEVE FROM WASM ***************************
// ***************************************************************


function launchExtensionOptions(){
	chrome.runtime.sendMessage({goToOrVisitTab:'options.html'}, function(r){})
}

function addColorToHistory(r, g, b){
	externalFullExtHistoryString = null; // if we were going to use this string, we used it by now, free up some memmory....
	//console.log('addColorToHistory', r, g, b, RGBtoHex(r,g,b));

	var hex = RGBtoHex(r,g,b);

	if( settingsState.loadBaseExtHistory && settingsState.storeHistoryToBaseExt ){
		chrome.runtime.sendMessage(extensionsKnown.color_pick, {historyPush: true, hex: hex, rgb: {r:r,g:g,b:b}, hsv:rgb2hsl(r,g,b) }, function(response){
			if( !response || chrome.runtime.lastError ){
				console.log("no response from ColorPick extension.....", chrome.runtime.lastError);
				localStorage['pickedHistory'] += '#'+hex;
			}else{
				if( settingsState.keepFullHistoryBackup ){
					localStorage['pickedHistory'] += '#'+hex;
				}
			}
		});
	}else{
		localStorage['pickedHistory'] += '#'+hex;
	}
}

function updatePickerPosition(x,y){
	console.log('a pan instructino arrived', x, y);
	chrome.runtime.sendMessage(extensionsKnown.color_pick, {movePixel:true, active_tab:hash.tabid-0, active_window:hash.winid-0, x:x, y:y}, function(r){});
}

function historyLoaded(numLoaded){
	// expect 0
	if( numLoaded < 1 || confirm("Unexpected: a color history was found for the ColorPick WebAsm app.  Would you like to load the color history from the extension instead? (recommended)") ){

		//return stringToNewUTF8("");

		if( externalFullExtHistoryString ){
			return stringToNewUTF8(externalFullExtHistoryString);
		}else{
			return stringToNewUTF8(localStorage['pickedHistory']);
		}

	}else{
		return stringToNewUTF8("");
	}

}

function palleteLoaded(numLoaded){
	// expect 0..
}

