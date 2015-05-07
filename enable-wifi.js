// Simple script to enable wifi
var wifi = require('wifi-cc3000');

wifi.enable(function() {
  console.log('Wifi enabled.');
});
