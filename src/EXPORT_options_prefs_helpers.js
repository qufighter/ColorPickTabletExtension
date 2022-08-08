// these functions are NOT included in user.js (content scripts)

//run build_exports.sh to create EXPORT_options_prefs_helpers.js
import  {storage, pOptions, pAdvOptions, pSyncItems} from "./EXPORT_options_prefs.js"

function sendReloadPrefs(cb){
	var cbf=cb;
	if(typeof(cbf)!='function')cbf=function(){};
	chrome.runtime.sendMessage({reloadprefs: true}, function(response) {
		if(chrome.runtime.lastError)console.log('sendReloadPrefs error (if there are active views we tell them to reload the preferences which may have changed): '+chrome.runtime.lastError.message);
		cbf()
	});
}

function chromeStorageSaveALocalStor(tosave){
	storage.set(tosave, function() {
		if(chrome.runtime.lastError && chrome.runtime.lastError.message.indexOf('MAX_WRITE_OPERATIONS_PER_HOUR') > 0){
			//console.log(chrome.runtime.lastError);
		}
	});
}

function saveSyncItemsToChromeSyncStorage(){
	var tosave={};
	for(var i in pSyncItems){
		tosave[i]=localStorage[i];
	}
	chromeStorageSaveALocalStor(tosave);
	sendReloadPrefs();
}
function saveToChromeSyncStorage(){
	var tosave={};
	for(var i in pOptions){
		tosave[i]=localStorage[i];
	}
	for(var i in pAdvOptions){
		tosave[i]=localStorage[i];
	}
	chromeStorageSaveALocalStor(tosave);
}

function loadSettingsFromChromeSyncStorage(cbf){
	
	storage.get(null, function(obj) {
		for(i in obj){
			if(pOptions[i] || pAdvOptions[i] || pSyncItems[i]){
				localStorage[i] = obj[i];
			}
		}
		sendReloadPrefs();
		if(typeof(cbf)=='function')cbf();
	});
}



function loadPrefToOptsObj(destObj, i, srcObj, pOptions){
	if(typeof(pOptions[i].def)=='boolean')
		destObj[i] = ((srcObj[i]=='true')?true:((srcObj[i]=='false')?false:pOptions[i].def));
	else
		destObj[i] = ((srcObj[i])?srcObj[i]:pOptions[i].def);
}

function loadExtensionPreferences(cbf){
	var opts = {};

	if( typeof(cbf)=='function' ){ // if we got a callback we'll load from chrome storage
		storage.get(null, function(obj) {
			if(chrome.runtime.lastError)console.log(chrome.runtime.lastError.message);
			obj = obj || {};
			var i;
			for(i in pOptions){loadPrefToOptsObj(opts, i, obj, pOptions);}
			for(i in pAdvOptions){loadPrefToOptsObj(opts, i, obj, pAdvOptions);}
			for(i in pSyncItems){loadPrefToOptsObj(opts, i, obj, pSyncItems);}
			if(typeof(cbf)=='function')cbf(opts);
		});
	}else{
		// we first load from local storage....
		for(i in pOptions){loadPrefToOptsObj(opts, i, localStorage, pOptions);}
		for(i in pAdvOptions){loadPrefToOptsObj(opts, i, localStorage, pAdvOptions);}
		for(i in pSyncItems){loadPrefToOptsObj(opts, i, localStorage, pSyncItems);}
	}

	return opts;
}

//run build_exports.sh to create EXPORT_options_prefs_helpers.js
export {sendReloadPrefs, chromeStorageSaveALocalStor, saveSyncItemsToChromeSyncStorage, saveToChromeSyncStorage, loadSettingsFromChromeSyncStorage, loadPrefToOptsObj, loadExtensionPreferences}
