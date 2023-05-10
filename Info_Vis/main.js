// Set your Mapbox API access token
mapboxgl.accessToken = 'pk.eyJ1Ijoib2dib25kYWdsb3J5IiwiYSI6ImNsaGZlajZqZzA3eGQzbnBmc3Z1dXNhNHoifQ.5jg6108wmHZYjgvBoN-NoA';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [0, 0],
  zoom: 1,
  pitch: 0,
  bearing: 0,
  renderWorldCopies: false,
  antialias: true,
  hash: true
});

d3.csv('geocoded_population_no_missing.csv').then(data => {
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
  let aggregatedData = {};

  data.forEach(d => {
    // Aggregate origin features
    let originKey = `${d.year}-origin-${d.citizenship_stable}`;
    if (!aggregatedData[originKey]) {
      aggregatedData[originKey] = {
        type: 'Feature',
        properties: {
          year: d.year,
          value: parseFloat(d.refugees) || 0,
          citizenship_stable: d.citizenship_stable,
          featureType: 'origin'
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(d.stable_longitude), parseFloat(d.stable_latitude)],
        }
      };
    } else {
      aggregatedData[originKey].properties.value += parseFloat(d.refugees) || 0;
    }

    // Aggregate destination features
    let destinationKey = `${d.year}-destination-${d.city}`;
    if (!aggregatedData[destinationKey]) {
      aggregatedData[destinationKey] = {
        type: 'Feature',
        properties: {
          year: d.year,
          value: parseFloat(d.refugees) || 0,
          citizenship_stable: d.citizenship_stable,
          featureType: 'destination'
        },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(d.longitude), parseFloat(d.latitude)],
        }
      };
    } else {
      aggregatedData[destinationKey].properties.value += parseFloat(d.refugees) || 0;
    }
  });

  return {
    type: 'FeatureCollection',
    features: Object.values(aggregatedData)
  };
}

// Function to update the map
function updateMap(data) {

  // Add an event listener to update the map when the slider value changes
slider.on('input', function() {
  let year = this.value;
  if (map.getSource('yearData')) { // Check if the source exists before filtering
    map.setFilter('yearData', ['==', ['get', 'year'], year]);
  }
});

  console.log('Destination features:', data.features.filter(feature => feature.properties.featureType === 'destination'));
  console.log('Origin features:', data.features.filter(feature => feature.properties.featureType === 'origin'));

  // Add the data to the map as a source
  if (map.getSource('yearData')) {
    map.getSource('yearData').setData(data);
  } else {
    map.addSource('yearData', { type: 'geojson', data: data });
  }
  
  // Use the 'yearData' source to create a new layer for origin
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
  
  // Use the 'yearData' source to create a new layer for destination
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

