import { DEPATURE_COUNT, STATIONS } from "../common/stations.js";
import document from "document";

export function HFitUI() {
    this.mainForm = document.getElementById("mainForm");
    this.mainStatus = document.getElementById("status");

    this.tiles = [];
    for (let i = 0; i < DEPATURE_COUNT; i++) {
        let tile = document.getElementById(`train-${i}`);
        if (tile) {
            this.tiles.push(tile);
        }
    }
}

HFitUI.prototype.updateUI = function(state, departures) {
    if (state === "loaded") {
        this.mainForm.style.display = "inline";
        this.mainStatus.text = "";

        this.updateDepartureList(departures);
    }
    else {
        this.mainForm.style.display = "none";

        if (state === "loading") {
            this.mainStatus.text = "Loading departures ...";
        }
        else if (state === "disconnected") {
            this.mainStatus.text = "Please check connection to phone and Fitbit App"
        }
        else if (state === "error") {
            this.mainStatus.text = "Something terrible happened.";
        }
    }
}

HFitUI.prototype.updateDepartureList = function(departures) {
    let firstDepature = departures[0];
    document.getElementById("destination").text = firstDepature.stopName
    if (firstDepature.platform !== undefined && firstDepature.stopName.length < 10) {
        document.getElementById("destination").text = firstDepature.stopName + " mot " + firstDepature.platform;
    }

    for (let i = 0; i < DEPATURE_COUNT; i++) {
        let tile = this.tiles[i];
        if (!tile) {
            continue;
        }

        const depature = departures[i];
        if (!depature) {
            tile.style.display = "none";
            continue;
        }

        tile.style.display = "inline";
        tile.getElementById("platform").text = "Linje " + depature.lineId;
        tile.getElementById("minutes").text = depature.minutes === 0 ? "nå" : depature.minutes + " min";
    }
}
