"use strict";

var sphero = require("sphero");


//var sprkp = sphero("EF:C6:25:73:1A:31")
var sprkp = sphero("D0:4D:38:49:00:32");

sprkp.connect(function() {
  sprkp.streamOdometer();

  sprkp.on("odometer", function(data) {
    console.log("odometer:");
    console.log("  sensor:", data.xOdometer.sensor);
    console.log("    range:", data.xOdometer.range);
    console.log("    units:", data.xOdometer.units);
    console.log("    value:", data.xOdometer.value[0]);

    console.log("  sensor:", data.yOdometer.sensor);
    console.log("    range:", data.yOdometer.range);
    console.log("    units:", data.yOdometer.units);
    console.log("    value:", data.yOdometer.value[0]);
  });

  sprkp.roll(10, 0);
});
