window.onload = function() {
	let play = document.getElementById("play");
	let next = document.getElementById("next");
	let prev = document.getElementById("prev");
	let stream = document.getElementById('stream');
	let radioStations, index = 0;
	
	function getRadioStations() {
		// Mock
		return [
			{
				title: "HitFM",
				source: "http://online2.hitfm.ua/HitFM_Best"
			},
			{
				title: "Vocal Trance",
				source: "http://176.9.36.203:8000/vocaltrance_320"
			},
			{
				title: "LuxFM",
				source: "http://icecastlv.luxnet.ua/lux"
			}
		];
	}

	radioStations = getRadioStations();

	play.onclick = function() {
		// stream.firstElementChild.src = radioStations[index].source;
		stream.play();
		alert('play');
	}

	next.onclick = function() {
		if (index == radioStations.length - 1) {
			index = 0;
		} else {
			index ++;
		}
		play.click();
	}

	prev.onclick = function() {
		console.log(index);

		if (index == 0) {
			index = radioStations.length - 1;
		} else {
			index --;
		}
		play.click();
	}
};