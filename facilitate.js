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

async function waitUntil(condition) {
  return await new Promise(resolve => {
    const interval = setInterval(() => {
      if (condition) {
        resolve('foo');
        clearInterval(interval);
      };
    }, 1000);
  });
}

exports.initialRoll = function initialRoll(sprkp, callback) {
  const target = 90;
  let target_reached = odo.reached_target(target);
  if (target_reached[0]) {sprkp.roll(50, odo.coord_convert(90));}

  let go_to_home_pos = setInterval(() => {
    // stasis = false;
    target_reached = odo.reached_target(target);
    if (!target_reached[0]) {
      let trajsp = this.circle_traj(target);
      let traj = trajsp[0];
      let speed = trajsp[1];
      let sph_traj = odo.coord_convert(traj);
      sprkp.roll(speed, sph_traj);
      // console.log(speed, sph_traj);
    } else {
      sprkp.roll(0, 0);
      callback(true)
      clearInterval(go_to_home_pos);
    };
  }, 500);
}

exports.circle_traj = function circle_traj(dir) {
  // Environmental parameters
  const outerDist = 48;
  const innerDist = 38;
  const range = outerDist - innerDist;
  const centerDist = (range) / 2 + innerDist;
  const slack = 10;
  
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
  // console.log(dir, posa, difference);
  
  let gen_diff = Math.ceil(difference);
  let fund_speed = Math.abs(gen_diff) * 1/3
  speed = fund_speed; 
  
  let dist = Math.sqrt(px * px + py * py);
  
  if (dist > outerDist) { // Far
    comp = 90;
    // comp = 90 * Math.min((dist-outerDist) * (2/range), 1.0);
    speed += 5 * Math.min((dist-outerDist) * (2/range), 1.0) + 7;
      // console.log('Far');
  } else if (dist < innerDist){ // Close
    comp = -90;
    // comp = -90 * Math.min((innerDist-dist) * (2/range), 1.0);
    speed += 5 * Math.min((innerDist - dist) * (2/range), 1.0) + 7;
    // console.log('Close');
  } else if (dist > centerDist) {
    comp = 90 * Math.min((dist-centerDist) * (2/range), 1.0);
    // console.log(Math.min((dist-centerDist) * (2/range), 1.0))
    speed += 7;
  } else if (dist < centerDist) {
    comp = -90 * Math.min((centerDist-dist) * (2/range), 1.0);
    // console.log(Math.min((centerDist-dist) * (2/range), 1.0))
    speed += 7;
    // console.log('Just Right');
  }
  
  let valid_dist = innerDist < dist && dist < outerDist;
  let divisor_l = Math.round(Math.abs(4 * (gen_diff/180)))+1
  let divisor_s = Math.round(Math.abs(2 * (gen_diff/180)))+1
  // console.log(divisor_l, divisor_s);
  // console.log(valid_dist, dist);
  // clockwise or anti-clockwise or no rotation
  if (-slack < gen_diff && gen_diff < slack) {
    // speed -= Math.abs(gen_diff) * 2/5; // Stasis
    if (valid_dist) {speed -= fund_speed+1;} // Stasis
    else {8;} //Math.abs(dist-centerDist);

    traj = Math.round((posa + 90 + comp) % 360);
    // if (valid_dist) {traj = Math.round((posa + 90 + comp) % 360);}
    // else {traj = Math.round((posa + 90 + comp) % 360);}

  } else if (gen_diff >= slack) {
    // traj = Math.round((posa + 90 + comp/6) % 360);
    traj = valid_dist ? Math.round((posa + 90 + comp/divisor_l) % 360):Math.round((posa + 90 + comp/divisor_s) % 360); 
    // if (valid_dist) {traj = Math.round((posa + 90) % 360);} else {traj = Math.round((posa + 90 + comp/6) % 360);}
    // else {traj = Math.round((posa + 90 + comp) % 360);}
  } else {
    // traj = Math.round((posa + 270 - comp/6) % 360);
    traj = valid_dist ? Math.round((posa + 270 + comp/divisor_l) % 360):Math.round((posa + 270 - comp/divisor_s) % 360);
    // if (valid_dist) {traj = Math.round((posa + 270) % 360);} else {traj = Math.round((posa + 270 - comp/6) % 360);}
    // else {traj = Math.round((posa + 270 - comp) % 360);}
  }
  // console.log(posa,dir, dist, comp, speed);
  if (speed > 100) {speed = 100;} else {speed = Math.round(speed);}
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
  let target_reached = [false, false];
  let trajsp = this.circle_traj(doa);
  // let mov_mode = 'listen';
  let listen_target = doa;
  // let bored = 0;
  // target = 0;
  // target_person = people.dir2pers(target);
  let traget_speaking = false;
  // let targeting_start_time;
  let strictness = 1;

  let prev_trajsp = [0, 90];
  setInterval(() => {
    let curr_time = new Date();
    let curr_time_stmp = curr_time.getTime(); // /1000

    direction = sp.getDirection();
    doa = sp.getDoa();
  
    let section_start_time = sp.getSectionStartTime(); // /1000
    let section_time = (curr_time_stmp - section_start_time).toFixed(3);
    // section_time = section_time.toFixed(3);
    // console.log('Section time: ' + section_time + 's');

    let avrg_sp_t = sp.getAvrgSpT();
    let roll_to = sp.getRollTo();

    stasis = true;
    // console.log('Stasis: '+stasis);
    if (mov_mode == 'listen'){
      let person_sp = sp.getPersonSpeaking();

      if (person_sp) {
        stasis = false;
        listen_target = doa;
        // console.log('Target: '+listen_target);
      }
      target_reached = odo.reached_target(listen_target);
      // console.log(listen_target, target_reached);
      if (!target_reached[strictness]) {
        stasis = false;
        trajsp = this.circle_traj(listen_target);
      }
      // console.log(target_reached + ' stasis: '+stasis);
      // console.log(posa, doa, trajsp);

      // Switch to Target Mode
      const thresh_min = 2000;
      let threshold = avrg_sp_t * 1000 / 2 > thresh_min ? avrg_sp_t * 1000 / 2 : thresh_min;
      let person_speaking = sp.getPersonSpeaking();
      // console.log(section_time, avrg_sp_t, threshold);
      if (section_time > threshold && roll_to != 0 && person_speaking != 0) {
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

      // let target_person = people.dir2pers(target);
      target_person = people.dir2pers(target);
      let target_spoken = sp.target_spoke(target_person);
      if (!traget_speaking && target_spoken){
        traget_speaking = true;
        targeting_start_time = curr_time_stmp;
      } else if (traget_speaking && !target_spoken) {
        target_speaking = false;
      }

      // Boredom (Switch to Listen Mode)
      // const min_dis_min = 10000;
      // let min_disobedience = avrg_sp_t * 2000 > min_dis_min ? avrg_sp_t * 2000 : min_dis_min;

      // Switch to Listen Mode
      // let targeting_time = curr_time_stmp - targeting_start_time;
      // console.log(targeting_time, section_time, avrg_sp_t);
      // if (stasis) {console.log(target);}
      if (target_spoken && section_time >= 1000){ // No disobedience
      // if (section_time > min_disobedience || (target_spoken && section_time >= 1000)){ // && targeting_time >= 5000
        mov_mode = 'listen';
        // sprkp.color('white');
        listen_target = doa;
        sp.setSectionStartTime(curr_time_stmp);
        section_start_time = curr_time_stmp;
        section_time = (curr_time_stmp - section_start_time).toFixed(3);
        // section_time = section_time.toFixed(3);
        // prp.ppSphero();
        // console.log(mov_mode);
      }
    }

    // Roll
    if (stasis && !stopped) {
      strictness = 0;
      stopped = true;
      sprkp.roll(0, doa);
      console.log('Stop!');
      // sprkp.ping();
    }
    if (!stasis && stopped) {
    // if (!stasis) {
      strictness = 1;
      stopped = false;
      console.log('Go!');
      // sprkp.ping();
    }

    if (!target_reached[strictness] && !stasis) {
      stopped = false;
      let traj = trajsp[0];
      let speed = trajsp[1];
      sph_traj = odo.coord_convert(traj);
      sprkp.roll(speed, sph_traj);
      console.log(speed, sph_traj);
      // prp.ppSphero();
    }
  }, 500);
}