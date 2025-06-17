import { API_BASE } from './config.js';

const LOCATIONS = {
  'bradspelsmeny': {
    name: 'Brädspelsmeny',
    apiUrl: `${API_BASE}/bradspelsmeny`
  },
  'bradspelsmeny-ostersund': {
    name: 'Brädspelsmeny Östersund',
    apiUrl: `${API_BASE}/bradspelsmeny-ostersund`
  }
};

let currentLocation = 'bradspelsmeny';

export function getCurrentLocation() {
  return currentLocation;
}

export function setCurrentLocation(location) {
  if (LOCATIONS[location]) {
    currentLocation = location;
    return true;
  }
  return false;
}

export function getLocationApiUrl() {
  return LOCATIONS[currentLocation].apiUrl;
}

export function getLocationName() {
  return LOCATIONS[currentLocation].name;
}

export function getAvailableLocations() {
  return Object.keys(LOCATIONS);
} 