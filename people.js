let people = {1: [0, 119], 2: [120, 269], 3: [270, 359]};
let directions = {1: 60, 2: 180, 3: 300};
let numOfPeople = 3;

exports.setNumOfPeople = function setNumOfPeople(n) {
  numOfPeople = n;
  people = {};
  directions = {};
  let range = 360 / n;
  let start = 0;
  let mid = start + range / 2;
  let end = start + range - 1;
  for (i = 1; i <= n; i++) {
    people[i] = [start, end];
    directions[i] = mid;
    start += range;
    mid += range;
    end += range;
  }
};

exports.getPeopleRange = function getPeopleRange() {
  return people;
};

exports.getPeopleDirections = function getPeopleDirections() {
  return directions;
};

exports.getNumOfPeople = function getNumOfPeople() {
  return numOfPeople;
};

exports.pers2dir = function pers2dir(person) {
  // const directions = {1: 60, 2: 180, 3: 300};
  return directions[person];
}

exports.dir2pers = function dir2pers(direction) {
  // people = {1: [0, 119], 2: [120, 269], 3: [270, 359]};
  person = 0;
  for (const [p, d] of Object.entries(people)) {
    if (d[0] <= direction && direction <= d[1]) {
      person = p;
    }
  }
  return person;
};
