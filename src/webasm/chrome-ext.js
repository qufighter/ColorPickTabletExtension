var tabid, winid;
var preReqLoaded = false;
var settingsState = {};

var hash = {};

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

	//console.log('winlochash: ', hash);

	chrome.windows.getCurrent(function(window){
		winid = window.id;
		chrome.tabs.query({windowId: window.id, active: true}, function(tabs){
			var tab = tabs[0];
			tabid=tab.id;


			chrome.runtime.sendMessage({getImage:true,tabi:tabid},function(r){});

		})
	})

}

function preStart(){

	if( typeof(__Z19load_img_canvas_nowv) != 'function' || typeof(__Z17is_program_bootedv) != 'function' || !Module.calledRun || !Module["asm"]["__Z17is_program_bootedv"] || !__Z17is_program_bootedv() ){
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


        __Z19load_img_canvas_nowv();
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


// ***************************************************************
//  MESSAGES WE MAY RECIEVE FROM WASM ***************************
// ***************************************************************


function launchExtensionOptions(){
	chrome.runtime.sendMessage({goToOrVisitTab:'options.html'}, function(r){})
}

function addColorToHistory(r, g, b){
	//console.log('addColorToHistory', r, g, b, RGBtoHex(r,g,b));
	localStorage['pickedHistory'] += '#'+RGBtoHex(r,g,b);
}

function historyLoaded(numLoaded){
	// expect 0
	if( numLoaded < 1 || confirm("Unexpected: a color history was found for the ColorPick WebAsm app.  Would you like to load the color history from the extension instead? (recommended)") ){

		//return stringToNewUTF8("");

		return stringToNewUTF8(localStorage['pickedHistory'])

	}else{
		return stringToNewUTF8("");
	}

}

function palleteLoaded(numLoaded){
	// expect 0..
}

