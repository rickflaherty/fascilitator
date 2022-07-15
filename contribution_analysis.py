from tuning import Tuning
import usb.core
import usb.util
# import time
from datetime import datetime
import sys
import json

import convcontrib as ctrb

class Group:
    numOfPeople = int()
    participants = dict()

    def __init__(self, n=3):
        self.setNumOfPeople(n)

    def setNumOfPeople(self, n: int):
        self.numOfPeople = n

        width = int(360 / n)
        start = 0
        mid = int(start + width / 2)
        end = start + width - 1
        self.participants = {person: {'start': width*person+start, 'mid': width*person+mid, 'end': width*person+end} for person in range(n)}


class Snap:

    updated_significantly = False

    data = {
        'timestamp': 0,
        'start_time': 0,
        'section_time': 0, 
        'avrg_speech_time': 0, 
        'doa': 0,
        'person_speaking': 0,
        'speech': [],
        'responses': [],
        'scores': [],
        'exclusivity': 1,
        'next_speaker': None
    }

    def __init__(self, prev_snapshot = None):
        if not prev_snapshot:
            curr_time = datetime.timestamp(datetime.now())
            self.data['timestamp'] = curr_time
            self.data['start_time'] = curr_time
        else:
            self.data = prev_snapshot.data
            self.updated_significantly = False

    def update(self, key: str, value):
        valid_key = key in self.data.keys()
        if valid_key and self.data[key] != value:
            self.data[key] = value
            if key not in ['timestamp', 'start_time', 'section_time', 'doa']: self.updated_significantly = True

    def batchUpdate(self, new_data: dict):
        for key, value in new_data.items():
            self.update(key, value)


def is_within_angle_range(angle, angle_range: list[int]):
    """Determine if angle is within a range (360º == 0º)"""
    alt_angle = angle - angle_range[0] if angle - angle_range[0] >= 0 else angle - angle_range[0] + 360
    end_angle = angle_range[1] - angle_range[0] if angle_range[1] - angle_range[0] > 0 else angle_range[1] - angle_range[0] + 360
    return alt_angle <= end_angle


def setAvrgST(count: int, curr_average: float, time: float):
    """Given the count and exisiting average time interval, update the average time inteval"""
    if count > 1:
        return curr_average * ((count - 1)/count) + time/count
    return time


def setup(n: int):
    """Set up the mic tuning and group."""
    dev = usb.core.find(idVendor=0x2886, idProduct=0x0018)
    group = Group(n)

    if dev:
        tuning = Tuning(dev)
        tuning.write('GAMMAVAD_SR', 5)
        return [tuning, group]


def contrib(mic_tuning: Tuning, group: Group):
    """Print a snapshot of the conversation to console whenever there updated information"""
    prev_snapshot = Snap()

    curr_time = datetime.timestamp(datetime.now())
    start_time = curr_time
    silence_started = curr_time
    silent = True

    prev_speaker = None
    speaker = None
    active_speaker = None

    speech_count = 0
    avrg_speech_time = 0

    speech = [0 for i in range(group.numOfPeople)]
    responses = [[0 for i in range(group.numOfPeople)] for j in range(group.numOfPeople)]
    scores = [1/group.numOfPeople for i in range(group.numOfPeople)]
    exclusivity = 0
    roll_to = None

    prev_update = {
        'speech': speech,
        'responses': responses,
        'scores': scores 
    }
    prev_snapshot.batchUpdate(prev_update)

    while True:
        # Determine snap
        curr_snapshot = Snap(prev_snapshot)
        curr_time = round(datetime.timestamp(datetime.now()), 5)
        section_time = curr_time - start_time

        doa = mic_tuning.direction
        speech_detected = mic_tuning.speech_detected()
        if speech_detected:
            silent = False
            speaker = [person for person, angles in group.participants.items() if is_within_angle_range(doa, [angles['start'], angles['end']])][0]
            speaker_changed = speaker != prev_speaker
            if speaker_changed:
                speech_count += 1
                speech = curr_snapshot.data['speech']
                speech[speaker] += 1
                if prev_speaker == None: # Silence -> Speaking
                    silence_ended = curr_time
                elif curr_time - silence_ended >= 0.3: # Someone -> different someone speaking
                    responses[prev_speaker][speaker] += 1
                    scores, exclusivity = ctrb.contributions(responses)
                # Reset Section
                start_time = curr_time
                section_time = 0
            elif curr_time - silence_ended >= 0.3 and speaker != active_speaker: # A person continues speaking for longer than 0.3s
                active_speaker = speaker
        else:
            if silent == False: # Speaking -> Silence
                silent = True
                silence_started = curr_time
            elif prev_speaker != None and curr_time - silence_started >= 2: # Speaking -> Silence for more than 2s
                speaker = None
                avrg_speech_time = setAvrgST(speech_count, avrg_speech_time, section_time - 2)
                section_time = 0
            elif active_speaker: # If silent for less than 2s, then the speaker is just inactive
                active_speaker = None
        prev_speaker = speaker

        roll_to = None
        if speaker != None:
            response_sum = sum(responses[speaker])
            interests = [0 for i in range(group.numOfPeople)]
            for i in range(group.numOfPeople):
                if i != speaker:
                    prob_other_responds = 1 - (responses[speaker][i] / response_sum) if response_sum != 0 else 0.5
                    interest = scores[i] * prob_other_responds
                    interests[i] = interest
            interest_sum = sum(interests)
            if interest_sum != 0: roll_to = interests.index(max(interests))
        # direction_to_roll_to = group.participants[roll_to]['mid'] if roll_to else None

        # Update Snap
        data = {
            'timestamp': curr_time,
            'start_time': start_time,
            'section_time': section_time, 
            'avrg_speech_time': avrg_speech_time, 
            'doa': doa,
            'person_speaking': speaker,
            'speech': speech,
            'responses': responses,
            'scores': scores,
            'exclusivity': exclusivity,
            'next_speaker': roll_to
        }
        curr_snapshot.batchUpdate(data)

        # Print snap
        if curr_snapshot.updated_significantly:
            json_obj = json.dumps(curr_snapshot.data)
            print(json_obj, flush=True)
        
        prev_snapshot = curr_snapshot

if __name__ == "__main__":
    while True:
        data = sys.stdin.readline()
        data = data.split('\n')[0]
        data, *n = data.split(' ')
        n = int(n[0]) if len(n) > 0 else 3
        if data == 'setup':
            mic_tuning, group = setup(n)
        elif data == 'contrib':
            contrib(mic_tuning, group)
        else:
            print('Unknown input')

