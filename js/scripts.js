// mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoibWljaGFlbGZyYWptYW4xIiwiYSI6ImNsdXZzaTNiNjA2ejQycXBiaGU5dDNxM2UifQ.xQkObwg-QzODO9fKFMGUTw"

// generate map and have it centered to display Staten Island
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-74.153265, 40.577327],
    zoom: 11
});

// hazy outline layers
var backdropHazeLayers = [

    // initial haze around the whole island
    {
        'id': 'island-haze',
        'type': 'fill',
        'source': 'island-outline',
        'layout': {},
        'paint': {
            'fill-opacity': 0.5,
            'fill-color': '#4d4949',
        },

    },

    // exapnded outline for showing the exteded line off island
    {
        'id': 'expanded-haze',
        'type': 'fill',
        'source': 'expanded-outline',
        'layout': {},
        'paint': {
            'fill-opacity': 0,
            'fill-color': '#4d4949',
        },

    }
]

// all layers for polygons and lines
var contentLayer = [

    // layer for census block population density chloropleth
    {
        'id': 'population-density',
        'type': 'fill',
        'source': 'census-blocks',
        'layout': {},
        // the fill of each block is continously scaled for density from the min to max value observed
        'paint': {
            'fill-color': 'red',
            'fill-opacity': [
                'interpolate',
                ['linear'],
                ['get', 'DENSITY'],
                0, 0,
                122471, 1
            ]
        }
    },

    // layer for the brt route
    {
        'id': 'brt-route',
        'type': 'line',
        'source': 'brtline',
        'layout': {},
        'paint': {
            'line-width': 7,
            'line-color': 'green',
        }
    },

    // layer for the proposed route
    {
        'id': 'proposed-route',
        'type': 'line',
        'source': 'proposedline',
        'layout': {},
        'paint': {
            'line-width': 7,
            'line-color': 'fuchsia',
        }
    }

]

// arrays for text to change the state of the html sidebars
var headerText = [
    "Staten Island Railway has a lot of potential.",
    "A lot of focus is placed on expanding service first.",
    "But these solutions often overlook the existing railway.",
    "A new right of way should be scouted out."
]

var p1Text = [
    "The Staten Island Railway is 21 stops from Tottenville in the South to the St. George Ferry Terminal in the North. It is a very quirky system with only two stations, St. George and Tompkinsville having fare control. While the SIR is underused now, with further study and planning its role could beaugmented.",
    "Traditionally planners have approached the issue of expanding transit on Staten Island by looking at the North Shore. This area has the densest underserved population as well as abandoned transit right of way.",
    "The focus on the North Shore has led to a strong proposal to turn the old right of way into a <span style='color: green'> bus rapid transit</span> line. But this transformation risks blocking expansion of the Railway due to tearing up the old railbed and building paved roads.",
    "Given the Outerbridge Crossing is currently under study for replacement. A <span style='color: fuchsia'>new right of way</span> could be built over the bridge from a spur just South of Annadale station. This new spur could be a boon to both revenue service and easy operational burdens for the railway."
]

var p2Text = [
    "Click on the SIR bullets <img src='https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/NYCS-bull-trans-SIR-Std.svg/1024px-NYCS-bull-trans-SIR-Std.svg.png' width='20px' length='20px'> to view the station names. The <span style='color: blue'>blue</span> line is the current SIR right of way.",
    "Click on the census blocks to view their population and population density in meters squared. <span style='color: red'>Darker red</span> indicates higher density. Click on the SIR bullets <img src='https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/NYCS-bull-trans-SIR-Std.svg/1024px-NYCS-bull-trans-SIR-Std.svg.png' width='20px' length='20px'> to view the station names. The <span style='color: blue'>blue</span> line is the current SIR right of way."

]

var p3Text = [
    "Click the 'Continue' button below to view more.",
    "Click the 'Back to Start' button to reset from the top."
]

// Based on Chris Whong's pizza map example
map.addControl(new mapboxgl.NavigationControl());

map.on('load', () => {

    //import geojson of the haze mask around island
    map.addSource('island-outline', {
        type: 'geojson',
        data: invertedstatenoutline
    });

    //import geojson of the exapnded haze mask around island
    map.addSource('expanded-outline', {
        type: 'geojson',
        data: expandedhaze
    });

    // load the initial haze outline on startup
    map.addLayer(backdropHazeLayers[0]);

    //import geojson for chloropleth of staten island demogrphics by census block
    map.addSource('census-blocks', {
        type: 'geojson',
        data: sicensusblocks
    });

    // expanded haze layer is loaded and present with zero opacity for later animation
    map.addLayer(backdropHazeLayers[1]);

    // used chatgpt and discussed with Luke Buttenwieser for how feature clicking can be achieved

    // interactivity for population density map, clicking on a census block shows population and density numbers
    // Add click event to show popup containing 
    map.on('click', 'population-density', (e) => {
        // get feature that is clicked on
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['population-density']
        });

        // check that a feature was clicked, if no feature than exit
        if (!features.length) {
            return;
        }

        // extract geojson properties
        var feature = features[0];
        var properties = feature.properties;

        // build popup message
        var popupContent = '<h3>' + properties.NAME20 + '</h3>' +
            '<p>Population: ' + properties.POP20 + '</p>' +
            '<p>Density: ' + properties.DENSITY + ' pop/sqr m</p>';

        // display popup messages
        new mapboxgl.Popup({ closeButton: false })
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);

    });

    //import geojson of the railline
    map.addSource('railline', {
        type: 'geojson',
        data: sirroute
    });

    //generate layer for the railline
    map.addLayer({
        'id': 'railway-route',
        'type': 'line',
        'source': 'railline',
        'layout': {},
        'paint': {
            'line-width': 7,
            'line-color': 'blue',
        }
    });

    //import geojson of the brt route
    map.addSource('brtline', {
        type: 'geojson',
        data: brt
    });

    //import geojson of the proposed route
    map.addSource('proposedline', {
        type: 'geojson',
        data: proproute
    });


    // Setting cursor depending on layer
    // Change cursor to pointer when hovering over a polygon in density layer
    map.on('mouseenter', 'population-density', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change cursor back to default when entering the haze layer
    map.on('mouseenter', 'island-haze', () => {
        map.getCanvas().style.cursor = '';
    });

});

// loop over the station array to make a marker for each record
stations.forEach(function (stationRecord) {

    // create a popup to attach to the marker
    const popup = new mapboxgl.Popup({
        // removed the "x" from the popups as it crowded the small space
        // https://stackoverflow.com/questions/66254088/how-to-remove-the-x-close-symbol-from-mapbox-pop-up
        closeButton: false,
        offset: -5,
        anchor: 'top'
        // display the text in the popup
    }).setText(
        `${stationRecord.StopName}`
    );

    // using the SIR logo in place of the default mapbox marker
    let imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/NYCS-bull-trans-SIR-Std.svg/1024px-NYCS-bull-trans-SIR-Std.svg.png';

    // creating a div to contain the image
    let markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.backgroundImage = `url(${imageUrl})`;
    markerElement.style.width = '25px';
    markerElement.style.height = '25px';

    // create a marker, set the coordinates, add the popup, add it to the map
    new mapboxgl.Marker(markerElement)
        .setLngLat([stationRecord.GTFSLongitude, stationRecord.GTFSLatitude])
        .setPopup(popup)
        .addTo(map);
})

// pressing the button to advance the story
var currentLayerIndex = 0;

// wrappers for changing htmls
var header = document.getElementById('header');
var p1 = document.getElementById('p1');
var p2 = document.getElementById('p2');
var p3 = document.getElementById('p3');

// function for the continue button to chage the map and etxt state
function toggleLayer() {
    // incrementing the layer counting, there are 3 layers to the story total
    if (currentLayerIndex < 4) {
        currentLayerIndex += 1;
    }

    // layer one draws the populaton density map alongside the sir routes and stations
    if (currentLayerIndex === 1) {
        map.addLayer(contentLayer[0]);
        header.innerHTML = headerText[1];
        p1.innerHTML = p1Text[1];
        p2.innerHTML = p2Text[1];
    }
    // layer two shows the proposed staten island brt
    else if (currentLayerIndex === 2) {
        map.addLayer(contentLayer[1]);
        header.innerHTML = headerText[2];
        p1.innerHTML = p1Text[2];
    }
    // layer three shows my proposed outerbridge spur
    else if (currentLayerIndex === 3) {
        map.addLayer(contentLayer[2]);
        header.innerHTML = headerText[3];
        p1.innerHTML = p1Text[3];
        p3.innerHTML = p3Text[1];

        // move map slightly to center the new line
        shiftMap(2);

        // opacity transition/animation between haze layers
        map.setPaintProperty('island-haze', 'fill-opacity', 0);
        map.setPaintProperty('expanded-haze', 'fill-opacity', 0.5);

        // disable the continue button once story reaches its conclusion
        var mainButton = document.getElementById('main-toggle');
        mainButton.disabled = true;
        mainButton.style.opacity = 0.5;

        // enable the reset button
        var resButton = document.getElementById('reset');
        resButton.disabled = false;
        resButton.style.opacity = 1;
    }

}

// set the map back to the starting state via the reset button
function resetMap() {
    currentLayerIndex = 0;

    // reset the text
    header.innerHTML = headerText[0];
    p1.innerHTML = p1Text[0];
    p2.innerHTML = p2Text[0];
    p3.innerHTML = p3Text[0];

    // reset data layers
    map.removeLayer(contentLayer[0].id);
    map.removeLayer(contentLayer[1].id);
    map.removeLayer(contentLayer[2].id);

    //reset haze layers
    map.setPaintProperty('island-haze', 'fill-opacity', 0.5);
    map.setPaintProperty('expanded-haze', 'fill-opacity', 0);

    // shift map back to start
    shiftMap(1);

    // enable the continue button once story reaches its conclusion
    var mainButton = document.getElementById('main-toggle');
    mainButton.disabled = false;
    mainButton.style.opacity = 1;

    // disable the reset button
    var resButton = document.getElementById('reset');
    resButton.disabled = true;
    resButton.style.opacity = 0.5;
}

// Function to animate shifting the map slightly to a direction as passed
function shiftMap(direction) {
    // Get the current center coordinate
    var currentCenter = map.getCenter();

    if (direction === 1) {
        // Calculate the new center coordinate shifted slightly to the right
        var newCenter = [
            currentCenter.lng + 0.025, // Shift right by 0.01 degrees
            currentCenter.lat
        ];
    }
    if (direction === 2) {
        var newCenter = [
            currentCenter.lng - 0.025, // Shift right by 0.01 degrees
            currentCenter.lat
        ];
    }
    // Animate the map to the new center coordinate with easing
    map.easeTo({
        center: newCenter,
        duration: 1000, // Animation duration in milliseconds
        easing: t => t // Linear easing
    });
}
