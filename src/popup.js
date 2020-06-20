var winid;
var tabid;

function clearError(){
	var exi_err = document.getElementById('last-error');
	if( exi_err ) exi_err.remove();
}

function errorSnapping(){

	document.getElementById('loading').style.display="none";

	var gobtn = document.getElementById('go-btn');
	gobtn.style.display='none';
	Cr.elm('div',{
		id: 'last-error',
		childNodes:[
			Cr.txt(chrome.i18n.getMessage('snapError'))
		]
	}, document.body);
}

function successSnapping(dataUrl, request){

	document.getElementById('loading').style.display="none";
	document.getElementById('loading').style.position='absolute';
	document.getElementById('loading').style.top='0';

	var gobtn = document.getElementById('go-btn');
	gobtn.href =  gobtn.href.split('?')[0] + '?winid='+winid+'&tabid='+tabid

	if( request.x || request.y ){
		gobtn.href += '&startX=' + (request.x || 0) + '&startY=' + (request.y || 0);
	}

	gobtn.style.display='';

	var exiImg = gobtn.querySelector('img');
	if( exiImg ){
		exiImg.remove();
	}else{
		Cr.elm('div',{childNodes:[
			Cr.txt(chrome.i18n.getMessage('tapToLaunch')),
			Cr.elm('br'),
			Cr.txt(chrome.i18n.getMessage('extName'))
		]}, gobtn);
	}

	Cr.elm('img',{
		src: dataUrl,
		width: 300,
		class: 'goimg'
	}, [], gobtn);

	clearError();
}


function createDOM() {

	// todo inject content scripts?? ?really needed ???

	var x=0,y=0;

	chrome.windows.getCurrent(function(window){
		winid = window.id;
		chrome.tabs.query({windowId: window.id, active: true}, function(tabs){
			var tab = tabs[0];
			tabid=tab.id;

			newSnapshot();

			var gobtn = document.getElementById('go-btn');

			var container = gobtn.parentNode;

			//Cr.insertNode(, container, gobtn.nextElementSibling);
			Cr.elm('div',{childNodes:[Cr.txt(chrome.i18n.getMessage('theImageAboveWillBeSelected'))]}, container);

			//insertNode : function(newNode, parentElem, optionalInsertBefore


			Cr.elm("div",{id:"ctrls"},[

				Cr.elm("a",{href:"#",class:'hilight',title:chrome.i18n.getMessage('reSnapPage'),id:"resnap"},[
					Cr.elm("img",{align:"top",src:"img/refresh.png"})
				]),
				Cr.elm("a",{target:"_blank",class:'hilight',href:"options.html",event:['click',navToOptions],title:chrome.i18n.getMessage('configurationHelp'),id:"optsb"},[
					Cr.elm("img",{align:"top",style:'position:relative;top:0.5px;',src:"img/settings.png"})
				])

			], document.body)


			document.getElementById('resnap').addEventListener('click', newSnapshot);

		})
	})

}

function newSnapshot(){

	document.getElementById('loading').style.display="block";

	chrome.runtime.sendMessage({newImage:true, snapwin:winid, snaptab:tabid }, function(response){

		//document.getElementById('loading').style.display="none";


		//console.log('got resp', response);


		if( response.errorSnapping ){

			errorSnapping(); // never get here....

		}else{
			// TODO we need more than this to know for sure the image is READY for us..... snap WILL fail on some tabs, etc... maybe ?? (above should catch most of those....) TODO test local files etc/.
			// var gobtn = document.getElementById('go-btn');
			// gobtn.href =  gobtn.href.split('?')[0] + '?winid='+winid+'&tabid='+tabid
			// gobtn.style.display='';

			// usee a success message instead..... we tell the bg which tab "we" are a (active on) fterall...
		}
		

	})
}

function wk(ev){
	if(ev.keyCode==27){ // esc will close popup
		
	}else if(ev.keyCode==82||ev.keyCode==74){//r or j refresh
		newSnapshot();
	}
}

document.addEventListener('DOMContentLoaded', createDOM);
window.addEventListener('keyup',wk);

function reqForUs(request){

	return request.snapWin == winid && request.snapTab == tabid;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.notifyPopupOfError && reqForUs(request)){
		errorSnapping(); // never get here....
		sendResponse({});

	}else if (request.notifyPopupReady && reqForUs(request)){

		successSnapping(request.notifyPopupReady, request); // TODO: send along... request.x and request.y ??  or do we query for this again later???

		sendResponse({});

	}else
		sendResponse({});

});
