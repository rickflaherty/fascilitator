// const EventEmitter = require('events');
const sp = require("./doa.js");
const sphero = require('sphero');
const odo = require('./odo.js');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function coord_convert(a) {
  let b = Math.round((450 - a) % 360);
  return b;
}

function dir2pers(direction) {
  people = {1: [0, 119], 2: [120, 269], 3: [270, 359]};
  person = 0;
  for (const [p, d] of Object.entries(people)){
    if (d[0] <= direction && direction <= d[1]){
      person = p;
    }
  }
  return person;
}

function reached_target(pos, pos_a, target) {
  // Environmental parameters
  const outerDist = 45
  const innerDist = 40
  const slack = 2;
  const target_width = 2 * slack;
  let start_a = target - slack;
  let end_a = target + slack;

  let start_dist = pos_a - start_a;
  let pos_rel_a = 0;
  if (start_dist > 0) {
    pos_rel_a = start_dist;
  } else {
    pos_rel_a = start_dist + 360;
  }

  let dist = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1]);
  let valid_dist = innerDist < dist < outerDist;

  return (0 <= pos_rel_a && pos_rel_a <= target_width && valid_dist)
}

function circle_traj(dir) {
  // Environmental parameters
  const outerDist = 45
  const innerDist = 40

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

  // clockwise or anti-clockwise or no rotation
  let gen_diff = Math.ceil(difference);

  let dist = Math.sqrt(px * px + py * py);

  if (dist > outerDist) { // Far
    comp = 45;
  } else if (dist < innerDist){ // Close
    comp = -45;
  } else { // Just right
    comp = 0;
  }

  speed = Math.abs(gen_diff) * 1/2; 
  // speed = Math.abs(gen_diff) * 3/4; 
  if (-8 < gen_diff && gen_diff < 8) {
    traj = Math.round((posa + 180) % 360);
    speed = 0; // Stasis
  } else if (difference >= 8) {
    traj = Math.round((posa + 90 + comp) % 360);
  } else {
    traj = Math.round((posa + 270 - comp) % 360);
  }

  return [traj, speed];
}

function facilitate() {
  let [px, py] = odo.getPos();
  let posa = odo.getPosa();
  let doa = sp.getDoa();
  let data = sp.getData();
  let direction = sp.getDirection();
  let target_reached = reached_target([px, py], posa, doa);
  let trajsp = circle_traj(doa);
  let mov_mode = 'listen';
  let target = 0;
  let target_person = dir2pers(target);
  let traget_speaking = false;
  let targeting_start_time;
  let moving = false;

  setInterval(() => {
    let curr_time = new Date();
    let curr_time_stmp = curr_time.getTime() / 1000;
    [px, py] = odo.getPos();
    posa = odo.getPosa();
    direction = sp.getDirection();
    target_reached = reached_target([px, py], posa, direction);
    trajsp = circle_traj(direction);

    doa = sp.getDoa();
    data = sp.getData();
    let section_start_time = sp.getSectionStartTime();
    let section_time = curr_time_stmp - section_start_time;
    section_time = section_time.toFixed(3);
    // console.log('Section time: ' + section_time + 's');

    let avrg_sp_t = sp.getAvrgSpT();
    let roll_to = sp.getRollTo();

    if (mov_mode == 'listen'){
      target_reached = reached_target([px, py], posa, doa);
      trajsp = circle_traj(coord_convert(doa));
      // console.log(px, py, doa, trajsp);
      // sprkp.color('white');
      const thresh_min = 3;
      let threshold = avrg_sp_t / 2 > thresh_min ? avrg_sp_t / 2 : thresh_min;
      let person_speaking = sp.getPersonSpeaking();
      if (section_time > threshold && roll_to != 0 && person_speaking != 0) {
        mov_mode = 'target';
        target = direction;
        target_person = dir2pers(target);
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
      target_reached = reached_target([px, py], posa, target);
      trajsp = circle_traj(target);
      let target_person = dir2pers(target);
      let target_spoken = sp.target_spoke(target_person);
      if (!traget_speaking && target_spoken){
        traget_speaking = true;
        targeting_start_time = curr_time_stmp;
      } else if (traget_speaking && !target_spoken) {
        target_speaking = false;
      }

      const min_dis_min = 30;
      let min_disobedience = avrg_sp_t * 2 > min_dis_min ? avrg_sp_t * 2 : min_dis_min;

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

    // Roll
    sph_traj = coord_convert(traj);
    // console.log(sph_traj);

    if (speed <= 10 && moving) {
      // console.log('Stop rolling');
      sprkp.roll(speed, sph_traj)
      // sprkp.roll(speed, sph_traj).then(() => {console.log('stop: ' + posa + 'º' + ' Traj: ' + traj + 'º' + ' Speed: ' + speed + ' Extra: ' + global.posy + ', ' + global.posx)});
      moving = false;
    } else if (!target_reached && speed != 0) {
      moving = true;
      sprkp.roll(speed, sph_traj);
      // sprkp.roll(speed, sph_traj).then(function() {
      //   console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º' + ' Speed: ' + speed + ' Extra: ' + global.posy + ', ' + global.posx);
      // });
    }
  }, 750);
}


async function initialRoll() {
  const target = 90;
  let [px, py] = odo.getPos();
  let posa = odo.getPosa();
  let target_reached = reached_target([px, py], posa, target);


  let go_to_home_pos = setInterval(() => {
    target_reached = reached_target([px, py], posa, target);
    if (target_reached) {
      clearInterval(go_to_home_pos);
    };
    [px, py] = odo.getPos();
    posa = odo.getPosa();
    let trajsp = circle_traj(target);
    let traj = trajsp[0];
    let speed = trajsp[1];
    let sph_traj = coord_convert(traj);

    sprkp.roll(speed, sph_traj);
  }, 750);
  if (target_reached) {
    return true;
  }
}


// Run
// Choose Sphero
const sprkp = sphero("EF:C6:25:73:1A:31")
// const sprkp = sphero("D0:4D:38:49:00:32")

//Connect to Sphero
console.log('Connect…')
sprkp.connect().then(async () => {
  try {
    // Stream Sphero position and speech information
    odo.streamOdo(sprkp);
    sp.streamDoa();
    await delay(500);
    // Initiate Sphero position
    console.log('Start');
    sprkp.color('orange');
    await initialRoll();
    await delay(5000);
    // Start facilitating
    console.log('Go!');
    sprkp.color('white');
    facilitate();
  } catch (error) {
    console.error(error);
  }
});
