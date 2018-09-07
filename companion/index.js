import * as messaging from "messaging";
import {geolocation} from "geolocation";
import {RuterAPI} from "./ruter.js";
import {YrAPI} from "./yr.js";
import {DEFAULT_POSITION, DEPATURE_COUNT, STATIONS} from "../common/stations.js";
import companion from "companion";
import {localStorage} from "local-storage";
//import { settingsStorage } from "settings";

/*settingsStorage.onchange = function(evt) {
  sendRuterSchedule();
}*/

//started from app
messaging.peerSocket.onmessage = function (evt) {
    let lat = localStorage.getItem("lat");
    let lon = localStorage.getItem("lon");
    if (evt.key == "refresh_all" || lat === undefined || lon === undefined || lat === null || lon === null) {
        console.log("Fetching location");
        geolocation.getCurrentPosition(locationSuccess, locationError);
    } else {
        console.log("Using existing position lat: " + lat + ", lon: " + lon);
        sendRuterSchedule(lat, lon);

        let weatherData = getSavedWeatherData();
        let temp = weatherData.nowTemperature;
        if (weatherData.nowTemperature && weatherData.nowTemperature != undefined && weatherData.nowTemperature != "undefined") {
            console.log("Using existing weather data with now temperature: " + weatherData.nowTemperature);
            messaging.peerSocket.send(weatherData);
        } else {
            console.log("Fetching weather");
            sendYrData(lat, lon);
        }
    }
}

function locationSuccess(position) {
    storePosition(position);
    sendYrData(position.coords.latitude, position.coords.longitude);
    sendRuterSchedule(position.coords.latitude, position.coords.longitude);
}

function locationError(error) {
    console.log("Error: " + error.code,
        "Message: " + error.message);
    sendYrData(DEFAULT_POSITION.lat, DEFAULT_POSITION.lon);
    sendRuterSchedule(DEFAULT_POSITION.lat, DEFAULT_POSITION.lon);
}

//started from wakeupInterval or location changed

const WAKE_INTERVAL = 30 * 1000 * 60;
companion.wakeInterval = WAKE_INTERVAL;
companion.monitorSignificantLocationChanges = true;

if (companion.launchReasons.wokenUp) {
    console.log("Fetching location from backgroud task");
    geolocation.getCurrentPosition(backgroundLocationSuccess, backgroundLocationError);
}

if (companion.launchReasons.locationChanged) {
    console.log("Fetching location from backgroud task - location changed");
    geolocation.getCurrentPosition(backgroundLocationSuccess, backgroundLocationError);
}

function backgroundLocationSuccess(position) {
    storePosition(position);
    sendYrData(position.coords.latitude, position.coords.longitude);
}

function backgroundLocationError(error) {
    console.log("Error: " + error.code,
        "Message: " + error.message);
}

function storePosition(position) {
    console.log("Latitude: " + position.coords.latitude,
        "Longitude: " + position.coords.longitude);

    localStorage.setItem("lat", position.coords.latitude);
    localStorage.setItem("lon", position.coords.longitude);
}

function sendYrData(lat, lon) {
    let yrApi = new YrAPI();
    yrApi.realTimeWeather(lat, lon).then(function (weather) {
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send(weather);
        }
        saveWeatherData(weather);
    }).catch(function (e) {
        console.log("error");
        console.log(e);
    });
}

function saveWeatherData(weather) {
    localStorage.setItem("rainInMm", weather.rainInMm);
    localStorage.setItem("maxTemparature", weather.maxTemparature);
    localStorage.setItem("minTemparature", weather.minTemparature);
    localStorage.setItem("nowTemperature", weather.nowTemperature);
}

function getSavedWeatherData() {
    let weather = {
        "weather": true,
        "rainInMm": localStorage.getItem("rainInMm"),
        "maxTemparature": localStorage.getItem("maxTemparature"),
        "minTemparature": localStorage.getItem("minTemparature"),
        "nowTemperature": localStorage.getItem("nowTemperature")
    };
    return weather
}

function sendRuterSchedule(lat, lon) {
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
    let station = findStation(lat, lon);
    console.log(station);

    let ruterApi = new RuterAPI();
    ruterApi.realTimeDepartures(station.id, station.direction, station.name, station.lineIds, station.destinationRefs).then(function (departures) {
        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            // Limit results to the number of tiles available in firmware
            departures.splice(DEPATURE_COUNT, departures.length);
            messaging.peerSocket.send(departures);
        }
    }).catch(function (e) {
        console.log("error");
        console.log(e)
    });
}

function findStation(lat, lon) {
    if (lat === undefined || lon === undefined) {
        let whatsTheClock = new Date().getHours();
        return whatsTheClock < 12 ? STATIONS[0] : STATIONS[1];
    } else {
        return NearestStation(lat, lon);
    }
}

// Convert Degress to Radians
function Deg2Rad(deg) {
    return deg * Math.PI / 180;
}

function PythagorasEquirectangular(lat1, lon1, lat2, lon2) {
    lat1 = Deg2Rad(lat1);
    lat2 = Deg2Rad(lat2);
    lon1 = Deg2Rad(lon1);
    lon2 = Deg2Rad(lon2);
    var R = 6371; // km
    var x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    var y = (lat2 - lat1);
    var d = Math.sqrt(x * x + y * y) * R;
    return d;
}

function NearestStation(latitude, longitude) {
    var mindif = 99999;
    var closest;

    for (var index = 0; index < STATIONS.length; ++index) {
        var dif = PythagorasEquirectangular(latitude, longitude, STATIONS[index].lat, STATIONS[index].lon);
        if (dif < mindif) {
            closest = index;
            mindif = dif;
        }
    }

    return STATIONS[closest];
}
