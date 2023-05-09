// Set your Mapbox API access token
mapboxgl.accessToken = 'pk.eyJ1Ijoib2dib25kYWdsb3J5IiwiYSI6ImNsaGZlajZqZzA3eGQzbnBmc3Z1dXNhNHoifQ.5jg6108wmHZYjgvBoN-NoA';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: [0, 0],
  zoom: 1,
  pitch: 0,
  bearing: 0,
  renderWorldCopies: false,
  antialias: true,
  hash: true
});

// Fetch and prepare the data
d3.csv('population.csv').then(async data => {
  // Convert the data to GeoJSON format
  let geojson = convertToGeoJSON(data);

  // Update the map
  updateMap(geojson);

  // Create an interactive timeline
  let years = Array.from(new Set(data.map(d => d.year)));
  let slider = d3.select('body').append('input')
    .attr('type', 'range')
    .attr('min', d3.min(years))
    .attr('max', d3.max(years))
    .attr('value', d3.min(years))
    .style('position', 'absolute') // Set position to absolute to make the slider appear on top of the map
    .style('top', '10px') // Set top margin
    .style('left', '10px'); // Set left margin

  // Add an event listener to update the map when the slider value changes
  slider.on('input', function() {
    let year = this.value;
    map.setFilter('yearData', ['==', ['get', 'year'], year]);
  });
});

// Function to convert the data to GeoJSON
function convertToGeoJSON(data) {
  return {
    type: 'FeatureCollection',
    features: data.flatMap(d => ([
      // Origin feature
      {
        type: 'Feature',
        properties: {
          year: d.year,
          value: parseFloat(d.refugees) || 0,
          citizenship_stable: d.citizenship_stable,
          city: d.city,
          featureType: 'origin'
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(d.stable_longitude), parseFloat(d.stable_latitude)],
        }
      },
      // Destination feature
      {
        type: 'Feature',
        properties: {
          year: d.year,
          value: parseFloat(d.refugees) || 0,
          citizenship_stable: d.citizenship_stable,
          city: d.city,
          featureType: 'destination'
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(d.longitude), parseFloat(d.latitude)],
        }
      }
    ]))
  };
}

// Function to update the map
function updateMap(data) {
  // Log the values to the console
  // data.features.forEach(feature => {
  //   console.log('Year:', feature.properties.year);
  //   console.log('Value:', feature.properties.value);
  // });
// Log the destination features to the console
    console.log('Destination features:', data.features.filter(feature => feature.properties.featureType === 'destination'));
  // Log the origin features to the console
    console.log('Origin features:', data.features.filter(feature => feature.properties.featureType === 'origin'));


  // Add the data to the map as a source
  if (map.getSource('yearData')) {
    map.getSource('yearData').setData(data);
  } else {
    map.addSource('yearData', { type: 'geojson', data: data });
  }
  
  // Use the 'yearData' source to create   // a new layer for origin
  if (!map.getLayer('originData')) {
    map.addLayer({
      id: 'originData',
      type: 'circle',
      source: 'yearData',
      filter: ['==', ['get', 'featureType'], 'origin'],
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          1, 5, // Circle radius of 5 for values between 1-70
          70, 10, // Circle radius of 10 for values between 71-140
          140, 15 // Circle radius of 15 for values between 141-200
        ],
        'circle-color': 'green', // set color to green for origin
        'circle-opacity': 0.8
      }
    });
  }
  
  // a new layer for destination
  if (!map.getLayer('destinationData')) {
    map.addLayer({
      id: 'destinationData',
      type: 'circle',
      source: 'yearData',
      filter: ['==', ['get', 'featureType'], 'destination'],
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          1, 5, // Circle radius of 5 for values between 1-70
          70, 10, // Circle radius of 10 for values between 71-140
          140, 15 // Circle radius of 15 for values between 141-200
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'value'],
          1, 'blue',
          200, 'red'
        ],
        'circle-opacity': 0.8
      }
    });
  }
}

