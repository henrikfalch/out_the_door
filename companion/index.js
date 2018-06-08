import { me } from "companion";
import * as messaging from "messaging";
import { geolocation } from "geolocation";
//import { settingsStorage } from "settings";

import { RuterAPI } from "./ruter.js"
import { YrAPI } from "./yr.js"
import { DEPATURE_COUNT, FAVORITE_STATION_SETTING, STATIONS } from "../common/stations.js";

/*settingsStorage.onchange = function(evt) {
  sendRuterSchedule();
}*/

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
    // Ready to send or receive messages
    sendRuterSchedule();
    geolocation.getCurrentPosition(locationSuccess, locationError);
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
    // Output the message to the console
    console.log(JSON.stringify(evt.data));
}

function locationSuccess(position) {
    console.log("Latitude: " + position.coords.latitude,
        "Longitude: " + position.coords.longitude);
    sendYrData(position.coords.latitude, position.coords.longitude);
}

function locationError(error) {
    console.log("Error: " + error.code,
        "Message: " + error.message);
}

function sendYrData(lat, lon) {
    let yrApi = new YrAPI();
    yrApi.realTimeWeather(lat, lon).then(function(weather) {
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send(weather);
        }
    }).catch(function (e) {
        console.log("error"); console.log(e)
    });
}

function sendRuterSchedule() {
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

    let ruterApi = new RuterAPI();
    ruterApi.realTimeDepartures(station.id, station.direction, station.name, station.lineIds, station.destinationRefs).then(function(departures) {
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            // Limit results to the number of tiles available in firmware
            departures.splice(DEPATURE_COUNT, departures.length);
            messaging.peerSocket.send(departures);
        }
    }).catch(function (e) {
        console.log("error"); console.log(e)
    });
}
