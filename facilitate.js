const sp = require("./doa");
const people = require("./people");
const odo = require('./odo');
const prp = require('./prettyPrint');

function colorCodeTarget(sprkp, person) {
  if (person == 1) {
    sprkp.color('green');
    } else if (person == 2) {
    sprkp.color('blue');
    } else if (person == 3) {
    sprkp.color('purple');
    } else {
    sprkp.color('red');
    }
}

exports.initialRoll = async function initialRoll(sprkp) {
  const target = 90;
  let target_reached = odo.reached_target(target);
  if (target_reached[0]) {sprkp.roll(50, odo.coord_convert(90));}
  
  let go_to_home_pos = setInterval(() => {
    target_reached = odo.reached_target(target);
    if (target_reached[0]) {
      clearInterval(go_to_home_pos);
    };
    stasis = false;
    let trajsp = this.circle_traj(target);
    let traj = trajsp[0];
    let speed = trajsp[1];
    let sph_traj = odo.coord_convert(traj);
    sprkp.roll(speed, sph_traj);
  }, 500);
  if (target_reached[0]) {
    return true;
  }
}

exports.circle_traj = function circle_traj(dir) {
  // Environmental parameters
  const outerDist = 45;
  const innerDist = 35;
  const range = outerDist - innerDist;
  const centerDist = (range) / 2 + innerDist;
  const slack = 0;
  
  // Position
  let [px, py] = odo.getPos();
  let posa = odo.getPosa();
  let difference = 0;
  let comp = 0;
  let traj = 0;
  let speed = 0;
  
  // Calculate angle difference from DOA
  difference = dir - posa;
  if (difference < - 180) {difference += 360;}
  if (difference > 180) {difference -= 360;}
  
  let gen_diff = Math.ceil(difference);
  let fund_speed = Math.abs(gen_diff) * 2/5
  speed = fund_speed; 
  
  let dist = Math.sqrt(px * px + py * py);
  
  if (dist > outerDist) { // Far
    comp = 90;
    speed += 8 * Math.min((dist-outerDist) * (2/range), 1.0) + 5;
  } else if (dist < innerDist){ // Close
    comp = -90;
    speed += 8 * Math.min((innerDist - dist) * (2/range), 1.0) + 5;
  } else if (dist > centerDist) {
    comp = 90 * Math.min((dist-centerDist) * (2/range), 1.0);
    speed += 8;
  } else if (dist < centerDist) {
    comp = -90 * Math.min((centerDist-dist) * (2/range), 1.0);
    speed += 8;
  }
  
  let valid_dist = innerDist < dist && dist < outerDist;
  // clockwise or anti-clockwise or no rotation
  if (-slack < gen_diff && gen_diff < slack) {
    if (valid_dist) {speed -= fund_speed+1;} // Stasis
    else {speed = 5;} //Math.abs(dist-centerDist);
    traj = Math.round((posa + 90 + comp) % 360);

  } else if (gen_diff >= slack) {
    traj = valid_dist ? Math.round((posa + 90 + comp/5) % 360):Math.round((posa + 90 + comp/3) % 360); 
  } else {
    traj = valid_dist ? Math.round((posa + 270 + comp/5) % 360):Math.round((posa + 270 - comp/3) % 360);
  }
  return [traj, speed];
}
  
let mov_mode = 'listen';
let target_person = 0;
let target = 90;
exports.getMovMode = function getMovMode() {return mov_mode;}
exports.getTargetPerson = function getTargetPerson() {return target_person;}
exports.getTarget = function getTarget() {return target;}

exports.facilitate = function facilitate(sprkp) {
  let stasis = true;
  let stopped = false;
  let doa = sp.getDoa();
  let direction = sp.getDirection();
  let target_reached = false;
  let trajsp = this.circle_traj(doa);
  let listen_target = doa;
  let traget_speaking = false;
  let strictness = 1;

  setInterval(() => {
    let curr_time = new Date();
    let curr_time_stmp = curr_time.getTime();

    direction = sp.getDirection();
    doa = sp.getDoa();
  
    let section_start_time = sp.getSectionStartTime();
    let section_time = (curr_time_stmp - section_start_time).toFixed(3);

    let avrg_sp_t = sp.getAvrgSpT();
    let roll_to = sp.getRollTo();

    stasis = true;
    if (mov_mode == 'listen'){
      let person_sp = sp.getPersonSpeaking();

      if (person_sp != null) {
        stasis = false;
        listen_target = doa;
      }
      target_reached = odo.reached_target(listen_target);
      if (!target_reached[strictness]) {
        stasis = false;
        trajsp = this.circle_traj(listen_target);
      }

      // Switch to Target Mode
      const thresh_min = 2000;
      let threshold = avrg_sp_t * 1000 / 2 > thresh_min ? avrg_sp_t * 1000 / 2 : thresh_min;
      let person_speaking = sp.getPersonSpeaking();
      if (section_time > threshold && roll_to != null && person_speaking != null) {
        mov_mode = 'target';
        target = direction;
        // target_person = people.dir2pers(target);
        // colorCodeTarget(sprkp, target_person);
      }
    } else if (mov_mode == 'target'){
      target_reached = odo.reached_target(target);
      if (!target_reached[strictness]) {
        stasis = false;
        trajsp = this.circle_traj(target);
      }

      target_person = people.dir2pers(target);
      let target_spoken = sp.target_spoke(target_person);
      if (!traget_speaking && target_spoken){
        traget_speaking = true;
        targeting_start_time = curr_time_stmp;
      } else if (traget_speaking && !target_spoken) {
        target_speaking = false;
      }

      // Switch to Listen Mode
      if (target_spoken && section_time >= 1000){ // No disobedience
        mov_mode = 'listen';
        listen_target = doa;
        sp.setSectionStartTime(curr_time_stmp);
        section_start_time = curr_time_stmp;
        section_time = (curr_time_stmp - section_start_time).toFixed(3);
        // prp.ppSphero();
      }
    }

    // Roll
    if (stasis && !stopped) {
      strictness = 0;
      stopped = true;
      sprkp.roll(0, 0);
    }
    if (!stasis) {
      strictness = 1;
      stopped = false;
    }

    if (!target_reached[strictness] && !stasis) {
      stopped = false;
      let traj = trajsp[0];
      let speed = trajsp[1];
      sph_traj = odo.coord_convert(traj);
      sprkp.roll(speed, sph_traj);
      // prp.ppSphero();
    }
  }, 500);
}