

$(document).ready(function() {

  // Some vars
  var dataPath = './data/DAL2421/';
  var mapStyle = {
    color: '#00A388',
    weight: 4,
    opacity: 0.9
  };

  // Got data
  function gotData(info, accel, flight, temp) {

    // Draw map
    var map = L.map('map', {
      attributionControl: false,
      zoomControl: false
    });
    L.tileLayer('http://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiamtlZWZlIiwiYSI6ImVCXzdvUGsifQ.5tFwEhRfLmH36EUxuvUQLA')
      .addTo(map);

    // Add polyline
    var polyline = L.polyline([], mapStyle).addTo(map);
    _.each(_.sortBy(flight, function(f, fi) {
      return moment(f.t).unix();
    }),

    function(f, fi) {
      polyline.addLatLng(L.latLng(f.lat, f.lon));
    });

    // Zoom to polyline
    map.fitBounds(polyline.getBounds());

    // Draw acceleromater
    accel = _.sortBy(accel, function(a, ai) {
      return moment(a.t).unix();
    });

    var $accelEl = $('#accel .chart');
    var accelData = [
      { color: '#00A388', data: [] },
      { color: '#79BD8F', data: [] },
      { color: '#BEEB9F', data: [] }
    ];
    _.each(accel, function(a, ai) {
      var t = moment(a.t);
      accelData[0].data.push({ x: t.unix(), y: a.x });
      accelData[1].data.push({ x: t.unix(), y: a.y });
      accelData[2].data.push({ x: t.unix(), y: a.z });
    });

    var accelChart = new Rickshaw.Graph({
      element: $accelEl[0],
      width: $accelEl.width(),
      height: $accelEl.height(),
      renderer: 'line',
      min: 'auto',
      interpolation: 'linear',
      min: -4,
      max: 4,
      series: accelData
    });
    var accelX = new Rickshaw.Graph.Axis.Time({ graph: accelChart });
    var accelY = new Rickshaw.Graph.Axis.Y({
      graph: accelChart,
      orientation: 'left',
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      element: $('#accel .y-axis')[0]
    });

    accelChart.render();

    // Draw acceleromater
    temp = _.sortBy(temp, function(t, ti) {
      return moment(t.t).unix();
    });

    var $tempEl = $('#temp .chart');
    var tempData = [
      { color: '#79BD8F', data: [] }
    ];
    _.each(temp, function(t, ti) {
      var time = moment(t.t);
      tempData[0].data.push({ x: time.unix(), y: t.temp });
    });

    var tempChart = new Rickshaw.Graph({
      element: $tempEl[0],
      width: $tempEl.width(),
      height: $tempEl.height(),
      renderer: 'area',
      max: 110,
      series: tempData
    });
    var tempX = new Rickshaw.Graph.Axis.Time({ graph: tempChart });
    var tempY = new Rickshaw.Graph.Axis.Y({
      graph: tempChart,
      orientation: 'left',
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      element: $('#temp .y-axis')[0]
    });

    tempChart.render();

    // Draw altitude
    var $altEl = $('#alt .chart');
    var altData = [
      { color: '#BEEB9F', data: [] }
    ];
    _.each(flight, function(f, fi) {
      var time = moment(f.t);
      altData[0].data.push({ x: time.unix(), y: f.alt });
    });

    var altChart = new Rickshaw.Graph({
      element: $altEl[0],
      width: $altEl.width(),
      height: $altEl.height(),
      renderer: 'area',
      max: 40000,
      series: altData
    });
    var altX = new Rickshaw.Graph.Axis.Time({ graph: altChart });
    var altY = new Rickshaw.Graph.Axis.Y({
      graph: altChart,
      orientation: 'left',
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      element: $('#alt .y-axis')[0]
    });

    altChart.render();
  }

  // Fetch data
  function getData(done) {
    $.getJSON(dataPath + 'accel.json', function(accel) {
      $.getJSON(dataPath + 'flight-info.json', function(info) {
        $.getJSON(dataPath + 'flight.json', function(flight) {
          $.getJSON(dataPath + 'temp.json', function(temp) {
            done(info, accel, flight, temp);
          });
        });
      });
    });
  }

  // Execute
  getData(gotData);
});
