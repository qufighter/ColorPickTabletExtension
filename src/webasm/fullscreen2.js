
function winResized(){

	if( window.innerWidth > window.innerHeight && settingsState.preventWidescreen !== false ){

		__Z21resize_img_canvas_nowii(window.innerHeight,window.innerHeight);

	}else{
		__Z21resize_img_canvas_nowii(window.innerWidth,window.innerHeight);
	}

}

window.addEventListener('resize', winResized)

function firstRezie(){
	if( spinnerElement.style.display != 'none' ){
		setTimeout(firstRezie, 250);
	}else{
		if( statusElement.innerHTML == '' ){
			document.getElementById('hide-these').style.display="none";
			winResized();
		}
	}
}

firstRezie();