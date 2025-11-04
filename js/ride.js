/*global GDronez _config*/

var GDronez = window.GDronez || {};
GDronez.map = GDronez.map || {};

(function rideScopeWrapper($) {
    var authToken;
    GDronez.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
    function requestDrone(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/flight',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your drone:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        var drone;
        console.log('Response received from API: ', result);
        drone = result.Drone;
        displayUpdate(drone.Name + ', your ' + drone.Color + ' drone, is coming');
        animateArrival(function animateCallback() {
            displayUpdate(drone.Name + ' has arrived. Get flying!');
            GDronez.map.unsetLocation();
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $(GDronez.map).on('pickupChange', handlePickupChanged);

        GDronez.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Drone');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        var pickupLocation = GDronez.map.selectedPoint;
        event.preventDefault();
        requestDrone(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = GDronez.map.selectedPoint;
        var origin = {};

        if (dest.latitude > GDronez.map.center.latitude) {
            origin.latitude = GDronez.map.extent.minLat;
        } else {
            origin.latitude = GDronez.map.extent.maxLat;
        }

        if (dest.longitude > GDronez.map.center.longitude) {
            origin.longitude = GDronez.map.extent.minLng;
        } else {
            origin.longitude = GDronez.map.extent.maxLng;
        }

        GDronez.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));

