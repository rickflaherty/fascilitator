let px = 0, py = 0, pa = 90, dist = 0;

exports.coord_convert = function coord_convert(a) {
  let b = Math.round((450 - a) % 360);
  return b;
}

exports.setPos = function setPos(pos) {
  px = pos[0];
  py = pos[1];
  pa = Math.atan2(py, px) * 180 / Math.PI;
  dist = Math.sqrt(px * px + py * py);
}

exports.getPos = function getPos() {
  return [px, py];
}

exports.getPosa = function getPosa() {
  return pa;
}

exports.getDist = function getDist() {
  return dist;
}

exports.streamOdo = async function streamOdo(sprkp) {
  sprkp.streamOdometer(1);
  sprkp.on('odometer', function(data) {
    px = data.xOdometer.value[0];
    py = data.yOdometer.value[0];
    pa = Math.atan2(py, px) * 180 / Math.PI;
    dist = Math.sqrt(px * px + py * py);
    /*console.log('  x: ' + global.posx + data.xOdometer.units);
    console.log('  y: ' + global.posy + data.yOdometer.units);*/
  });
}

exports.reached_target = function reached_target(target) {
  // Environmental parameters
  const outerDist = 45;
  const innerDist = 35;
  const slack = 3;
  const target_width = 2 * slack;
  let start_a = target - slack;
  let end_a = target + slack;

  // Positional
  let start_dist = pa - start_a;
  let pos_rel_a = 0;
  if (start_dist > 0) {
    pos_rel_a = start_dist;
  } else {
    pos_rel_a = start_dist + 360;
  }

  dist = Math.sqrt(px * px + py * py);
  let valid_dist = innerDist < dist < outerDist;

  return (0 <= pos_rel_a && pos_rel_a <= target_width && valid_dist)
}