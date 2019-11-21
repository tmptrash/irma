window.onload = function() {
	let play = document.getElementById("play");
	
	play.onclick = function() {
		let stream = document.getElementById('stream');
		stream.play();
	}
};