export function HFitAPI(apiKey) {
    if (apiKey !== undefined) {
        this.apiKey = apiKey;
    }
    else {
        // Default key for open public access.
        this.apiKey = "MW9S-E7SL-26DU-VV8V";
    }
};

HFitAPI.prototype.realTimeDepartures = function(stopId, direction, stopName, lineIds) {
    let self = this;
    return new Promise(function(resolve, reject) {
        let url = "https://reisapi.ruter.no/StopVisit/GetDepartures/";
        url += stopId;
        if (lineIds !== undefined) {
            url += "?linenames=" + lineIds;
        }
        console.log("fetching url: " + url);
        fetch(url).then(function(response) {
            return response.json();
        }).then(function(json) {
            console.log("Got JSON response from server:" + JSON.stringify(json));

            let departures = [];
            let directionRegex = /\(Retning\s(.*)\)/g;

            json.forEach( (destination) => {
                let journey = destination["MonitoredVehicleJourney"];
                let stopInfo = journey["MonitoredCall"];
                let destinationDirection = journey["DirectionRef"];
                if (destinationDirection === direction) {
                    let now = Date.parse(destination["RecordedAtTime"]);
                    let depatureTime = Date.parse(stopInfo["ExpectedDepartureTime"]);
                    let depatureInMin = (depatureTime - now) / 60000;
                    let directionText = directionRegex.exec(stopInfo["DeparturePlatformName"]);
                    let d = {
                        "to": journey["DestinationName"],
                        "lineId": journey["PublishedLineName"] ,
                        "minutes": Number.parseInt(depatureInMin),
                        "platform": (directionText === null) ? "" : directionText[1],
                        "stopName": stopName
                    };
                    if (!Number.isInteger(d["minutes"])) {
                        d["minutes"] = 0;
                    }
                    departures.push(d);
                }
            });

            // Sort departures
            departures.sort( (a,b) => { return (a["minutes"] - b["minutes"]) } );

            resolve(departures);
        }).catch(function (error) {
            reject(error);
        });
    });
}
