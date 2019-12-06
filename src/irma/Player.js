/**
 * Music player implementation for IRMA project
 *
 * @author zostrum
 */
const Helper = require('./../common/Helper');
const STATION_TITLE_PREFIX = 'Now playing: ';
const LOCAL_STORAGE_KEY = 'IRMA_current_station_index';

class Player {
    constructor(options) {
        this._stations = options.stations;
        this._stationIndex = localStorage.getItem(LOCAL_STORAGE_KEY) || 0;
        
        this._audioEl = this._createAudioElement();
        this._playBtn = this._createPlayButton();
        this._nextBtn = this._createNextButton();
        this._titleEl = this._createStationTitle();
    }

    destroy() {
        const parentNode = document.body;

        parentNode.removeChild(this._audioEl);
        parentNode.removeChild(this._playBtn);
        parentNode.removeChild(this._nextBtn);
        parentNode.removeChild(this._titleEl);

        this._audioEl = null;
        this._playBtn = null;
        this._nextBtn = null;
        this._titleEl = null;
     }

    _createAudioElement() {
        const audio = document.createElement('audio');
        audio.setAttribute('src', this._stations[this._stationIndex].source);
        audio.setAttribute('preload', 'none');
        audio.pause();
        
        /**
         * Trigger play event when stream is loaded.
         * This behaviour avoids Exception in interrupted Play promise 
         */ 
        audio.addEventListener('canplay', () => {
            audio.play();
        }, false);

        return document.body.appendChild(audio);
    }

    _createPlayButton() {
        const el = document.body.appendChild(Helper.setStyles('DIV', {
            position: 'absolute',
            width: '20px',
            height: '20px',
            top: '7px',
            right: '34px',
            border: '1px #FFEB3B solid',
            backgroundSize: '8px 8px',
            borderRadius: '6px',
            backgroundColor: '#FFEB3B',
            cursor: 'pointer',
            textAlign: 'center'
        }));

        el.innerText = '▷';
        el.title = 'Play Music';
        el.addEventListener('click', this._onPlayButton.bind(this), true);

        return el;
    }

    _createNextButton() {
        const el = document.body.appendChild(Helper.setStyles('DIV', {
            position: 'absolute',
            width: '20px',
            height: '20px',
            top: '7px',
            right: '9px',
            border: '1px #FFEB3B solid',
            backgroundSize: '8px 8px',
            borderRadius: '6px',
            backgroundColor: '#FFEB3B',
            cursor: 'pointer',
            textAlign: 'center'
        }));

        el.innerText = '»';
        el.title = 'Next Station';
        el.addEventListener('click', this._onNextButton.bind(this), true);

        return el;
    }

    _createStationTitle() {
        return document.body.appendChild(Helper.setStyles('DIV', {
            position: 'absolute',
            top: '35px',
            left: '60px',
            color: '#fff',
            fontSize: '18px',
            fontFamily: 'Consolas'
        }));
    }

    _onPlayButton() {
        if (this._audioEl.paused) {
            this._playBtn.innerHTML = '||';
            this._audioEl.load();
            
            this._playBtn.setAttribute('title', STATION_TITLE_PREFIX + this._stations[this._stationIndex].title);
            this._audioEl.setAttribute('preload', 'auto');
        } else {
            this._audioEl.pause();
            this._playBtn.innerHTML = '▷';
            this._playBtn.setAttribute('title', this._stations[this._stationIndex].title);
            
            this._audioEl.setAttribute('preload', 'none');
        }

    }

    _onNextButton() {
        const station = this._pickStation();
        this._audioEl.setAttribute('src', station.source);

        // Title without prefix
        if (this._audioEl.paused) {
            this._playBtn.setAttribute('title', this._stations[this._stationIndex].title);
        }
    }

    _updateTitle(text = '') {
        this._titleEl.innerHTML = text;
        // self-clean
        if (text != '') {
            setTimeout(() => this._updateTitle(), 5000);
        }
    }

    _pickStation() {
        if (this._stationIndex == this._stations.length - 1) {
            this._stationIndex = 0;
        } else {
            this._stationIndex++;
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, this._stationIndex);

        return this._stations[this._stationIndex];
    }
}

module.exports = Player;