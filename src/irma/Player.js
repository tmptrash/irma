/**
 * Music player implementation for IRMA project
 *
 * @author zostrum
 */
const STATION_TITLE_PREFIX = 'Now playing: ';
const STATION              = 'irma-station';
const PLAY                 = 'play'
const PLAY_QUERY           = '.' + PLAY;
const NEXT                 = 'next'
const NEXT_QUERY           = '.' + NEXT;
const AUDIO                = 'audio'
const AUDIO_QUERY          = '.' + AUDIO;

class Player {
    constructor(options) {
        this._stations     = options.stations;
        this._stationIndex = localStorage[STATION] || 0;
        this._rootEl       = document.body.appendChild(this._createDOM());
    }

    destroy() {
        document.body.removeChild(this._rootEl);
        this._stations = null;
        this._rootEl   = null;
    }

    _createDOM() {  
        const playerEl     = document.createElement('div');
        playerEl.innerHTML = `
            <style>
                ${PLAY_QUERY}, ${NEXT_QUERY} {
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
            <audio class="${AUDIO}" src="${this._stations[this._stationIndex].source}" preload="none"></audio>
            <div class="${PLAY}" class="button" title="Play Music"   style="right: 34px;">▶</div>
            <div class="${NEXT}" class="button" title="Next Station" style="right: 9px;">»</div>
        `;
        
        playerEl.querySelector(PLAY_QUERY).addEventListener('click', this._onPlayButton.bind(this), true);
        playerEl.querySelector(NEXT_QUERY).addEventListener('click', this._onNextButton.bind(this), true);
        playerEl.querySelector(AUDIO_QUERY).addEventListener('canplay', () => playerEl.querySelector(AUDIO_QUERY).play(), false);

        return playerEl;
    }

    _onPlayButton(event) {
        event.stopPropagation();
        const audioEl = this._rootEl.querySelector(AUDIO_QUERY);
        const playBtn = this._rootEl.querySelector(PLAY_QUERY);

        if (audioEl.paused) {
            audioEl.load();
            playBtn.innerText = '| |';
            playBtn.title = STATION_TITLE_PREFIX + this._stations[this._stationIndex].title;
            audioEl.preload = 'auto';
        } else {
            audioEl.pause();
            playBtn.innerText = '▶';
            playBtn.title = this._stations[this._stationIndex].title;
            audioEl.preload = 'none';
        }
    }

    _onNextButton(event) {
        event.stopPropagation();
        const audioEl = this._rootEl.querySelector(AUDIO_QUERY);
        const playBtn = this._rootEl.querySelector(PLAY_QUERY);
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