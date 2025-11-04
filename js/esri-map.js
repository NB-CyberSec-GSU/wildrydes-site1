/*global GDronez _config*/

var GDronez = window.GDronez || {};
GDronez.map = GDronez.map || {};

(function esriMapScopeWrapper($) {
    require([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/symbols/TextSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/geometry/support/webMercatorUtils',
        'dojo/domReady!'
    ], function requireCallback(
        Map, MapView,
        Graphic, Point, TextSymbol,
        PictureMarkerSymbol, webMercatorUtils
    ) {
        var drMap = GDronez.map;

        var map = new Map({ basemap: 'gray-vector' });

        var view = new MapView({
            center: [-122.31, 47.60],
            container: 'map',
            map: map,
            zoom: 12
        });

        var pinSymbol = new TextSymbol({
            color: '#f50856',
            text: '\ue61d',
            font: {
                size: 20,
                family: 'CalciteWebCoreIcons'
            }
        });

        var droneSymbol = new PictureMarkerSymbol({
            url: '/images/drone-icon.png',
            width: '25px',
            height: '25px'
        });

        var pinGraphic;
        var droneGraphic;

        function updateCenter(newValue) {
            drMap.center = {
                latitude: newValue.latitude,
                longitude: newValue.longitude
            };
        }

        function updateExtent(newValue) {
            var min = webMercatorUtils.xyToLngLat(newValue.xmin, newValue.ymin);
            var max = webMercatorUtils.xyToLngLat(newValue.xmax, newValue.ymax);
            drMap.extent = {
                minLng: min[0],
                minLat: min[1],
                maxLng: max[0],
                maxLat: max[1]
            };
        }

        view.watch('extent', updateExtent);
        view.watch('center', updateCenter);
        view.then(function onViewLoad() {
            updateExtent(view.extent);
            updateCenter(view.center);
        });

        view.on('click', function handleViewClick(event) {
            drMap.selectedPoint = event.mapPoint;
            view.graphics.remove(pinGraphic);
            pinGraphic = new Graphic({
                symbol: pinSymbol,
                geometry: drMap.selectedPoint
            });
            view.graphics.add(pinGraphic);
            $(drMap).trigger('pickupChange');
        });

        drMap.animate = function animate(origin, dest, callback) {
            var startTime;
            var step = function animateFrame(timestamp) {
                var progress;
                var progressPct;
                var point;
                var deltaLat;
                var deltaLon;
                if (!startTime) startTime = timestamp;
                progress = timestamp - startTime;
                progressPct = Math.min(progress / 2000, 1);
                deltaLat = (dest.latitude - origin.latitude) * progressPct;
                deltaLon = (dest.longitude - origin.longitude) * progressPct;
                point = new Point({
                    longitude: origin.longitude + deltaLon,
                    latitude: origin.latitude + deltaLat
                });
                view.graphics.remove(droneGraphic);
                droneGraphic = new Graphic({
                    geometry: point,
                    symbol: droneSymbol
                });
                view.graphics.add(droneGraphic);
                if (progressPct < 1) {
                    requestAnimationFrame(step);
                } else {
                    callback();
                }
            };
            requestAnimationFrame(step);
        };

        drMap.unsetLocation = function unsetLocation() {
            view.graphics.remove(pinGraphic);
        };
    });
}(jQuery));

