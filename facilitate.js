const sp = require("./doa");
const people = require("./people");
const odo = require('./odo');

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
  if (target_reached) {sprkp.roll(50, odo.coord_convert(90));}
  
  let go_to_home_pos = setInterval(() => {
    target_reached = odo.reached_target(target);
    if (target_reached) {
      clearInterval(go_to_home_pos);
    };
    let trajsp = this.circle_traj(target);
    let traj = trajsp[0];
    let speed = trajsp[1];
    let sph_traj = odo.coord_convert(traj);
    sprkp.roll(speed, sph_traj);
  }, 500);
  if (target_reached) {
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
  // console.log(dir, posa, difference);
  
  let gen_diff = Math.ceil(difference);
  speed = Math.abs(gen_diff) * 2/5; 
  
  let dist = Math.sqrt(px * px + py * py);
  
  if (dist > outerDist) { // Far
    comp = 60;
    // comp = 90 * Math.min((dist-outerDist) * (2/range), 1.0);
    speed += 5 * Math.min((dist-outerDist) * (2/range), 1.0) + 3;
      // console.log('Far');
  } else if (dist < innerDist){ // Close
    comp = -60;
    // comp = -90 * Math.min((innerDist-dist) * (2/range), 1.0);
    speed += 5 * Math.min((innerDist - dist) * (2/range), 1.0) + 3;
    // console.log('Close');
  } else if (dist > centerDist + slack) {
    comp = 60 * Math.min((dist-centerDist) * (2/range), 1.0);
    // console.log(Math.min((dist-centerDist) * (2/range), 1.0))
    speed += 3;
  } else if (dist < centerDist - slack) {
    comp = -60 * Math.min((centerDist-dist) * (2/range), 1.0);
    // console.log(Math.min((centerDist-dist) * (2/range), 1.0))
    speed += 3;
  } else {
    comp = 0;
    // console.log('Just Right');
  }
  
  // clockwise or anti-clockwise or no rotation
  if (-5 < gen_diff && gen_diff < 5) {
    // traj = Math.round((posa + 180) % 360);
    speed = 0; // Stasis
  } else if (difference >= 5) {
    traj = Math.round((posa + 90 + comp) % 360);
  } else {
    traj = Math.round((posa + 270 - comp) % 360);
  }
  // console.log(posa,dir, dist, comp, speed);
  return [traj, speed];
}
  
let mov_mode = 'listen';
exports.getMovMode = function getMovMode() {return mov_mode;}

exports.facilitate = function facilitate(sprkp) {
  let doa = sp.getDoa();
  let direction = sp.getDirection();
  let target_reached = odo.reached_target(doa);
  let trajsp = this.circle_traj(doa);
  // let mov_mode = 'listen';
  let target = 0;
  let target_person = people.dir2pers(target);
  let traget_speaking = false;
  let targeting_start_time;
  
  setInterval(() => {
    let curr_time = new Date();
    let curr_time_stmp = curr_time.getTime() / 1000;
    // let [px, py] = odo.getPos();
    // let posa = odo.getPosa();
    direction = sp.getDirection();

    doa = sp.getDoa();
    data = sp.getData();
    let section_start_time = sp.getSectionStartTime();
    let section_time = curr_time_stmp - section_start_time;
    section_time = section_time.toFixed(3);
    // console.log('Section time: ' + section_time + 's');

    let avrg_sp_t = sp.getAvrgSpT();
    let roll_to = sp.getRollTo();

    if (mov_mode == 'listen'){
      target_reached = odo.reached_target(doa);
      if (!target_reached) {trajsp = this.circle_traj(doa);}
      // console.log(posa, doa, trajsp);

      // Switch to Target Mode
      const thresh_min = 3;
      let threshold = avrg_sp_t / 2 > thresh_min ? avrg_sp_t / 2 : thresh_min;
      let person_speaking = sp.getPersonSpeaking();
      if (section_time > threshold && roll_to != 0 && person_speaking != 0) {
        mov_mode = 'target';
        target = direction;
        target_person = sp.dir2pers(target);
        this.colorCodeTarget(sprkp, target_person);
      }
    } else if (mov_mode == 'target'){
      target_reached = odo.reached_target(target);
      if (!target_reached) {trajsp = this.circle_traj(target);}

      let target_person = people.dir2pers(target);
      let target_spoken = sp.target_spoke(target_person);
      if (!traget_speaking && target_spoken){
        traget_speaking = true;
        targeting_start_time = curr_time_stmp;
      } else if (traget_speaking && !target_spoken) {
        target_speaking = false;
      }

      // Boredom (Switch to Listen Mode)
      const min_dis_min = 10;
      let min_disobedience = avrg_sp_t * 2 > min_dis_min ? avrg_sp_t * 2 : min_dis_min;

      // Switch to Listen Mode
      let targeting_time = curr_time_stmp - targeting_start_time;
      if (section_time > min_disobedience || (target_spoken && targeting_time >= 1)){
        mov_mode = 'listen';
        sprkp.color('white');
        sp.setSectionStartTime(curr_time_stmp);
        section_start_time = curr_time_stmp;
        section_time = curr_time_stmp - section_start_time;
        section_time = section_time.toFixed(3);
      }
    }

    // Roll
    if (!target_reached) {
      let traj = trajsp[0];
      let speed = trajsp[1];
      sph_traj = odo.coord_convert(traj);
      sprkp.roll(speed, sph_traj);
    }
  }, 500);
}