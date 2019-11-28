/**
 * Canvas implementation with minimum logic for drawing colored dots.
 *
 * @author zostrum
 */
const Helper = require('./../common/Helper');

class Player {
    constructor(options) {
        this._preload = false;
        this._isNowPlaying = false;
        this._stationTitlePrefix = "Now playing: ";
        this._radioStations = [
            {
                title: "Ambient Radio",
                source: "http://uk2.internet-radio.com:31491/;stream.mp3?_=1"
            },
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
        this._currentStation = {};
        this._stationIndex = 0;

        this._player = this._createAudioElement();
        this._playButton = this._createPlayButton();
        this._nextButton = this._createNextButton();
        this._stationTitleElement = this._createStationTitle();
    }

    destroy() {
        this._preload = null;
        this._isNowPlaying = null;
        this._stationTitlePrefix = null;
        this._radioStations = null;
        this._currentStation = null;
        this._stationIndex = null;
        this._player = null;
        this._playButton = null;
        this._nextButton = null;
        this._stationTitleElement = null;
    }

    _createAudioElement() {
        const audio = document.createElement('audio');
        audio.setAttribute("src", this._getDefaultRadio().source);

        // is preload enabled?
        if (!this._preload) {
            audio.setAttribute("preload", "none");
        }

        return document.body.appendChild(audio);
    }

    _createSourceElement() {
        const source = document.createElement('source');
        source.setAttribute('src', this._getDefaultRadio().source)

        return source;
    }

    _getDefaultRadio() {
        let station = localStorage.getItem('curent_radio_station');

        if (station) {
            station = JSON.parse(station);
        } else {
            station = this._radioStations[0];
            localStorage.setItem('curent_radio_station', JSON.stringify(station));
        }
        this._currentStation = station;

        return station;
    }

    _createPlayButton() {
        const el = document.body.appendChild(Helper.setStyles('DIV', {
            position: 'absolute',
            width: '20px',
            height: '20px',
            top: '35px',
            left: '9px',
            border: '1px #FFEB3B solid',
            backgroundSize: '8px 8px',
            borderRadius: '6px',
            backgroundColor: '#FFEB3B',
            cursor: 'pointer',
            textAlign: 'center'
        }));

        el.innerText = '▷';
        el.title = 'Play Music';
        el.onclick = this._onPlayButton.bind(this);

        return el;
    }

    _createNextButton() {
        const el = document.body.appendChild(Helper.setStyles('DIV', {
            position: 'absolute',
            width: '20px',
            height: '20px',
            top: '35px',
            left: '34px',
            border: '1px #FFEB3B solid',
            backgroundSize: '8px 8px',
            borderRadius: '6px',
            backgroundColor: '#FFEB3B',
            cursor: 'pointer',
            textAlign: 'center'
        }));

        el.innerText = '»';
        el.title = 'Next Station';
        el.onclick = this._onNextButton.bind(this);

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
        // reverse current status
        this._isNowPlaying = !this._isNowPlaying;

        if (this._isNowPlaying) {
            this._playButton.innerHTML = "||";

            this._player.load();
            this._player.play();
        } else {
            this._player.pause();
            this._playButton.innerHTML = "▷";
        }

        this._updateTitle(this._stationTitlePrefix + this._currentStation.title);
    }

    _onNextButton() {
        const station = this._pickStation();
        localStorage.setItem('curent_radio_station', JSON.stringify(station));
        this._currentStation = station;

        this._player.pause();
        this._player.setAttribute("src", station.source);

        // Don't play on pause
        if (this._isNowPlaying) {
            this._player.load();
            this._player.play();
            this._updateTitle(this._stationTitlePrefix + station.title);
        }
    }

    _updateTitle(text = "") {
        this._stationTitleElement.innerHTML = text;
        // self-clean
        if (text != "") {
            setTimeout(() => this._updateTitle(), 5000);
        }
    }

    _pickStation() {
        if (this._stationIndex == this._radioStations.length - 1) {
            this._stationIndex = 0;
        } else {
            this._stationIndex++;
        }

        return this._radioStations[this._stationIndex];
    }
}

module.exports = Player;