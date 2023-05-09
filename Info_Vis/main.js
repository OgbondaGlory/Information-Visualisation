// Set your Mapbox API access token
mapboxgl.accessToken = 'pk.eyJ1Ijoib2dib25kYWdlbG9yeSIsImEiOiJjbGhmZWFqNnBnMDNlM25wZjN6MXV1c2E0em9pZi5qZzYxMDh3bUh6WWpndkJvTi1Ob0EifQ';

d3.csv('population.csv').then(async data => {
  // For each record in the data, make a request to the Mapbox Geocoding API
  // to get the latitude and longitude of the 'citizenship_stable' field.
  const geocodingPromises = data.map(async (d) => {
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${d.citizenship_stable}.json?access_token=${mapboxgl.accessToken}`);
    const geocodingData = await res.json();
    d.stable_longitude = geocodingData.features[0].center[0];
    d.stable_latitude = geocodingData.features[0].center[1];
    return d;
  });

  // Wait for all the geocoding requests to complete.
  const geocodedData = await Promise.all(geocodingPromises);

  // Convert the geocoded data to a CSV string.
  const csvContent = d3.csvFormat(geocodedData);

  // Save the geocoded data to a local file.
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csvContent], {type: 'text/csv'}));
  a.download = 'geocodedData.csv';
  a.click();
});
