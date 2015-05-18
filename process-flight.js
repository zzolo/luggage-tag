// Process flight data

var program = require('commander');
var fs = require('fs');
var path = require('path');
var moment = require('moment-timezone');
var jsdom = require('jsdom');
var request = require('request');
var pkg = require('./package.json');

// Parse arguments
program
  .version(pkg.version)
  .option('-f, --file <a>', 'Luggage tag CSV file.')
  .option('-u, --url <a>', 'Flight Aware track log URL.')
  .option('-o, --offset <a>', 'Unix Timestamp (in seconds) when luggage-tag was turned on that will create offset.  This is needed as the Tessel does not have an accurate internal clock.')
  .option('-t, --timezone <a>', 'Timezone of point of origin (luggage tag data), such as America/Chicago.')
  .option('-p, --output-folder <a>', 'Folder to save files to.')
  .parse(process.argv);

// Check arguments
if (!program.file) {
  throw new Error('File argument is needed');
}

if (!program.url) {
  throw new Error('Flight argument is needed');
}

if (!program.outputFolder) {
  throw new Error('Output folder argument is needed');
}

var offset = 0;
if (program.offset) {
  offset = parseInt(program.offset, 10);
}

var timezone = (program.timezone) ? program.timezone : 'America/New_York';

// Processed data
var finalAccel = [];
var finalTemp = [];
var finalFlight = [];
var finalInfo = {};

// Get file timestamp
var timestamp = parseInt(program.file.split('-')[program.file.split('-').length - 1].split('.')[0], 10);

// Adjust if offset time is provided
if (offset) {
  offset = offset - timestamp;
  timestamp = timestamp + offset;
}

// Use moment.
timestamp = moment.tz(timestamp * 1000, timezone);

// Read file
var csv = fs.readFileSync(program.file, { encoding: 'utf-8' });
csv = csv.split('\r\n');

// Read each line
csv.forEach(function(c, ci) {
  var cells = c.split(',');
  var time;

  // There's bad data so weed it out
  if (cells.length === 5 && cells[0].length === 13) {
    time = moment.tz((parseInt(cells[0], 10) + offset * 1000), timezone).format();

    // Get temp data or accel data
    if (cells[4] && cells[4].length > 2) {
      finalTemp.push({
        t: time,
        temp: parseFloat(cells[4])
      });
    }
    else {
      finalAccel.push({
        t: time,
        x: parseFloat(cells[1]),
        y: parseFloat(cells[2]),
        z: parseFloat(cells[3])
      });
    }
  }
});

// Get flight aware data
request(program.url, function(error, response, body) {
  if (!error && response.statusCode < 300) {
    jsdom.env(body,
      ['https://code.jquery.com/jquery-2.1.4.min.js'],
      function(error, window) {
        var $ = window.jQuery;

        // Parse flight info
        var fInfo = $('.pageContainer ul:eq(0) li:eq(1)').text();
        finalInfo = {
          flightNumber: fInfo.split('✈')[1].trim(),

          // Comes in as: 15-Apr-2015
          flightDate: moment(fInfo.split('✈')[2].trim(), 'DD-MMM-YYYY').format('YYYY-MM-DD'),
          flightOrigin: fInfo.split('✈')[3].trim().split('-')[0].trim(),
          flightDestination: fInfo.split('✈')[3].trim().split('-')[1].trim()
        };

        // Parse table
        $('#tracklogTable tbody tr').each(function() {
          var $row = $(this);
          var $cells = $row.find('td');
          var get = function(index) {
            return $($cells.get(index)).text().trim();
          };

          // Determine time (Flight Aware uses EST)
          // Wed 10:13:02 AM
          var time = moment.tz(finalInfo.flightDate + ' ' + get(0), 'YYYY-MM-DD ddd hh:mm:ss A', 'America/New_York').tz(timezone);

          if ($row.children().length > 3) {
            finalFlight.push({
              t: time.format(),
              lat: parseFloat(get(1)),
              lon: parseFloat(get(2)),
              oDeg: parseInt(get(3), 10),
              oDir: get(4),
              gKTS: parseInt(get(5), 10),
              gMPH: parseInt(get(6), 10),
              alt: parseInt(get(7).replace(/,/g, ''), 10),
              altRate: parseInt(get(8), 10),
              loc: get(9)
            });
          }
        });

        // Write out data
        output();
      });
  }
  else {
    throw new Error(error);
  }
});

// Write out data
function output() {
  fs.writeFile(path.join(program.outputFolder, 'flight-info.json'), JSON.stringify(finalInfo), function(error) {
    if (error) {
      throw new Error(error);
    }
  });

  fs.writeFile(path.join(program.outputFolder, 'flight.json'), JSON.stringify(finalFlight), function(error) {
    if (error) {
      throw new Error(error);
    }
  });

  fs.writeFile(path.join(program.outputFolder, 'temp.json'), JSON.stringify(finalTemp), function(error) {
    if (error) {
      throw new Error(error);
    }
  });

  fs.writeFile(path.join(program.outputFolder, 'accel.json'), JSON.stringify(finalAccel), function(error) {
    if (error) {
      throw new Error(error);
    }
  });
}
