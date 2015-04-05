//
// https://tessel.io/docs/microsd
// SD Card modules uses fatfs module which supports some limited actions
// https://github.com/natevw/fatfs/blob/master/index.js
//
// https://tessel.io/docs/climate
//
// https://tessel.io/docs/accelerometer


// Dependencies
var tesselate = require('tesselate');

// Module/tesselate configuration
var tessalateConfig = {
  modules: {
    B: ['sdcard', 'sd'],
    C: ['accel-mma84', 'accel'],
    D: ['climate-si7020', 'climate']
  },
  development: true
};

// A hopefully unique, incremental ID for this run
var runID = Math.floor(Date.now() / 1000);
var accelGThresh = 0.2;
var fileStore = 'luggage-tag-' + runID + '.csv';
var fileColumns = 'time,x,y,z,temp\n';


// When all is ready
function main(tessel, m, filesystem) {

  // Getting data from acceleromator
  function accelData(xyz) {
    var x = xyz[0].toFixed(2);
    var y = xyz[0].toFixed(2);
    var z = xyz[0].toFixed(2);

    // No need to get simple data
    if (Math.abs(x) >= accelGThresh && Math.abs(y) >= accelGThresh &&
      Math.abs(z) >= accelGThresh) {
      saveData(x, y, z);
    }
  }

  // Save data to SD
  function saveData(x, y, z) {
    var t = Math.floor(Date.now() / 1000);
    filesystem.appendFile(fileStore, [t, x, y, z, ''].join(',') + '\n', function(error) {
      if (error) {
        console.log('Error writing data to SD: ', fileStore);
      }
    });
  }

  // React to accel data
  m.accel.on('data', accelData);
}

// Connect to modules and any other base setup tasks.
function setup(tessel, m) {
  console.log('Setup.');

  // Get filesystem
  m.sd.getFilesystems(function(error, fss) {
    if (error) {
      console.log('Error getting filesystem.');
      console.log(error);
    }
    else {
      // Create file
      console.log('Creating file: ', fileStore);
      fss[0].writeFile(fileStore, fileColumns, function(error) {
        if (error) {
          console.log('Error creating file: ', fileStore);
        }
        else {
          main(tessel, m, fss[0]);
        }
      });
    }
  });
}

// Tesselate
tesselate(tessalateConfig, setup);
