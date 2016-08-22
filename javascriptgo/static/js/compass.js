"use strict";

/**
 * Register a callback function to fireu when the device orientation changes.
 */
var activateRotationListener = function(headingChangeCallback) {
    window.addEventListener("deviceorientation", function(event) {
        headingChangeCallback(Math.round(event.alpha));
    });
};
