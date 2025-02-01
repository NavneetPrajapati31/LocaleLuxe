var apiKey = "bGRMHyx0wJDGbjz6y1Gly1IXhl6b_HDhg_d7dhIVGqM"; // Replace with your actual HERE API key
var platform, map, geocoder;

function initializeMap() {
  console.log("Initializing Map...");

  platform = new H.service.Platform({ apikey: apiKey });
  geocoder = platform.getSearchService();

  var defaultLayers = platform.createDefaultLayers();

  map = new H.Map(
    document.getElementById("map"),
    defaultLayers.vector.normal.map,
    {
      zoom: 10,
      center: {
        lat: listing.geometry.coordinates[1],
        lng: listing.geometry.coordinates[0],
      }, // Default: New Delhi
    }
  );

  // Enable UI controls
  new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  ui = H.ui.UI.createDefault(map, defaultLayers);

  console.log("Map initialized.");

  // Call addMarkersToMap after map is fully initialized
  addMarkersToMap();
}

function geocodeAndShow() {
  var address = document.getElementById("address").value.trim();
  if (!address) {
    alert("Please enter an address!");
    return;
  }

  console.log("Geocoding address:", address);

  geocoder.geocode(
    { q: address },
    function (result) {
      if (result.items.length > 0) {
        var location = result.items[0].position;
        console.log(
          `Geocode Result: Latitude: ${location.lat}, Longitude: ${location.lng}`
        );

        // Convert to GeoJSON with the required schema
        var geoJSON = {
          geometry: {
            type: "Point", // type is "Point"
            coordinates: [location.lng, location.lat], // [longitude, latitude]
          },
        };

        // Print GeoJSON to console
        console.log("GeoJSON:", JSON.stringify(geoJSON, null, 2));

        // Update map with the new location
        updateMap(location.lat, location.lng);
      } else {
        alert("Location not found!");
      }
    },
    function (error) {
      console.error("Geocoding failed:", error);
    }
  );
}

function updateMap(lat, lng) {
  if (!map) {
    console.error("Map is not initialized!");
    return;
  }

  console.log("Updating map to:", lat, lng);

  // Move map to new location
  map.setCenter({ lat: lat, lng: lng });
  map.setZoom(10);

  // Remove existing markers
  map.removeObjects(map.getObjects());

  // Add new marker
  var marker = new H.map.Marker({ lat: lat, lng: lng });
  map.addObject(marker);
}

// Function to add default markers when map is initialized
function addMarkersToMap() {
  if (map) {
    //marker
    var marker = new H.map.Marker({
      lat: listing.geometry.coordinates[1],
      lng: listing.geometry.coordinates[0],
    });
    map.addObject(marker);
    console.log("Marker added");

    // Create an InfoBubble with custom content
    var infoBubble = new H.ui.InfoBubble(
      {
        lat: listing.geometry.coordinates[1],
        lng: listing.geometry.coordinates[0],
      },
      {
        content: `<h5>${listing.location}</h5><p>Exact location provided after booking</p>`,
      }
    );

    ui.addBubble(infoBubble);
  } else {
    console.log("Map not initialized yet");
  }
}

// Ensure the map is initialized before using it
document.addEventListener("DOMContentLoaded", function () {
  initializeMap();
});
