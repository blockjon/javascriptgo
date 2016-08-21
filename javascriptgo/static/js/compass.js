"use strict";

var activateCompass = function(headingChangeCallback) {

    // our current position
    var positionCurrent = {
        lat: null,
        lng: null,
        hng: null
    };

    // the orientation of the device on app load
    var defaultOrientation;

    // browser agnostic orientation
    function getBrowserOrientation() {
        var orientation;
        if (screen.orientation && screen.orientation.type) {
          orientation = screen.orientation.type;
        } else {
          orientation = screen.orientation ||
                        screen.mozOrientation ||
                        screen.msOrientation;
        }

        /*
          'portait-primary':      for (screen width < screen height, e.g. phone, phablet, small tablet)
                                    device is in 'normal' orientation
                                  for (screen width > screen height, e.g. large tablet, laptop)
                                    device has been turned 90deg clockwise from normal

          'portait-secondary':    for (screen width < screen height)
                                    device has been turned 180deg from normal
                                  for (screen width > screen height)
                                    device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal

          'landscape-primary':    for (screen width < screen height)
                                    device has been turned 90deg clockwise from normal
                                  for (screen width > screen height)
                                    device is in 'normal' orientation

          'landscape-secondary':  for (screen width < screen height)
                                    device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal
                                  for (screen width > screen height)
                                    device has been turned 180deg from normal
        */

        return orientation;
    }

    // called on device orientation change
    function onHeadingChange(event) {
        var heading = event.alpha;

        if (typeof event.webkitCompassHeading !== "undefined") {
          heading = event.webkitCompassHeading; //iOS non-standard
        }

        var orientation = getBrowserOrientation();

        if (typeof heading !== "undefined" && heading !== null) { // && typeof orientation !== "undefined") {
          // we have a browser that reports device heading and orientation


          // what adjustment we have to add to rotation to allow for current device orientation
          var adjustment = 0;
          if (defaultOrientation === "landscape") {
            adjustment -= 90;
          }

          if (typeof orientation !== "undefined") {
            var currentOrientation = orientation.split("-");

            if (defaultOrientation !== currentOrientation[0]) {
              if (defaultOrientation === "landscape") {
                adjustment -= 270;
              } else {
                adjustment -= 90;
              }
            }

            if (currentOrientation[1] === "secondary") {
              adjustment -= 180;
            }
          }

          positionCurrent.hng = heading + adjustment;

          var phase = positionCurrent.hng < 0 ? 360 + positionCurrent.hng : positionCurrent.hng;
          headingChangeCallback(360 - phase | 0);

        } else {
          // device can't show heading
          $("#heading").text("");
        }
    }

    function locationUpdate(position) {
        positionCurrent.lat = position.coords.latitude;
        positionCurrent.lng = position.coords.longitude;
    }

    function locationUpdateFail(error) {
        console.log("location fail: ", error);
    }

    window.addEventListener("deviceorientation", onHeadingChange);

    navigator.geolocation.watchPosition(locationUpdate, locationUpdateFail, {
        enableHighAccuracy: false,
        maximumAge: 30000,
        timeout: 27000
    });

};
