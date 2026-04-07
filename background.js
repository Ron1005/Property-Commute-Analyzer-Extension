chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openOptions") {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (request.action === "fetchCommute") {
    chrome.storage.sync.get(["apiKey", "points"], async (data) => {
      const { apiKey, points } = data;
      if (!apiKey || !points || points.length === 0) {
        sendResponse({ error: "Please configure your API key and locations." });
        return;
      }
      const originAddress = request.originAddress;
      const origin = encodeURIComponent(originAddress);
      let results = [];

      // Only geocode if we have dynamic points that need distance sorting
      let originCoords = null;
      if (points.some(p => p.type === 'dynamic' && p.sortBy === 'distance')) {
        originCoords = await geocodeAddress(originAddress, apiKey);
      }
      
      for (const point of points) {
        const mode = point.mode || "transit";
        const isDynamic = point.type === "dynamic";

        if (!isDynamic) {
          // --- FIXED ADDRESS Logic ---
          const destination = encodeURIComponent(point.addressOrQuery);
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&alternatives=true&key=${apiKey}`;
          
          try {
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.status === "OK" && result.routes.length > 0) {
              const options = parseRoutes(result.routes, mode);
              results.push({ name: point.name, mode: mode, isDynamic: false, options: options, ok: true });
            } else {
              results.push({ name: point.name, ok: false });
            }
          } catch (e) {
            results.push({ name: point.name, ok: false });
          }

        } else {
          // --- DYNAMIC SEARCH Logic ---
          try {
            const query = encodeURIComponent(`${point.addressOrQuery} near ${originAddress}`);
            const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;
            const placesResp = await fetch(placesUrl);
            const placesResult = await placesResp.json();

            if (placesResult.status === "OK" && placesResult.results.length > 0) {
              let candidates = placesResult.results;
              let sorted = [];

              if (point.sortBy === 'distance' && originCoords) {
                // Sort strictly by physical distance
                sorted = candidates.map(p => ({
                  ...p,
                  dist: getDistance(originCoords.lat, originCoords.lng, p.geometry.location.lat, p.geometry.location.lng)
                })).sort((a, b) => a.dist - b.dist);
              } else {
                // Default: Trust Google's relevance (top 5) then sort by rating
                let relevantPlaces = candidates.slice(0, 5);
                sorted = relevantPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
              }

              let topPlaces = sorted.slice(0, 3);
              let dynamicOptions = [];

              for (const place of topPlaces) {
                const destLatlng = `${place.geometry.location.lat},${place.geometry.location.lng}`;
                const dirUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destLatlng}&mode=${mode}&key=${apiKey}`;
                
                const dirResp = await fetch(dirUrl);
                const dirResult = await dirResp.json();

                if (dirResult.status === "OK" && dirResult.routes.length > 0) {
                  const parsed = parseRoutes(dirResult.routes.slice(0,1), mode);
                  if (parsed.length > 0) {
                    dynamicOptions.push({
                      placeName: place.name,
                      rating: place.rating ? `${place.rating}` + String.fromCodePoint(0x2B50) : "No rating",
                      duration: parsed[0].duration,
                      distance: parsed[0].distance,
                      route: parsed[0].route
                    });
                  }
                }
              }

              results.push({ 
                name: point.name, 
                mode: mode, 
                isDynamic: true,
                dynamicQuery: point.addressOrQuery,
                sortBy: point.sortBy || 'rating',
                options: dynamicOptions,
                ok: true 
              });

            } else {
              results.push({ name: `${point.name} (${placesResult.status || "Unknown"})`, ok: false });
            }
          } catch(e) {
            results.push({ name: point.name, ok: false });
          }
        }
      }
      sendResponse({ results });
    });
    return true; // async
  }
});

async function geocodeAddress(address, apiKey) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === 'OK') {
      return data.results[0].geometry.location;
    }
  } catch (e) {
    console.error("Geocoding error", e);
  }
  return null;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to parse Google Maps Direction routes
function parseRoutes(routesArray, mode) {
  const options = [];
  const routesToProcess = routesArray.slice(0, 3);

  for (const route of routesToProcess) {
    const leg = route.legs[0];
    let routeString = "";
    let transitStepsFound = false;

    if (mode === "transit") {
      const transitSteps = [];
      for (const step of leg.steps) {
        if (step.travel_mode === "TRANSIT" && step.transit_details) {
          transitStepsFound = true;
          const line = step.transit_details.line;
          const shortName = line.short_name || line.name;
          const type = step.transit_details.vehicle ? step.transit_details.vehicle.type : "TRANSIT";
          let vehicleStr = type;
          if (type === "BUS") vehicleStr = "Bus";
          else if (type === "TRAM") vehicleStr = "Tram";
          else if (type === "HEAVY_RAIL" || type === "COMMUTER_TRAIN" || type === "SUBWAY") vehicleStr = "Train";
          else if (type === "FERRY") vehicleStr = "Ferry";
          transitSteps.push(`${vehicleStr} ${shortName}`);
        }
      }
      if (transitSteps.length > 0) routeString = transitSteps.join(" " + String.fromCodePoint(0x2192) + " ");
      else if (!transitStepsFound && leg.steps.length > 0) routeString = "Walking only";
    }

    options.push({
      duration: leg.duration.text,
      distance: leg.distance.text,
      route: routeString
    });
  }
  return options;
}

