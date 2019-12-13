/**
 * Music player implementation for IRMA project
 *
 * @author zostrum
 */
const STATION_TITLE_PREFIX = 'Now playing: ';
const STATION = 'irma-station';

class Player {
    constructor(options) {
        this._stations = options.stations;
        this._stationIndex = localStorage[STATION] || 0;
        
        this._rootEl = this._createDOM();
    }

    destroy() {
        document.body.removeChild(this._rootEl);
        this._stations = null;
        this._rootEl = null;
    }

    _createDOM() {  
        const playerEl = document.createElement('div');
        playerEl.id = 'player';
        playerEl.innerHTML = `
            <style>
                .play, .next {
                    position: absolute;
                    width: 20px; 
                    height: 20px; 
                    top: 7px; 
                    border: 1px solid rgb(0, 0, 0); 
                    background-size: 8px 8px; 
                    border-radius: 6px; 
                    background-color: rgb(255, 235, 59); 
                    cursor: pointer; 
                    text-align: center;
                }
            </style>
            <audio class="audio" src="${this._stations[this._stationIndex].source}" preload="none"></audio>
            <div class="play" class="button" title="Play Music"   style="right: 34px;">▶</div>
            <div class="next" class="button" title="Next Station" style="right: 9px;">»</div>
        `;
        document.body.appendChild(playerEl);
        
        playerEl.querySelector('.play').addEventListener('click', this._onPlayButton.bind(this), true);
        playerEl.querySelector('.next').addEventListener('click', this._onNextButton.bind(this), true);
        playerEl.querySelector('.audio').addEventListener('canplay', () => playerEl.querySelector('.audio').play(), false);

        return playerEl;
    }

    _onPlayButton() {
        event.stopPropagation();
        const audioEl = this._rootEl.querySelector('.audio');
        const playBtn  = this._rootEl.querySelector('.play');

        if (audioEl.paused) {
            audioEl.load();
            playBtn.innerText = '||';
            playBtn.title = STATION_TITLE_PREFIX + this._stations[this._stationIndex].title;
            audioEl.preload = 'auto';
        } else {
            audioEl.pause();
            playBtn.innerText = '▶';
            playBtn.title = this._stations[this._stationIndex].title;
            audioEl.preload = 'none';
        }
    }

    _onNextButton() {
        const audioEl = this._rootEl.querySelector('.audio');
        const playBtn  = this._rootEl.querySelector('.play');
        const station = this._stations[++this._stationIndex] || this._stations[this._stationIndex = 0];
        localStorage[STATION] = this._stationIndex;
        audioEl.src = station.source;

        // Title without prefix
        if (audioEl.paused) {
            playBtn.title = this._stations[this._stationIndex].title;
        }
    }
}

module.exports = Player;