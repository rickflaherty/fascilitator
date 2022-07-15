let people = {0: [0, 119], 1: [120, 269], 2: [270, 359]};
let directions = {0: 60, 1: 180, 2: 300};
let numOfPeople = 3;

exports.setNumOfPeople = function setNumOfPeople(n) {
  numOfPeople = n;
  people = {};
  directions = {};
  let range = 360 / n;
  let start = 0;
  let mid = start + range / 2;
  let end = start + range - 1;
  for (i = 0; i < n; i++) {
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
  person = null;
  for (const [p, d] of Object.entries(people)) {
    if (d[0] <= direction && direction <= d[1]) {
      person = p;
    }
  }
  return person;
};
