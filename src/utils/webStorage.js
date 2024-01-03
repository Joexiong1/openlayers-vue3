// webStorage.js
const locaMap = "locaMap";

export function getMap() {
  return localStorage.getItem(locaMap);
}

export function setMap(e) {
  return localStorage.setItem(locaMap, e);
}
