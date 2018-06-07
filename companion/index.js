import { me } from "companion";
import * as messaging from "messaging";
//import { settingsStorage } from "settings";

import { HFitAPI } from "./ruter.js"
import { DEPATURE_COUNT, FAVORITE_STATION_SETTING, STATIONS } from "../common/stations.js";

/*settingsStorage.onchange = function(evt) {
  sendHFitSchedule();
}*/

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
    // Ready to send or receive messages
    sendHFitSchedule();
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
    // Output the message to the console
    console.log(JSON.stringify(evt.data));
}

function sendHFitSchedule() {
    /*let station = settingsStorage.getItem(FAVORITE_STATION_SETTING);
    if (station) {
      try {
        station = JSON.parse(station);
      }
      catch (e) {
        console.log("error parsing setting value: " + e);
      }
    }*/

    /*if (!station || typeof(station) !== "object" || station.length < 1 || typeof(station[0]) !== "object") {
      station = { code: "embr", direction: "s" };
    }
    else {
      station = station[0].value;
    }*/
    let whatsTheClock = new Date().getHours();
    let station = whatsTheClock < 12 ? STATIONS[0] : STATIONS[1];
    console.log(station);

    let hFitApi = new HFitAPI();
    hFitApi.realTimeDepartures(station.id, station.direction, station.name, station.lineIds).then(function(departures) {
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            // Limit results to the number of tiles available in firmware
            departures.splice(DEPATURE_COUNT, departures.length);
            messaging.peerSocket.send(departures);
        }
    }).catch(function (e) {
        console.log("error"); console.log(e)
    });
}
