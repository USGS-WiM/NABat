/**
 * Created by bdraper on 4/27/2015.
 */
//IMPORTANT: replace eventName variable below with desired event name from STN Event
var eventName = "Joaquin";
//IMPORTANT(optional):replace eventType variable below with event type, i.e. "Hurricane", where applicable. If not a hurricane, leave string empty.
var eventType = "Hurricane";
//the map services root variable should be static, but change if necessary
var mapServicesRoot = "http://stnmapservices.wimcloud.usgs.gov:6080/arcgis/rest/services/STN";
//stnDomain variable should be static, but change if necessary
var stnDomain = "stn.wim.usgs.gov";
var allLayers;

require([
    "esri/geometry/Extent",
    "esri/layers/WMSLayerInfo",
    "esri/layers/FeatureLayer",
    'dojo/domReady!'
], function(
    Extent,
    WMSLayerInfo,
    FeatureLayer
) {

    allLayers = [
        {
            "groupHeading": "Event Data",
            "showGroupHeading": true,
            "includeInLayerList": true,
            "layers": {
                "USGS Gages" : {
                    "url": "http://wim.usgs.gov/arcgis/rest/services/USGS_RTstreamgages/MapServer",
                    "options": {
                        "id": "gages",
                        "opacity": 1,
                        "visible": true,
                        "outFields": ["*"]
                    },
                    "wimOptions": {
                        "type": "layer",
                        "layerType": "agisDynamic",
                        "includeInLayerList": true,
                        "includeLegend": true,
                        "identifiable" :true
                    }
                }
            }
        }
    ]

});





