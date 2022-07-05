const sp = require("./doa.js");
const odo = require('./odo.js');
// const sphero = require('sphero');

exports.circle_traj = function circle_traj(dir) {
  // Environmental parameters
  const outerDist = 45;
  const innerDist = 35;
  const range = outerDist - innerDist;
  const centerDist = (range) / 2 + innerDist;
  const slack = 3;
  
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
  // console.log(posa, difference);
  
  // clockwise or anti-clockwise or no rotation
  let gen_diff = Math.ceil(difference);
  speed = Math.abs(gen_diff) * 1/3; 
  
  let dist = Math.sqrt(px * px + py * py);
  
  if (dist > outerDist) { // Far
    comp = 45;
      // comp = 90 * Math.min((dist-centerDist) * (2/range), 1.0);
      speed += 5 * Math.min((dist-outerDist) * (2/range), 1.0);
      // console.log('Far');
  } else if (dist < innerDist){ // Close
    comp = -45;
    // comp = -90 * Math.min((centerDist-dist) * (2/range), 1.0);
    speed += 5 * Math.min((innerDist - dist) * (2/range), 1.0);
    // console.log('Close');
  } else if (dist > centerDist + slack) {
    comp = 45 * Math.round(Math.min((dist-centerDist) * (2/range), 1.0));
    // speed += 5;
  } else if (dist < centerDist - slack) {
    comp = -45 * Math.round(Math.min((centerDist-dist) * (2/range), 1.0));
    // speed += 5;
  } else {
    comp = 0;
    // console.log('Just Right');
  }
  
  // } else { // Just right
  //   comp = 0;
  //   console.log('Just Right');
  // }
  
  // console.log(dist, comp);
  
  // speed = Math.abs(gen_diff) * 3/4; 
  if (-5 < gen_diff && gen_diff < 5) {
    // traj = Math.round((posa + 180) % 360);
    speed = 0; // Stasis
  } else if (difference >= 5) {
    traj = Math.round((posa + 90 + comp) % 360);
  } else {
    traj = Math.round((posa + 270 - comp) % 360);
  }
  return [traj, speed];
}
  
exports.facilitate = function facilitate(sprkp) {
  let [px, py] = odo.getPos();
  let posa = odo.getPosa();
  let doa = sp.getDoa();
  // let data = sp.getData();
  let direction = sp.getDirection();
  // let target_reached = reached_target([px, py], posa, doa);
  let target_reached = odo.reached_target(doa);
  let trajsp = this.circle_traj(doa);
  let mov_mode = 'listen';
  let target = 0;
  let target_person = sp.dir2pers(target);
  let traget_speaking = false;
  let targeting_start_time;
  let moving = true;
  
  setInterval(() => {
    let curr_time = new Date();
    let curr_time_stmp = curr_time.getTime() / 1000;
    [px, py] = odo.getPos();
    posa = odo.getPosa();
    direction = sp.getDirection();
    // target_reached = reached_target([px, py], posa, direction);
    target_reached = odo.reached_target(direction);
    trajsp = this.circle_traj(direction);

    doa = sp.getDoa();
    data = sp.getData();
    let section_start_time = sp.getSectionStartTime();
    let section_time = curr_time_stmp - section_start_time;
    section_time = section_time.toFixed(3);
    // console.log('Section time: ' + section_time + 's');

    let avrg_sp_t = sp.getAvrgSpT();
    let roll_to = sp.getRollTo();

    if (mov_mode == 'listen'){
      // target_reached = reached_target([px, py], posa, doa);
      target_reached = odo.reached_target(doa);
      // trajsp = this.circle_traj(odo.coord_convert(doa));
      trajsp = this.circle_traj(doa);
    //   console.log(posa, doa, trajsp);
      // sprkp.color('white');
      const thresh_min = 3;
      let threshold = avrg_sp_t / 2 > thresh_min ? avrg_sp_t / 2 : thresh_min;
      let person_speaking = sp.getPersonSpeaking();
      if (section_time > threshold && roll_to != 0 && person_speaking != 0) {
        mov_mode = 'target';
        target = direction;
        target_person = sp.dir2pers(target);
        // console.log('Target: ', target_person, person_speaking);
        if (target_person == 1) {
        sprkp.color('green');
        } else if (target_person == 2) {
        sprkp.color('blue');
        } else if (target_person == 3) {
        sprkp.color('purple');
        } else {
        sprkp.color('red');
        }
      }
    } else if (mov_mode == 'target'){
      // target_reached = reached_target([px, py], posa, target);
      target_reached = odo.reached_target(target);
      trajsp = this.circle_traj(target);
      let target_person = sp.dir2pers(target);
      let target_spoken = sp.target_spoke(target_person);
      if (!traget_speaking && target_spoken){
        traget_speaking = true;
        targeting_start_time = curr_time_stmp;
      } else if (traget_speaking && !target_spoken) {
        target_speaking = false;
      }

      const min_dis_min = 10;
      let min_disobedience = avrg_sp_t * 2 > min_dis_min ? avrg_sp_t * 2 : min_dis_min;
      // console.log(min_disobedience);

      let targeting_time = curr_time_stmp - targeting_start_time;
      if (section_time > min_disobedience || (target_spoken && targeting_time >= 1)){
        // global.section_start_time = curr_time_stmp;
        sp.setSectionStartTime(curr_time_stmp);
        section_start_time = curr_time_stmp;
        section_time = curr_time_stmp - section_start_time;
        section_time = section_time.toFixed(3);
        mov_mode = 'listen';
        sprkp.color('white');
      }
    }

    let traj = trajsp[0];
    let speed = trajsp[1];
    // console.log(traj, doa);

    // Roll
    sph_traj = odo.coord_convert(traj);
    // console.log(sph_traj, speed, mov_mode);

    // sprkp.ping();
    // sprkp.roll(speed, sph_traj);
    // console.log(target_reached);
    if (speed <= 0 && moving) {
      // console.log('Stop rolling');
      // sprkp.ping();
      sprkp.roll(speed, sph_traj)
    //   sprkp.roll(0, sph_traj).then(() => {console.log('Stop.')});
      // sprkp.roll(speed, sph_traj).then(() => {console.log('stop: ' + posa + 'º' + ' Traj: ' + traj + 'º' + ' Speed: ' + speed + ' Extra: ' + global.posy + ', ' + global.posx)});
      moving = false;
    } else if (!target_reached && speed >= 0 && !moving) {
    //   sprkp.roll(speed, sph_traj).then(() => {console.log('Start again.')});
      // sprkp.ping();
      sprkp.roll(speed, sph_traj);
      moving = true;
    } else if (!target_reached && speed >= 0) {
      // moving = true;
      // sprkp.ping();
      sprkp.roll(speed, sph_traj);
    //   sprkp.roll(speed, sph_traj).then(function() {console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º' + ' Speed: ' + speed + ' Extra: ' + px + ', ' + py);});
    }
    // } else {
    // //   sprkp.ping();
    // //   sprkp.roll(speed, sph_traj);
    // }
  }, 500);
}
  
  
exports.initialRoll = async function initialRoll(sprkp) {
  const target = 90;
  let [px, py] = odo.getPos();
  let posa = odo.getPosa();
  // let target_reached = reached_target([px, py], posa, target);
  let target_reached = odo.reached_target(target);
  
  sprkp.roll(50, odo.coord_convert(90));
  
  let go_to_home_pos = setInterval(() => {
    // target_reached = reached_target([px, py], posa, target);
    target_reached = odo.reached_target(target);
    if (target_reached) {
      return true;
      clearInterval(go_to_home_pos);
    };
    [px, py] = odo.getPos();
    posa = odo.getPosa();
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