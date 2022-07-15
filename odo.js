let px = 0, py = 0, pa = 90, dist = 0;

exports.coord_convert = function coord_convert(a) {
  let b = Math.round((450 - a) % 360);
  return b;
}

function setPos(pos) {
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
    // px = data.xOdometer.value[0];
    // py = data.yOdometer.value[0];
    // pa = Math.atan2(py, px) * 180 / Math.PI;
    // dist = Math.sqrt(px * px + py * py);
    setPos([data.xOdometer.value[0], data.yOdometer.value[0]]);
    /*console.log('  x: ' + global.posx + data.xOdometer.units);
    console.log('  y: ' + global.posy + data.yOdometer.units);*/
  });
}

exports.reached_target = function reached_target(target) {
  // Environmental parameters
  const outerDist = 52;
  const innerDist = 35;
  const strict_outerDist = 48;
  const strict_innerDist = 38;
  const slack = 10; //(6)
  // if (strict) {const slack = 3;} else {const slack = 6;}
  const target_width = 2 * slack;
  const strict_target_width = Math.round(target_width*3/5);
  let start_a = target - slack;
  let strict_start_a = target - slack*3/5;
  // let end_a = target + slack;

  // Positional
  let start_dist = pa - start_a;
  let strict_start_dist = pa - strict_start_a;
  let pos_rel_a = 0;
  if (start_dist > 0) {pos_rel_a = start_dist;} else {pos_rel_a = start_dist + 360;}
  let strict_pos_rel_a = 0;
  if (strict_start_dist > 0) {strict_pos_rel_a = strict_start_dist;} else {strict_pos_rel_a = strict_start_dist + 360;}

  dist = Math.sqrt(px * px + py * py);
  let valid_dist = innerDist < dist && dist < outerDist;
  let strict_valid_dist = strict_innerDist < dist && dist < strict_outerDist;
  let valid_angle = 0 <= pos_rel_a && pos_rel_a <= target_width;
  let strict_valid_angle = 0 <= strict_pos_rel_a && strict_pos_rel_a <= strict_target_width;
  // console.log(target_width, strict_target_width);

  let reached = valid_angle && valid_dist;
  let strict_reached = strict_valid_angle && strict_valid_dist;
  // console.log(target, pa, reached, valid_angle, pos_rel_a, target_width, dist, valid_dist)
  // console.log(target, pa, strict_reached, strict_valid_angle, strict_pos_rel_a, strict_target_width, dist, strict_valid_dist);
  // if (reached) {console.log(reached);}

  return [reached, strict_reached];
}