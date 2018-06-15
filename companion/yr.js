import { marknote } from "./marknote.js"

export function YrAPI() {
};

YrAPI.prototype.realTimeWeather = function(lat, lon) {
  let self = this;
  let startDate = new Date().addHours(-1).getTime();
  let endDate = new Date().addHours(8).getTime();
  let MS_PER_HOUR = 3600000;
  return new Promise(function(resolve, reject) {
    let url = "https://api.met.no/weatherapi/locationforecast/1.9/";
    url = url + "?lat=" + lat + "&lon=" + lon;
    
    console.log("fetching url: " + url);
    fetch(url).then(function(response) {
      return response.text();
    }).then(function(xml) {
      return new marknote.Parser().parse(xml);
    }).then(function(xml) {
      console.log("Yr http response recieved, parsing data...");
      let timeList = xml.getRootElement().getChildElement("product").getChildElements();
      
      var minTemp = 1000;
      var maxTemp = -1000;
      var maxMmRainAnHour = 0;
      var nowTemp = -1000;
      
      for (let i = 0; i < 50; i++) {
        let timestampFrom = Date.parse(timeList[i].getAttributeValue("from"));        
        if (timestampFrom >= startDate && timestampFrom <= endDate) {
          
          let timestampTo = Date.parse(timeList[i].getAttributeValue("to"));  
          if (timestampTo > endDate) {
            continue;
          }         
          let locationEle = timeList[i].getChildElement("location");
          
          let nowTemparatureEle = locationEle.getChildElement("temperature");
          if (nowTemparatureEle !== undefined) {
            if (timestampFrom <= (startDate + MS_PER_HOUR)) {
              nowTemp = nowTemparatureEle.getAttributeValue("value");
            } else if (timestampFrom <= (startDate + 2*MS_PER_HOUR) && nowTemp === -1000) {
              nowTemp = nowTemparatureEle.getAttributeValue("value");
            }
            //console.log("i: " + i);
          }
          
          let minTempEle = locationEle.getChildElement("minTemperature");
          if (minTempEle !== undefined) {              
            let minTempValue = minTempEle.getAttributeValue("value");
            if (minTempValue < minTemp) {
              minTemp = minTempValue;
            }
            //console.log("i: " + i);
          }
          
          let maxTempEle = locationEle.getChildElement("maxTemperature");
          if (maxTempEle !== undefined) {
            let maxTempValue = maxTempEle.getAttributeValue("value");
            if (maxTempValue > minTemp) {
              maxTemp = maxTempValue;
            }
            //console.log("i: " + i);
          }
          
          let rainEle = locationEle.getChildElement("precipitation");
          if (rainEle !== undefined) {              
            let rainInMm = rainEle.getAttributeValue("value");
            if (rainInMm > 0) {
              let hours = (timestampTo - timestampFrom) / 3600000;
              let rainInMmPerHour = rainInMm / hours;
              if (rainInMmPerHour > maxMmRainAnHour) {
                maxMmRainAnHour = rainInMmPerHour;
              }
              //console.log("i: " + i);
            }
          }
        }
      }
      
      let weather = {
              "weather": true,
              "rainInMm": maxMmRainAnHour,
              "maxTemparature": maxTemp,
              "minTemparature": minTemp,
              "nowTemperature": nowTemp
            };
      console.log("rain in mm: " + maxMmRainAnHour);
      console.log("now temp: " + nowTemp);
      console.log("min temp: " + minTemp);
      console.log("max temp: " + maxTemp);
      resolve(weather);
    }).catch(function (error) {
      reject(error);
    });
  });
}

Date.prototype.addHours = function(h) {    
   this.setTime(this.getTime() + (h*60*60*1000)); 
   return this;   
}