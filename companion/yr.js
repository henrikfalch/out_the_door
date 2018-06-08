export function YrAPI() {
};

YrAPI.prototype.realTimeWeather = function(lat, lon) {
    let self = this;
    return new Promise(function(resolve, reject) {
        let url = "https://api.met.no/weatherapi/locationforecast/1.9/";
        url = url + "?lat=" + lat + "&lon=" + lon;

        console.log("fetching url: " + url);
        fetch(url).then(function(response) {
            return response.text();
        }).then(function(xml) {
            //console.log(xml);
            return (new DOMParser()).parseFromString(xml, "text/xml");
        }).then(function(xml) {
            //console.log(xml.getElementsByTagName("temperature")[0].getAttribute("value"));
            //console.log("Got JSON response from server:" + XML.stringify(xml));
            let temperature = Math.floor(xml.getElementsByTagName("temperature")[0].getAttribute("value")); //TODO: fix
            let rain = xml.getElementsByTagName("precipitation")[0].getAttribute("value") > 1; //TODO: fix
            let weather = {
                "weather": true,
                "rain": rain,
                "maxTemparature": temperature,
                "minTemparature": temperature,
                "nowTemperature": temperature
            };

            resolve(weather);
        }).catch(function (error) {
            reject(error);
        });
    });
}
