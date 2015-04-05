// A simple script to read files from the SD card.

var tessel = require('tessel');
var sdcardlib = require('sdcard');

var sdcard = sdcardlib.use(tessel.port['B']);
var filePrefix = 'luggage-tag-';

sdcard.on('ready', function() {
  console.log('Connected to SD.');

  sdcard.getFilesystems(function(error, fss) {
    console.log('Connected to FS.');
    var fs = fss[0];

    // Get list of files
    fs.readdir('/', function(error, files) {
      if (error) {
        console.log('Error reading root directory.');
      }
      else {
        // Read each file
        files.forEach(function(f, fi) {
          if (f.indexOf(filePrefix) !== 0) {
            return;
          }

          fs.readFile(f, function(error, data) {
            console.log('Reading: ', f);
            console.log('=================');

            if (error) {
              console.log('Error reading: ', f);
            }
            else {
              console.log(data.toString());
            }
          });
        });
      }
    })
  });
});
