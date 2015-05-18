//
// https://tessel.io/docs/microsd
// SD Card modules uses fatfs module which supports some limited actions
// https://github.com/natevw/fatfs/blob/master/index.js
//
// https://tessel.io/docs/climate
//
// https://tessel.io/docs/accelerometer
//
// Note that this script turns off the wifi (see config)

// Dependencies
var tessel = require('tessel');
var tesselate = require('tesselate');
var wifi = require('wifi-cc3000');
var Queue = require('sync-queue');

// High level config that you may want to change
var disableWifi = true;
var accelGThresh = 0.2;
var fileBatch = 100;
// Set precision for accelerometer, 2, 4, 8 (defaults to 2)
var accelPrecision = 8;
// Set read rate in Hertz (times per second) (defaults to 12.5)
var accelRate = 10;
// In milliseconds
var tempReadInterval = 5000;

// Module/tesselate configuration
var tessalateConfig = {
  modules: {
    B: ['sdcard', 'sd'],
    C: ['accel-mma84', 'accel'],
    D: ['climate-si7020', 'climate']
  },
  development: true
};

// Some globals
var runID = Math.floor(Date.now() / 1000);
var newLine = '\r\n';
var fileStore = 'luggage-tag-' + runID + '.csv';
var fileColumns = 'time,x,y,z,temp' + newLine;
var led1 = tessel.led[0].output(0);

// When all is ready
function main(tessel, m, filesystem) {
  var batch = [];
  var batchNumber = 0;
  var fsQueue = new Queue();
  var processBatch = false;

  // Getting data from acceleromator
  function accelData(xyz) {
    var x = xyz[0].toFixed(2);
    var y = xyz[1].toFixed(2);
    var z = xyz[2].toFixed(2);

    // Make sure we are not in the middle of a batch process
    // step
    if (processBatch) {
      return;
    }

    // No need to get very low data
    if (Math.abs(x) >= accelGThresh && Math.abs(y) >= accelGThresh &&
      Math.abs(z) >= accelGThresh) {
      addData(x, y, z, '');
    }
  }

  // Get temperature
  function readTemp() {
    if (processBatch) {
      return;
    }

    m.climate.readTemperature('f', function(error, temp) {
      if (error) {
        console.log('Error reading temperature');
      }
      else if (temp) {
        addData('', '', '', temp.toFixed(2));
      }
    });
  }

  // Add data to batch
  function addData(x, y, z, t) {
    var time = Date.now();
    var line = [time, x, y, z, t].join(',') + newLine;

    // Save in batches.  There is a small window where batches
    // may be full and data comes and the data gets erased
    batch.push(line);
    if (batch.length >= fileBatch) {
      processBatch = true;
      saveBatch(batch.join(''));
      batch = [];
      processBatch = false;
    }
  }

  // Save batch.  Use a queue so that one save happens at one time.
  // Turn on LED when saving.
  function saveBatch(data) {
    batchNumber++;
    console.log('Saving batch: ', batchNumber);

    fsQueue.place(function() {
      // Turn on LED
      led1.toggle();

      filesystem.appendFile(fileStore, data, function(error) {
        if (error) {
          console.log('Error writing data to SD: ', fileStore);
        }

        console.log('Saved batch: ', batchNumber);

        // Turn off LED
        led1.toggle();
        fsQueue.next();
      });
    });
  }

  // React to accel data
  m.accel.on('data', accelData);

  // Get temperature every x millisencond
  setInterval(readTemp, tempReadInterval);
}

// Connect to modules and any other base setup tasks.
function setup(tessel, m) {
  console.log('Setup.');

  // Disable wifi
  if (disableWifi === true) {
    console.log('Disabling wifi');
    wifi.disable();
  }

  // Setup accel module
  m.accel.setScaleRange(accelPrecision);
  m.accel.setOutputRate(accelRate);

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
