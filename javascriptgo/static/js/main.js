// GPS enbaled javascript only works on HTTPS. Bump to HTTPS when in production.
if (window.location.toString().indexOf("heroku") > -1 && window.location.protocol != "https:") {
    window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
}

// My free mapbox token. Swap out with your own.
mapboxgl.accessToken = 'pk.eyJ1IjoiamJsb2NrMTIzIiwiYSI6ImNhNDE1NmU0YmY0MGQzOWVjZmJhM2JiODJmMGRhMDc5In0.mgAjjTxHchzCtEQcNOZAiw';

var createLocation = function(lat, lng) {
    return {
        'lat': lat,
        'lng': lng
    };
};

var radians = function(n) {
    return n * (Math.PI / 180);
};

var degrees = function(n) {
    return n * (180 / Math.PI);
};

var milesDistance = function(point1, point2, unit) {
	var radlat1 = Math.PI * point1.lat/180;
	var radlat2 = Math.PI * point2.lat/180;
	var theta = point1.lng-point2.lng;
	var radtheta = Math.PI * theta/180;
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist);
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
	if (unit=="K") { dist = dist * 1.609344 };
	if (unit=="N") { dist = dist * 0.8684 };
	return dist;
};

var distanceInFeet = function(point1, point2) {
    var md = milesDistance(point1, point2);
    return 5280 * md;
};

var getBearing = function(startLat,startLong,endLat,endLong) {
    startLat = radians(startLat);
    startLong = radians(startLong);
    endLat = radians(endLat);
    endLong = radians(endLong);

    var dLong = endLong - startLong;

    var dPhi = Math.log(Math.tan(endLat/2.0+Math.PI/4.0)/Math.tan(startLat/2.0+Math.PI/4.0));
    if (Math.abs(dLong) > Math.PI){
    if (dLong > 0.0)
        dLong = -(2.0 * Math.PI - dLong);
    else
        dLong = (2.0 * Math.PI + dLong);
    }
    return (degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
}

var createLocationManager = function(map) {
    var lastUserLocation;
    var recentLocations = [];
    var _flyTo = function(location, zoom) {
        if (zoom === undefined) {
              zoom = 17;
        }
        map.flyTo({
            center: [location.lng, location.lat],
            zoom: zoom,
            speed: 0.03, // make the flying slow
            curve: 1 // change the speed at which it zooms out
        });
    };
    var _snapTo = function(location, zoom) {
        if (zoom === undefined) {
              zoom = 17;
        }
        map.setCenter([location.lng, location.lat]);
        map.setZoom(zoom);
    };
    var _setBearing = function() {
        var bearings = [];
        var averageBearingSum = 0;
        if (recentLocations.length > 1) {
            for (var i=0; i< recentLocations.length; i++) {
                if (i == 0) {
                    continue;
                }
                var thisLocation = recentLocations[i];
                var lastLocation = recentLocations[i-1];
                bearings.push(getBearing(
                    thisLocation.lat,
                    thisLocation.lng,
                    lastLocation.lat,
                    lastLocation.lng
                ));
            }
            for (var i=0; i<bearings.length; i++) {
                var thisBearing = bearings[i];
                if (thisBearing > 180) {
                    thisBearing -= 360;
                }
                averageBearingSum += thisBearing;
            }
            var averageBearing = averageBearingSum / recentLocations.length;
            if (averageBearing < 0) {
                averageBearing += 360;
            }
            // Reverse the bearing perspective for the correct camera angle.
            map.easeTo({
                bearing: averageBearing + 180,
                duration: 5000, // make the flying slow
            });
            $("#bearing").text("Bearing: " + Math.round(averageBearing) + "°");
        }
    };

    var _handleUserLocationUpdate = function(location) {
        var feetDistance;
        if (lastUserLocation === undefined) {
            $("#loading_screen").hide();
            $("#game_interface").css('visibility', 'visible');
            $("#crosshairs").show();
            _snapTo(location);
        } else {
            _flyTo(location);
        }

        // Remember the last user location.
        lastUserLocation = location;

        // Remember this recent location as long as its further than 10 feet
        // away from the very last one.
        if (recentLocations.length == 0) {
            recentLocations.push(location);
            return;
        }
        var lastTrackedLocation = recentLocations[recentLocations.length-1];
        var dinstanceSinceLastLocationUpdate = Math.round(distanceInFeet(location, lastTrackedLocation));
        if (dinstanceSinceLastLocationUpdate == 0) {
            return;
        }
        if (dinstanceSinceLastLocationUpdate > 3) {
            recentLocations.push(location);
            if (recentLocations.length > 4) {
                recentLocations.shift();
            }
            _setBearing();
        }
    };
    return {
        'updateUserLocation': function(location) {
            _handleUserLocationUpdate(location);
        }
    }

};

$(function() {

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9',
        pitch: 60,
        zoom: 8,
        interactive: false
    });
    map.touchZoomRotate.enableRotation();

    // Create map manager.
    locationManager = createLocationManager(map);

    // Disable ability to move the crosshairs.
    $('#crosshairs').on('dragstart', function(event) { event.preventDefault(); });

    map.on('load', function () {$("#loading_screen").show();});

    $('body').on('click', '#ok_button', function(event) {
        $("#understand_location_prompt_container").hide();
        $("#waiting_for_location").show();
        // Listen for GPS changes detected by the browser.
        navigator.geolocation.watchPosition(function(position) {
            locationManager.updateUserLocation(createLocation(
                position.coords.latitude,
                position.coords.longitude
            ));
        });
        activateCompass(function(heading) {
            // map.setBearing(heading);
            // Rotate the crosshairs and emit the heading into the top right for reference.
            $("#crosshairs img").css("-webkit-transform", "rotateX(60deg) rotate(" + heading + "deg)");
            $("#crosshairs img").css("transform", "rotateX(60deg) rotate(" + heading + "deg)");
            $("#heading").text("Compass: " + heading + "°");
        });
    });
});

