// Process flight data

var program = require('commander');
var fs = require('fs');
var moment = require('moment');
var jsdom = require('jsdom');
var request = require('request');
var pkg = require('./package.json');

// Parse arguments
program
  .version(pkg.version)
  .option('-f, --file <a>', 'CSV file')
  .option('-u, --url <a>', 'Flight Aware track log (i.e. DAL1234)')
  .parse(process.argv);

// Check arguments
if (!program.file) {
  throw new Error('File argument is needed');
}

if (!program.url) {
  throw new Error('Flight argument is needed');
}

// Processed data
var finalAccel = [];
var finalTemp = [];
var finalFlight = [];
var finalInfo = {};

// Get file timestamp
var timestamp = program.file.split('-')[program.file.split('-').length - 1].split('.')[0];
timestamp = moment.unix(timestamp);

// Offset time TODO

// Read file
var csv = fs.readFileSync(program.file, { encoding: 'utf-8' });
csv = csv.split('\r\n');

// Read each line
csv.forEach(function(c, ci) {
  var cells = c.split(',');

  // There's bad data so weed it out
  if (cells.length === 5 && cells[0].length === 13) {
    // Get temp data or accel data
    if (cells[4]) {
      finalTemp.push({
        t: parseInt(cells[0]),
        temp: parseFloat(cells[4])
      });
    }
    else {
      finalAccel.push({
        t: parseInt(cells[0]),
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

        // Parse table
        $('#tracklogTable tbody tr').each(function() {
          var $row = $(this);
          var $cells = $row.find('td');
          var get = function(index) {
            return $($cells.get(index)).text().trim();
          };

          if ($row.children().length > 3) {
            finalFlight.push({
              t: get(0),
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

        // Parse flight info
        var fInfo = $('.pageContainer ul:eq(0) li:eq(1)').text();
        finalInfo = {
          flightNumber: fInfo.split('✈')[1].trim(),
          flightDate: fInfo.split('✈')[2].trim(),
          flightOrigin: fInfo.split('✈')[3].trim().split('-')[0].trim(),
          flightDestination: fInfo.split('✈')[3].trim().split('-')[1].trim()
        };


        // Write out data TODO
        //console.log(finalInfo);
      });
  }
  else {
    throw new Error(error);
  }
});
