import * as messaging from "messaging";
import {HFitUI} from "./ui.js";
import document from "document";

let ui = new HFitUI();

ui.updateUI("disconnected");

// Listen for the onopen event
messaging.peerSocket.onopen = function () {
    ui.updateUI("loading");
    messaging.peerSocket.send({
        key: "use_saved_position"
    });
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function (evt) {
    ui.updateUI("loaded", evt.data);
}

// Listen for the onerror event
messaging.peerSocket.onerror = function (err) {
    // Handle any errors
    ui.updateUI("error");
}

document.onkeypress = function (e) {
    if (e.key == "up") {
        messaging.peerSocket.send({
            key: "refresh_all"
        });
    }

}
