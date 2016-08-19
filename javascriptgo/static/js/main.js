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

var createLocationManager = function(map) {
    var lastUserLocation;
    var _flyTo = function(location, zoom) {
        if (zoom === undefined) {
              zoom = 17;
        }
        map.flyTo({
            center: [location.lng, location.lat],
            zoom: zoom
        });
    };
    var _snapTo = function(location, zoom) {
        if (zoom === undefined) {
              zoom = 17;
        }
        map.setCenter([location.lng, location.lat]);
        map.setZoom(zoom);
    };

    var _handleUserLocationUpdate = function(location) {
        if (lastUserLocation === undefined) {
            $("#loading_screen").hide();
            $("#game_interface").show();
            $("#crosshairs").show();
            _snapTo(location);
        } else {
            _flyTo(location);
        }
        lastUserLocation = location;

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

    // Create map manager.
    var locationManager = createLocationManager(map);

    // Disable ability to move the crosshairs.
    $('#crosshairs').on('dragstart', function(event) { event.preventDefault(); });

    $("#loading_screen").show();

    $('body').on('click', '#understand_location_prompt', function(event) {
        // Listen for GPS changes detected by the browser.
        navigator.geolocation.watchPosition(function(position) {
            locationManager.updateUserLocation(createLocation(
                position.coords.latitude,
                position.coords.longitude
            ));
        });
    });
});
