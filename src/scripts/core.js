//for jshint
'use strict';
// Generated on 2015-04-13 using generator-wim 0.0.1

/**
 * Created by bdraper on 4/3/2015.
 */

var map;
var allLayers;
var maxLegendHeight;
var maxLegendDivHeight;
var identifyLayers = [];

require([
    'esri/map',
    "esri/dijit/HomeButton",
    "esri/dijit/LocateButton",
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/dijit/Geocoder',
    'esri/dijit/PopupTemplate',
    'esri/graphic',
    "esri/graphicsUtils",
    'esri/geometry/Multipoint',
    'esri/symbols/PictureMarkerSymbol',
    "esri/geometry/webMercatorUtils",
    'dojo/dom',
    'dojo/on',
    'dojo/domReady!'
], function (
    Map,
    HomeButton,
    LocateButton,
    ArcGISTiledMapServiceLayer,
    Geocoder,
    PopupTemplate,
    Graphic,
    graphicsUtils,
    Multipoint,
    PictureMarkerSymbol,
    webMercatorUtils,
    dom,
    on
) {
    map = new Map('mapDiv', {
        basemap: 'gray',
        //extent below is for east coast landfall
        center: [-92.336, 41.278],
        //extent below for gulf of mexico landfall
        //center: [-84.349, 32.008],
        zoom: 5
    });
    var home = new HomeButton({
        map: map
    }, "homeButton");
    home.startup();

    var geoLocate = new LocateButton({
        map: map
    }, "locateButton");
    geoLocate.startup();

    /////////////////////////////////////////////////////////////////////////////////////////
    //following block forces map size to override problems with default behavior
    $(window).resize(function () {
        if ($("#legendCollapse").hasClass('in')) {
            maxLegendHeight =  ($('#mapDiv').height()) * 0.90;
            $('#legendElement').css('height', maxLegendHeight);
            $('#legendElement').css('max-height', maxLegendHeight);
            maxLegendDivHeight = ($('#legendElement').height()) - parseInt($('#legendHeading').css("height").replace('px',''));
            $('#legendDiv').css('max-height', maxLegendDivHeight);
        }
        else {
            $('#legendElement').css('height', 'initial');
        }
    });

    //displays map scale on map load
    on(map, "load", function() {
        var scale =  map.getScale().toFixed(0);
        $('#scale')[0].innerHTML = addCommas(scale);
        var initMapCenter = webMercatorUtils.webMercatorToGeographic(map.extent.getCenter());
        $('#latitude').html(initMapCenter.y.toFixed(3));
        $('#longitude').html(initMapCenter.x.toFixed(3));
    });
    //displays map scale on scale change (i.e. zoom level)
    on(map, "zoom-end", function () {
        var scale =  map.getScale().toFixed(0);
        $('#scale')[0].innerHTML = addCommas(scale);
    });

    //updates lat/lng indicator on mouse move. does not apply on devices w/out mouse. removes "map center" label
    on(map, "mouse-move", function (cursorPosition) {
        $('#mapCenterLabel').css("display", "none");
        if (cursorPosition.mapPoint !== null) {
            var geographicMapPt = webMercatorUtils.webMercatorToGeographic(cursorPosition.mapPoint);
            $('#latitude').html(geographicMapPt.y.toFixed(3));
            $('#longitude').html(geographicMapPt.x.toFixed(3));
        }
    });
    //updates lat/lng indicator to map center after pan and shows "map center" label.
    on(map, "pan-end", function () {
        //displays latitude and longitude of map center
        $('#mapCenterLabel').css("display", "inline");
        var geographicMapCenter = webMercatorUtils.webMercatorToGeographic(map.extent.getCenter());
        $('#latitude').html(geographicMapCenter.y.toFixed(3));
        $('#longitude').html(geographicMapCenter.x.toFixed(3));
    });

    var nationalMapBasemap = new ArcGISTiledMapServiceLayer('http://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer', {visible: false});
    map.addLayer(nationalMapBasemap);
    //on clicks to swap basemap. visibility toggling is required for nat'l map b/c it is not technically a basemap, but a tiled layer.
    on(dom.byId('btnStreets'), 'click', function () {
        map.setBasemap('streets');
        nationalMapBasemap.setVisibility(false);
    });
    on(dom.byId('btnSatellite'), 'click', function () {
        map.setBasemap('satellite');
        nationalMapBasemap.setVisibility(false);
    });
    on(dom.byId('btnHybrid'), 'click', function () {
        map.setBasemap('hybrid');
        nationalMapBasemap.setVisibility(false);
    });
    on(dom.byId('btnTerrain'), 'click', function () {
        map.setBasemap('terrain');
        nationalMapBasemap.setVisibility(false);
    });
    on(dom.byId('btnGray'), 'click', function () {
        map.setBasemap('gray');
        nationalMapBasemap.setVisibility(false);
    });
    on(dom.byId('btnNatGeo'), 'click', function () {
        map.setBasemap('national-geographic');
        nationalMapBasemap.setVisibility(false);
    });
    on(dom.byId('btnOSM'), 'click', function () {
        map.setBasemap('osm');
        nationalMapBasemap.setVisibility(false);
    });
    on(dom.byId('btnTopo'), 'click', function () {
        map.setBasemap('topo');
        nationalMapBasemap.setVisibility(false);
    });
    on(dom.byId('btnNatlMap'), 'click', function () {
        nationalMapBasemap.setVisibility(true);
    });

    var geocoder = new Geocoder({
        value: '',
        maxLocations: 25,
        autoComplete: true,
        arcgisGeocoder: true,
        autoNavigate: false,
        map: map
    }, 'geosearch');
    geocoder.startup();
    geocoder.on('select', geocodeSelect);
    geocoder.on('findResults', geocodeResults);
    geocoder.on('clear', clearFindGraphics);
    on(geocoder.inputNode, 'keydown', function (e) {
        if (e.keyCode == 13) {
            setSearchExtent();
        }
    });

    // Symbols
    var sym = createPictureSymbol('../images/purple-pin.png', 0, 12, 13, 24);

    map.on('load', function (){
        map.infoWindow.set('highlight', false);
        map.infoWindow.set('titleInBody', false);
    });

    // Geosearch functions
    on(dom.byId('btnGeosearch'),'click', geosearch);

    // Optionally confine search to map extent
    function setSearchExtent (){
        if (dom.byId('chkExtent').checked === true) {
            geocoder.activeGeocoder.searchExtent = map.extent;
        } else {
            geocoder.activeGeocoder.searchExtent = null;
        }
    }
    function geosearch() {
        setSearchExtent();
        var def = geocoder.find();
        def.then(function (res){
            geocodeResults(res);
        });
        // Close modal
        $('#geosearchModal').modal('hide');
    }
    function geocodeSelect(item) {
        clearFindGraphics();
        var g = (item.graphic ? item.graphic : item.result.feature);
        g.setSymbol(sym);
        addPlaceGraphic(item.result,g.symbol);
        // Close modal
        //below is line that hides modal after selection in input
        //$('#geosearchModal').modal('hide');
    }
    function geocodeResults(places) {
        places = places.results;
        if (places.length > 0) {
            clearFindGraphics();
            var symbol = sym;
            // Create and add graphics with pop-ups
            for (var i = 0; i < places.length; i++) {
                addPlaceGraphic(places[i], symbol);
            }
            zoomToPlaces(places);
        } else {
            //alert('Sorry, address or place not found.');  // TODO
        }
    }
    function stripTitle(title) {
        var i = title.indexOf(',');
        if (i > 0) {
            title = title.substring(0,i);
        }
        return title;
    }
    function addPlaceGraphic(item,symbol)  {
        var place = {};
        var attributes,infoTemplate,pt,graphic;
        pt = item.feature.geometry;
        place.address = item.name;
        place.score = item.feature.attributes.Score;
        // Graphic components
        attributes = { address:stripTitle(place.address), score:place.score, lat:pt.getLatitude().toFixed(2), lon:pt.getLongitude().toFixed(2) };
        infoTemplate = new PopupTemplate({title:'{address}', description: 'Latitude: {lat}<br/>Longitude: {lon}'});
        graphic = new Graphic(pt,symbol,attributes,infoTemplate);
        // Add to map
        map.graphics.add(graphic);
    }

    function zoomToPlaces(places) {
        var multiPoint = new Multipoint(map.spatialReference);
        for (var i = 0; i < places.length; i++) {
            multiPoint.addPoint(places[i].feature.geometry);
        }
        map.setExtent(multiPoint.getExtent().expand(2.0));
    }

    function clearFindGraphics() {
        map.infoWindow.hide();
        map.graphics.clear();
    }

    function createPictureSymbol(url, xOffset, yOffset, xWidth, yHeight) {
        return new PictureMarkerSymbol(
            {
                'angle': 0,
                'xoffset': xOffset, 'yoffset': yOffset, 'type': 'esriPMS',
                'url': url,
                'contentType': 'image/png',
                'width':xWidth, 'height': yHeight
            });
    }
    // Show modal dialog; handle legend sizing (both on doc ready)
    $(document).ready(function(){

        $('.eventType').html(eventType + '&nbsp;');
        $('.eventName').html(eventName);
        $('#disclaimerModal').modal({backdrop: 'static'});
        $('#disclaimerModal').modal('show');

        function showModal() {
            $('#geosearchModal').modal('show');
        }
        // Geosearch nav menu is selected
        $('#geosearchNav').click(function(){
            showModal();
        });

        function showAboutModal () {
            $('#aboutModal').modal('show');
        }
        $('#aboutNav').click(function(){
            showAboutModal();
        });

        $("#html").niceScroll();
        $("#sidebar").niceScroll();
        $("#sidebar").scroll(function () {
            $("#sidebar").getNiceScroll().resize();
        });

        $("#legendDiv").niceScroll();

        maxLegendHeight =  ($('#mapDiv').height()) * 0.90;
        $('#legendElement').css('max-height', maxLegendHeight);

        $('#legendCollapse').on('shown.bs.collapse', function () {
            maxLegendHeight =  ($('#mapDiv').height()) * 0.90;
            $('#legendElement').css('max-height', maxLegendHeight);
            maxLegendDivHeight = ($('#legendElement').height()) - parseInt($('#legendHeading').css("height").replace('px',''));
            $('#legendDiv').css('max-height', maxLegendDivHeight);
        });

        $('#legendCollapse').on('hide.bs.collapse', function () {
            $('#legendElement').css('height', 'initial');
        });

        $('#sensorModal').on('hidden.bs.modal', function () {
            $('#rdgChartDiv').empty();
        });

    });

    require([
        'esri/dijit/Legend',
        'esri/tasks/locator',
        'esri/tasks/query',
        'esri/tasks/QueryTask',
        "esri/tasks/IdentifyTask",
        "esri/tasks/IdentifyParameters",
        'esri/graphicsUtils',
        'esri/geometry/Point',
        'esri/geometry/Extent',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/layers/FeatureLayer',
        'esri/layers/WMSLayer',
        'esri/layers/WMSLayerInfo',
        'dijit/form/CheckBox',
        'dijit/form/RadioButton',
        "dojo/request/xhr",
        'dojo/query',
        'dojo/dom',
        'dojo/dom-class',
        'dojo/dom-construct',
        'dojo/dom-style',
        'dojo/on'
    ], function(
        Legend,
        Locator,
        Query,
        QueryTask,
        IdentifyTask,
        IdentifyParameters,
        graphicsUtils,
        Point,
        Extent,
        ArcGISDynamicMapServiceLayer,
        FeatureLayer,
        WMSLayer,
        WMSLayerInfo,
        CheckBox,
        RadioButton,
        xhr,
        query,
        dom,
        domClass,
        domConstruct,
        domStyle,
        on
    ) {

        var legendLayers = [];
        var layersObject = [];
        var layerArray = [];
        var staticLegendImage;
        var identifyTask, identifyParams;
        var navToolbar;
        var locator;

        //create global layers lookup
        var mapLayers = [];

        $.each(allLayers, function (index,group) {
            console.log('processing: ', group.groupHeading);

            //sub-loop over layers within this groupType
            $.each(group.layers, function (layerName,layerDetails) {

                //check for exclusiveGroup for this layer
                var exclusiveGroupName = '';
                if (layerDetails.wimOptions.exclusiveGroupName) {
                    exclusiveGroupName = layerDetails.wimOptions.exclusiveGroupName;
                }

                if (layerDetails.wimOptions.layerType === 'agisFeature') {
                    var layer = new FeatureLayer(layerDetails.url, layerDetails.options);
                    //check if include in legend is true
                    if (layerDetails.wimOptions && layerDetails.wimOptions.includeLegend === true){
                        legendLayers.push({layer:layer, title: layerName});
                    }
                    addLayer(group.groupHeading, group.showGroupHeading, layer, layerName, exclusiveGroupName, layerDetails.options, layerDetails.wimOptions);
                    //addMapServerLegend(layerName, layerDetails);

                    on(layer, "click", function (evt) {

                        if (evt.graphic.attributes.INSTRUMENT_ID !== undefined) {
                            $('#sensorEvent').html(evt.graphic.attributes.EVENT_NAME);
                            $('#city').html(evt.graphic.attributes.CITY);
                            $('#county').html(evt.graphic.attributes.COUNTY);
                            $('#state').html(evt.graphic.attributes.STATE);
                            $('.latLng').html(evt.graphic.attributes.LATITUDE_DD.toFixed(4) +', ' + evt.graphic.attributes.LONGITUDE_DD.toFixed(4));
                            $('#siteName').html(evt.graphic.attributes.SITE_NAME);
                            $('#status').html(evt.graphic.attributes.STATUS);

                            $('#sensorDataLink').html('<a target="_blank" href="http://' + stnDomain + '/STNWeb/Public/SensorInfoPage?siteId=' + evt.graphic.attributes.SITE_ID +'&sensorId=' + evt.graphic.attributes.INSTRUMENT_ID +'">Sensor&nbsp;' + evt.graphic.attributes.INSTRUMENT_ID + '</a>');

                            var layerId = evt.currentTarget.id.replace('_layer', '');
                            var layerName = map.getLayer(layerId).name;
                            $('.sensorTypeTitle').html(layerName +'&nbsp'+ evt.graphic.attributes.INSTRUMENT_ID);

                            //update peak conditions table with a fresh header row
                            $('#peaksTable').html('<tr><th>Peak Stage (ft)</th><th>Peak Date & Time</th><th>Datum</th></tr>');

                            var geometry = evt.mapPoint.x + "," + evt.mapPoint.y;
                            var mapExtent = map.extent.xmin + "," + map.extent.ymin + "," + map.extent.xmax + "," + map.extent.ymax;
                            var imageDisplay = (map.height + "," + map.width + "," + 96);
                            var peaksServiceURL = mapServicesRoot + "/Peaks/MapServer";
                            $.ajax({
                                dataType: 'json',
                                type: 'GET',
                                url: peaksServiceURL + '/identify?f=json&geometry=' + geometry + '&tolerance=3&mapExtent=' + mapExtent + '&layerDefs=0%3AEVENT_NAME%3D%27' + eventName + '%27' + '&imageDisplay=' + imageDisplay,
                                headers: {'Accept': '*/*'},
                                success: function (data) {
                                    if (data.results.length > 0) {
                                        for (var i = 0; i < data.results.length; i++) {
                                            var attributes = data.results[i].attributes;
                                            //append each peak result as a new table row
                                            $('#peaksTable').append('<tr><td>' + attributes.PEAK_STAGE + '</td><td>' + attributes.PEAK_DATE + '</td><td>' + attributes.DATUM_NAME + '</td></tr>');
                                        }
                                    } else {
                                        $('#peaksTable').html('No peaks associated with this location');
                                    }
                                },
                                error: function (error) {
                                    console.log("Error processing the peaks JSON response. The error is:" + error);
                                    $('#peaksTable').html('An error occurred retrieving peaks data. Please try again. ');
                                }

                            });

                            if (evt.graphic.attributes.SENSOR == "Rapid Deployment Gage") {

                                $('#rdgChartDiv').html('<i class="fa fa-circle-o-notch fa-spin fa-2x"></i>');

                                //var to hold USGS ID of stn site after retrieval by ajax call below
                                var usgsID = "";
                                var stnSiteID = evt.graphic.attributes.SITE_ID;
                                //ajax call to retrieve the USGS site ID from the sites endpoint, based on STN site ID. Needed to make NWIS request
                                $.ajax({
                                    dataType: 'json',
                                    type: 'GET',
                                    url: "http://stn.wim.usgs.gov/STNServices/Sites/" + stnSiteID + ".json",
                                    headers: {'Accept': '*/*'},
                                    success: function (data) {
                                        usgsID = data.USGS_SID;

                                        //$('#rdgChartDiv').html('<i class="fa fa-circle-o-notch fa-spin"></i>');

                                        //dojo xhr request to nwisChart proxy
                                        xhr("/proxies/rdgChartProxy/Default.aspx",{
                                            query: {
                                                site_no: usgsID,
                                                //chart_param: "00065",
                                                //days_prev_to_current: "7",
                                                begin_date: "2015-09-25",
                                                end_date: "2015-09-30"
                                            }
                                        }).then(function(result){
                                            if (result.length > 0) {

                                                if((result.indexOf("no data")) == -1) {
                                                    $('#rdgChartDiv').html("<a target='_blank' href='http://waterdata.usgs.gov/usa/nwis/uv?site_no="+ usgsID + "'><img class='img-responsive' src='" + result +"'/></a><br><hr><a target='_blank' href='http://waterdata.usgs.gov/nwis/inventory?agency_code=USGS&site_no="+ usgsID + "'>Link to full NWIS data</a>");

                                                } else {
                                                    $('#rdgChartDiv').html('<h5> <i class="fa fa-frown-o fa-lg"></i> No real-time graph available for this site.</h5><br><hr><a target="_blank" href="http://waterdata.usgs.gov/nwis/inventory?agency_code=USGS&site_no='+ usgsID + '">Link to full data</a>');
                                                }
                                            } else {
                                                console.log("No RDG chart returned");
                                            }
                                        });

                                    },
                                    error: function () {
                                        usgsID = "null";
                                    }

                                });
                            }
                            //end if RDG

                            $('#sensorModal').modal('show');
                            $('#sensorTab').tab('show');
                        }
                        if (evt.graphic.attributes.HWM_ID !== undefined) {
                            $('#hwmEvent').html(evt.graphic.attributes.EVENT_NAME);
                            $('#hwmElev').html(evt.graphic.attributes.ELEV_FT);
                            $('#hwmWaterbody').html(evt.graphic.attributes.WATERBODY);
                            $('#hwmCounty').html(evt.graphic.attributes.COUNTY);
                            $('#hwmState').html(evt.graphic.attributes.STATE);
                            $('.latLng').html(evt.graphic.attributes.LATITUDE_DD.toFixed(4) +', ' + evt.graphic.attributes.LONGITUDE_DD.toFixed(4));
                            $('.hwmID').html(evt.graphic.attributes.HWM_ID);
                            $('#hwmSiteName').html(evt.graphic.attributes.SITE_NAME);
                            $('#hwmDescription').html(evt.graphic.attributes.HWM_LOCATIONDESCRIPTION);
                            $('#hwmType').html(evt.graphic.attributes.HWM_TYPE);
                            $('#hwmDataLink').html('<a target="_blank" href="http://' + stnDomain + '/STNWeb/Public/HWMInfoPage?siteId=' + evt.graphic.attributes.SITE_ID +'&hwmId=' + evt.graphic.attributes.HWM_ID +'">HWM&nbsp;' + evt.graphic.attributes.HWM_ID + '</a>');
                            $('#hwmModal').modal('show');
                        }

                        if (evt.graphic.attributes.Name !== undefined){

                            var nwisSiteId = evt.graphic.attributes.Name;
                            xhr("/proxies/nwisChartProxy/Default.aspx",{
                                query: {
                                    site_no: nwisSiteId,
                                    chart_param: "00065",
                                    days_prev_to_current: "7"
                                }
                            }).then(function(result){
                                if (result.length > 0) {
                                    $('.nwisSiteNo').html(nwisSiteId);
                                    $('#nwisModalBody').html("<a target='_blank' href='http://waterdata.usgs.gov/usa/nwis/uv?site_no="+ nwisSiteId + "'><img src='" + result +"' width=400/></a><br><hr><a target='_blank' href='http://waterdata.usgs.gov/nwis/inventory?agency_code=USGS&site_no="+ nwisSiteId + "'>Link to full data</a>");
                                    $('#nwisModal').modal('show');
                                } else {
                                    $('.nwisSiteNo').html(nwisSiteId);
                                    $('#nwisModalBody').html('<h5> <i class="fa fa-frown-o fa-lg"></i> No real-time graph available for this site.</h5><br><hr><a target="_blank" href="http://waterdata.usgs.gov/nwis/inventory?agency_code=USGS&site_no='+ nwisSiteId + '">Link to full data</a>');
                                    $('#nwisModal').modal('show');
                                }


                            });
                        }//end of "if" block
                    });
                }

                else if (layerDetails.wimOptions.layerType === 'agisWMS') {
                    var layer = new WMSLayer(layerDetails.url, {resourceInfo: layerDetails.options.resourceInfo, visibleLayers: layerDetails.options.visibleLayers }, layerDetails.options);
                    //check if include in legend is true
                    if (layerDetails.wimOptions && layerDetails.wimOptions.includeLegend === true){
                        legendLayers.push({layer:layer, title: layerName});
                    }
                    //map.addLayer(layer);
                    addLayer(group.groupHeading, group.showGroupHeading, layer, layerName, exclusiveGroupName, layerDetails.options, layerDetails.wimOptions);
                    //addMapServerLegend(layerName, layerDetails);
                }

                else if (layerDetails.wimOptions.layerType === 'agisDynamic') {

                    var layer = new ArcGISDynamicMapServiceLayer(layerDetails.url, layerDetails.options);

                    if (layerDetails.wimOptions.identifiable === true){
                        identifyLayers.push({id:layerDetails.options.id, url: layerDetails.url})
                    }
                    //check for layer definition and apply it
                    if (layerDetails.options.layerDefinitions !== null) {
                        var layerDef =[];
                        layerDef.push(layerDetails.options.layerDefinitions);
                        layer.setLayerDefinitions(layerDef);
                    }
                    //check if include in legend is true
                    if (layerDetails.wimOptions && layerDetails.wimOptions.includeLegend === true){
                        legendLayers.push({layer:layer, title: layerName});
                    }
                    if (layerDetails.visibleLayers) {
                        layer.setVisibleLayers(layerDetails.visibleLayers);
                    }
                    //map.addLayer(layer);
                    addLayer(group.groupHeading, group.showGroupHeading, layer, layerName, exclusiveGroupName, layerDetails.options, layerDetails.wimOptions);
                    //addMapServerLegend(layerName, layerDetails);

                    ////identify task here
                    on(map, "click", function (evt) {

                        identifyTask = new IdentifyTask(layerDetails.url);

                        identifyParams = new IdentifyParameters();
                        identifyParams.tolerance = 3;
                        identifyParams.returnGeometry = true;
                        identifyParams.layerIds = [0];
                        identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
                        identifyParams.width = map.width;
                        identifyParams.height = map.height;
                        identifyParams.geometry = evt.mapPoint;
                        identifyParams.mapExtent = map.extent;

                        identifyTask.execute(identifyParams, function(identifyResults){

                            var attributes = identifyResults[0].feature.attributes;
                            $('.nwisSiteNo').html(attributes.Name);
                            $('#nwisModalBody').html(attributes.PopupInfo);
                            $('#nwisModal').modal('show');

                        });
                    });


                }
            });
        });

        function addLayer(groupHeading, showGroupHeading, layer, layerName, exclusiveGroupName, options, wimOptions) {

            //add layer to map
            //layer.addTo(map);
            map.addLayer(layer);

            //add layer to layer list
            mapLayers.push([exclusiveGroupName,camelize(layerName),layer]);

            //check if its an exclusiveGroup item
            if (exclusiveGroupName) {

                if (!$('#' + camelize(exclusiveGroupName)).length) {
                    var exGroupRoot = $('<div id="' + camelize(exclusiveGroupName +" Root") + '" class="btn-group-vertical lyrTog" style="cursor: pointer;" data-toggle="buttons"> <button type="button" class="btn btn-default active" aria-pressed="true" style="font-weight: bold;text-align: left"><i class="glyphspan fa fa-check-square-o"></i>&nbsp;&nbsp;' + exclusiveGroupName + '</button> </div>');

                    exGroupRoot.click(function(e) {
                        exGroupRoot.find('i.glyphspan').toggleClass('fa-check-square-o fa-square-o');

                        $.each(mapLayers, function (index, currentLayer) {

                            var tempLayer = map.getLayer(currentLayer[2].id);

                            if (currentLayer[0] == exclusiveGroupName) {
                                if ($("#" + currentLayer[1]).find('i.glyphspan').hasClass('fa-dot-circle-o') && exGroupRoot.find('i.glyphspan').hasClass('fa-check-square-o')) {
                                    console.log('adding layer: ',currentLayer[1]);
                                    map.addLayer(currentLayer[2]);
                                    var tempLayer = map.getLayer(currentLayer[2].id);
                                    tempLayer.setVisibility(true);
                                } else if (exGroupRoot.find('i.glyphspan').hasClass('fa-square-o')) {
                                    console.log('removing layer: ',currentLayer[1]);
                                    map.removeLayer(currentLayer[2]);
                                }
                            }

                        });
                    });

                    var exGroupDiv = $('<div id="' + camelize(exclusiveGroupName) + '" class="btn-group-vertical" data-toggle="buttons"></div');
                    $('#toggle').append(exGroupDiv);
                }

                //create radio button
                //var button = $('<input type="radio" name="' + camelize(exclusiveGroupName) + '" value="' + camelize(layerName) + '"checked>' + layerName + '</input></br>');
                if (layer.visible) {
                    var button = $('<div id="' + camelize(layerName) + '" class="btn-group-vertical lyrTog" style="cursor: pointer;" data-toggle="buttons"> <label class="btn btn-default"  style="font-weight: bold;text-align: left"> <input type="radio" name="' + camelize(exclusiveGroupName) + '" autocomplete="off"><i class="glyphspan fa fa-dot-circle-o ' + camelize(exclusiveGroupName) + '"></i>&nbsp;&nbsp;' + layerName + '</label> </div>');
                } else {
                    var button = $('<div id="' + camelize(layerName) + '" class="btn-group-vertical lyrTog" style="cursor: pointer;" data-toggle="buttons"> <label class="btn btn-default"  style="font-weight: bold;text-align: left"> <input type="radio" name="' + camelize(exclusiveGroupName) + '" autocomplete="off"><i class="glyphspan fa fa-circle-o ' + camelize(exclusiveGroupName) + '"></i>&nbsp;&nbsp;' + layerName + '</label> </div>');
                }

                $('#' + camelize(exclusiveGroupName)).append(button);

                //click listener for radio button
                button.click(function(e) {

                    if ($(this).find('i.glyphspan').hasClass('fa-circle-o')) {
                        $(this).find('i.glyphspan').toggleClass('fa-dot-circle-o fa-circle-o');

                        var newLayer = $(this)[0].id;

                        $.each(mapLayers, function (index, currentLayer) {

                            if (currentLayer[0] == exclusiveGroupName) {
                                if (currentLayer[1] == newLayer && $("#" + camelize(exclusiveGroupName + " Root")).find('i.glyphspan').hasClass('fa-check-square-o')) {
                                    console.log('adding layer: ',currentLayer[1]);
                                    map.addLayer(currentLayer[2]);
                                    var tempLayer = map.getLayer(currentLayer[2].id);
                                    tempLayer.setVisibility(true);
                                    //$('#' + camelize(currentLayer[1])).toggle();
                                }
                                else if (currentLayer[1] == newLayer && $("#" + camelize(exclusiveGroupName + " Root")).find('i.glyphspan').hasClass('fa-square-o')) {
                                    console.log('groud heading not checked');
                                }
                                else {
                                    console.log('removing layer: ',currentLayer[1]);
                                    map.removeLayer(currentLayer[2]);
                                    if ($("#" + currentLayer[1]).find('i.glyphspan').hasClass('fa-dot-circle-o')) {
                                        $("#" + currentLayer[1]).find('i.glyphspan').toggleClass('fa-dot-circle-o fa-circle-o');
                                    }
                                    //$('#' + camelize(this[1])).toggle();
                                }
                            }
                        });
                    }
                });
            }

            //not an exclusive group item
            else {

                //create layer toggle
                //var button = $('<div align="left" style="cursor: pointer;padding:5px;"><span class="glyphspan glyphicon glyphicon-check"></span>&nbsp;&nbsp;' + layerName + '</div>');
                if (layer.visible && wimOptions.hasOpacitySlider !== undefined && wimOptions.hasOpacitySlider === true) {
                    var button = $('<div class="btn-group-vertical lyrTog" style="cursor: pointer;" data-toggle="buttons"> <button type="button" class="btn btn-default active" aria-pressed="true" style="font-weight: bold;text-align: left"><i class="glyphspan fa fa-check-square-o"></i>&nbsp;&nbsp;' + layerName + '<span id="opacity' + camelize(layerName) + '" class="glyphspan glyphicon glyphicon-adjust pull-right"></button></span></div>');
                } else if ((!layer.visible && wimOptions.hasOpacitySlider !== undefined && wimOptions.hasOpacitySlider === true)) {
                    var button = $('<div class="btn-group-vertical lyrTog" style="cursor: pointer;" data-toggle="buttons"> <button type="button" class="btn btn-default" aria-pressed="true" style="font-weight: bold;text-align: left"><i class="glyphspan fa fa-square-o"></i>&nbsp;&nbsp;' + layerName + '<span id="opacity' + camelize(layerName) + '" class="glyphspan glyphicon glyphicon-adjust pull-right"></button></span></div>');
                } else if (layer.visible) {
                    var button = $('<div class="btn-group-vertical lyrTog" style="cursor: pointer;" data-toggle="buttons"> <button type="button" class="btn btn-default active" aria-pressed="true" style="font-weight: bold;text-align: left"><i class="glyphspan fa fa-check-square-o"></i>&nbsp;&nbsp;' + layerName + '</button></span></div>');
                } else {
                    var button = $('<div class="btn-group-vertical lyrTog" style="cursor: pointer;" data-toggle="buttons"> <button type="button" class="btn btn-default" aria-pressed="true" style="font-weight: bold;text-align: left"><i class="glyphspan fa fa-square-o"></i>&nbsp;&nbsp;' + layerName + '</button> </div>');
                }

                //click listener for regular
                button.click(function(e) {

                    //toggle checkmark
                    $(this).find('i.glyphspan').toggleClass('fa-check-square-o fa-square-o');
                    $(this).find('button').button('toggle');

                    e.preventDefault();
                    e.stopPropagation();

                    $('#' + camelize(layerName)).toggle();

                    //layer toggle
                    if (layer.visible) {
                        layer.setVisibility(false);
                    } else {
                        layer.setVisibility(true);
                    }

                });
            }

            //group heading logic
            if (showGroupHeading) {

                //camelize it for divID
                var groupDivID = camelize(groupHeading);

                //check to see if this group already exists
                if (!$('#' + groupDivID).length) {
                    //if it doesn't add the header
                    var groupDiv = $('<div id="' + groupDivID + '"><div class="alert alert-info" role="alert"><strong>' + groupHeading + '</strong></div></div>');
                    $('#toggle').append(groupDiv);
                }

                //if it does already exist, append to it

                if (exclusiveGroupName) {
                    //if (!exGroupRoot.length)$("#slider"+camelize(layerName))
                    $('#' + groupDivID).append(exGroupRoot);
                    $('#' + groupDivID).append(exGroupDiv);
                } else {
                    $('#' + groupDivID).append(button);
                    if ($("#opacity"+camelize(layerName)).length > 0) {
                        $("#opacity"+camelize(layerName)).hover(function () {
                            $(".opacitySlider").remove();
                            var currOpacity = map.getLayer(options.id).opacity;
                            var slider = $('<div class="opacitySlider"><label id="opacityValue">Opacity: ' + currOpacity + '</label><label class="opacityClose pull-right">X</label><input id="slider" type="range"></div>');
                            $("body").append(slider);[0];

                            $("#slider")[0].value = currOpacity*100;
                            $(".opacitySlider").css('left', event.clientX-180);
                            $(".opacitySlider").css('top', event.clientY-50);

                            $(".opacitySlider").mouseleave(function() {
                                $(".opacitySlider").remove();
                            });

                            $(".opacityClose").click(function() {
                                $(".opacitySlider").remove();
                            });
                            $('#slider').change(function(event) {
                                //get the value of the slider with this call
                                var o = ($('#slider')[0].value)/100;
                                console.log("o: " + o);
                                $("#opacityValue").html("Opacity: " + o);
                                map.getLayer(options.id).setOpacity(o);
                                //here I am just specifying the element to change with a "made up" attribute (but don't worry, this is in the HTML specs and supported by all browsers).
                                //var e = '#' + $(this).attr('data-wjs-element');
                                //$(e).css('opacity', o)
                            });
                        });
                    }
                }
            }
            else {
                //otherwise append
                $('#toggle').append(button);
            }
        }


        //get visible and non visible layer lists
        function addMapServerLegend(layerName, layerDetails) {


            if (layerDetails.wimOptions.layerType === 'agisFeature') {

                //for feature layer since default icon is used, put that in legend
                var legendItem = $('<div align="left" id="' + camelize(layerName) + '"><img alt="Legend Swatch" src="https://raw.githubusercontent.com/Leaflet/Leaflet/master/dist/images/marker-icon.png" /><strong>&nbsp;&nbsp;' + layerName + '</strong></br></div>');
                $('#legendDiv').append(legendItem);

            }

            else if (layerDetails.wimOptions.layerType === 'agisWMS') {

                //for WMS layers, for now just add layer title
                var legendItem = $('<div align="left" id="' + camelize(layerName) + '"><img alt="Legend Swatch" src="http://placehold.it/25x41" /><strong>&nbsp;&nbsp;' + layerName + '</strong></br></div>');
                $('#legendDiv').append(legendItem);

            }

            else if (layerDetails.wimOptions.layerType === 'agisDynamic') {

                //create new legend div
                var legendItemDiv = $('<div align="left" id="' + camelize(layerName) + '"><strong>&nbsp;&nbsp;' + layerName + '</strong></br></div>');
                $('#legendDiv').append(legendItemDiv);

                //get legend REST endpoint for swatch
                $.getJSON(layerDetails.url + '/legend?f=json', function (legendResponse) {

                    console.log(layerName,'legendResponse',legendResponse);



                    //make list of layers for legend
                    if (layerDetails.options.layers) {
                        //console.log(layerName, 'has visisble layers property')
                        //if there is a layers option included, use that
                        var visibleLayers = layerDetails.options.layers;
                    }
                    else {
                        //console.log(layerName, 'no visible layers property',  legendResponse)

                        //create visibleLayers array with everything
                        var visibleLayers = [];
                        $.grep(legendResponse.layers, function(i,v) {
                            visibleLayers.push(v);
                        });
                    }

                    //loop over all map service layers
                    $.each(legendResponse.layers, function (i, legendLayer) {

                        //var legendHeader = $('<strong>&nbsp;&nbsp;' + legendLayer.layerName + '</strong>');
                        //$('#' + camelize(layerName)).append(legendHeader);

                        //sub-loop over visible layers property
                        $.each(visibleLayers, function (i, visibleLayer) {

                            //console.log(layerName, 'visibleLayer',  visibleLayer);

                            if (visibleLayer == legendLayer.layerId) {

                                console.log(layerName, visibleLayer,legendLayer.layerId, legendLayer);

                                //console.log($('#' + camelize(layerName)).find('<strong>&nbsp;&nbsp;' + legendLayer.layerName + '</strong></br>'))

                                var legendHeader = $('<strong>&nbsp;&nbsp;' + legendLayer.layerName + '</strong></br>');
                                $('#' + camelize(layerName)).append(legendHeader);

                                //get legend object
                                var feature = legendLayer.legend;
                                /*
                                 //build legend html for categorized feautres
                                 if (feature.length > 1) {
                                 */

                                //placeholder icon
                                //<img alt="Legend Swatch" src="http://placehold.it/25x41" />

                                $.each(feature, function () {

                                    //make sure there is a legend swatch
                                    if (this.imageData) {
                                        var legendFeature = $('<img alt="Legend Swatch" src="data:image/png;base64,' + this.imageData + '" /><small>' + this.label.replace('<', '').replace('>', '') + '</small></br>');

                                        $('#' + camelize(layerName)).append(legendFeature);
                                    }
                                });
                                /*
                                 }
                                 //single features
                                 else {
                                 var legendFeature = $('<img alt="Legend Swatch" src="data:image/png;base64,' + feature[0].imageData + '" /><small>&nbsp;&nbsp;' + legendLayer.layerName + '</small></br>');

                                 //$('#legendDiv').append(legendItem);
                                 $('#' + camelize(layerName)).append(legendFeature);

                                 }
                                 */
                            }
                        }); //each visible layer
                    }); //each legend item
                }); //get legend json
            }
        }
        /* parse layers.js */
        var legend = new Legend({
            map: map,
            layerInfos: legendLayers
        }, "legendDiv");
        legend.startup();

    });//end of require statement containing legend building code

});
