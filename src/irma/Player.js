/**
 * Music player implementation for IRMA project
 *
 * @author zostrum
 */
const Helper = require('./../common/Helper');
const STATION_TITLE_PREFIX = 'Now playing: ';
const LOCAL_STORAGE_KEY = 'irma-index';

class Player {
    constructor(options) {
        this._stations = options.stations;
        this._stationIndex = localStorage[LOCAL_STORAGE_KEY] || 0;
        
        this._rootEl = this._createHtmlElements();
    }

    destroy() {
        const parentNode = document.body;

        parentNode.removeChild(this._rootEl);
        this._stations = null;
        this._stationIndex = null;
        this._rootEl = null;
    }

    _createHtmlElements() {
        const player = document.createElement('div');
        player.setAttribute('id', 'player');
        player.innerHTML = `
            <audio id="audio" src="${this._stations[this._stationIndex].source}" preload="none"></audio>
            <div id="play" title="Play Music" style="position: absolute; width: 20px; height: 20px; top: 7px; right: 34px; border: 1px solid rgb(0, 0, 0); background-size: 8px 8px; border-radius: 6px; background-color: rgb(255, 235, 59); cursor: pointer; text-align: center;">▷</div>
            <div id="next" title="Next Station" style="position: absolute; width: 20px; height: 20px; top: 7px; right: 9px; border: 1px solid rgb(0, 0, 0); background-size: 8px 8px; border-radius: 6px; background-color: rgb(255, 235, 59); cursor: pointer; text-align: center;">»</div>
        `;
        const el = document.body.appendChild(player);
        
        el.querySelector('#play').addEventListener('click', this._onPlayButton.bind(this), true);
        el.querySelector('#next').addEventListener('click', this._onNextButton.bind(this), true);
        el.querySelector('#audio').addEventListener('canplay', () => {
            el.querySelector('#audio').play();
        }, false);

        return el;
    }

    _onPlayButton() {
        const audioEl = this._rootEl.querySelector('#audio');
        const playBtn  = this._rootEl.querySelector('#play');

        if (audioEl.paused) {
            playBtn.innerHTML = '||';
            audioEl.load();
            
            playBtn.setAttribute('title', STATION_TITLE_PREFIX + this._stations[this._stationIndex].title);
            audioEl.setAttribute('preload', 'auto');
        } else {
            audioEl.pause();
            playBtn.innerHTML = '▷';
            playBtn.setAttribute('title', this._stations[this._stationIndex].title);
            
            audioEl.setAttribute('preload', 'none');
        }
    }

    _onNextButton() {
        const audioEl = this._rootEl.querySelector('#audio');
        const playBtn  = this._rootEl.querySelector('#play');

        const station = this._pickStation();

        audioEl.setAttribute('src', station.source);

        // Title without prefix
        if (audioEl.paused) {
            playBtn.setAttribute('title', this._stations[this._stationIndex].title);
        }
    }

    _pickStation() {
        if (this._stationIndex == this._stations.length - 1) {
            this._stationIndex = 0;
        } else {
            this._stationIndex++;
        }
        localStorage[LOCAL_STORAGE_KEY] = this._stationIndex;

        return this._stations[this._stationIndex];
    }
}

module.exports = Player;