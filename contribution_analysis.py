from tuning import Tuning
import usb.core
import usb.util
import time
from datetime import datetime
import sys
import json

import convcontrib2 as ctrb

log = {
    'timestamp': datetime.timestamp(datetime.now()),
    'doa': 0,
    'person_speaking': 0,
    'start_time': datetime.timestamp(datetime.now()),
    'speech1': 0,
    'speech2': 0,
    'speech3': 0,
    'response1': [0,0,0],
    'response2': [0,0,0],
    'response3': [0,0,0],
    'score1': 0,
    'score2': 0,
    'score3': 0,
    'inclusivity': 0
}
prev_log = log


def updateLog(name, value):
    # print(log[name], prev_log[name])
    if name != 'timestamp' and value != log[name]:
        log[name] = value
        # prev_log[name] = log[name]
        return True
    elif name == 'timestamp':
        log[name] = value
        return False
    else:
        return False


def setup():
    """Set up the mic tuning."""
    dev = usb.core.find(idVendor=0x2886, idProduct=0x0018)

    if dev:
        tuning = Tuning(dev)
        tuning.write('GAMMAVAD_SR', 3.5)
        # tuning.write('GAMMAVAD_SR', 3)
        # json_obj = json.dumps(log)
        # print(json_obj)
        # print(log)
        return tuning


def contrib(mic_tuning):
    voice_angle = 0
    # curr_voice_angle = 0
    participants = {1: (0, 119), 2: (120, 269), 3: (270, 359)}
    old_speaker = 0
    person_speaking = 0
    inactive_speaker = 0
    active_speaker = 0
    silence_started = time.perf_counter()
    silence_gap = 0
    responses = [[0 for i in range(len(participants))]
                 for j in range(len(participants))]
    number_of_speakups = [0] * len(participants)
    scores = [1/len(participants)] * len(participants)
    inclusivity = 1

    # print(responses)
    # print('-----\nStart!\n\n-----')
    while True:
        # try:
        log_flag = False
        timestamp = datetime.timestamp(datetime.now())
        start_time = timestamp
        # log['timestamp'] = timestamp
        updateLog('timestamp', timestamp)
        # log_flag = True

        if mic_tuning.speech_detected():
            log_flag = True if updateLog(
                    'doa', mic_tuning.direction) else log_flag
            for person, border in participants.items():
                voice_angle = mic_tuning.direction - \
                    border[0] if mic_tuning.direction - \
                    border[0] > 0 else mic_tuning.direction-border[0]+360
                end_angle = border[1]-border[0] if border[1] - \
                    border[0] > 0 else border[1]-border[0]+360

                if voice_angle <= end_angle:
                    silence_started = 0  # There is no silence
                    person_speaking = person    # This person is speaking
                    # log['person speaking'] = person_speaking
                    log_flag = True if updateLog(
                        'person_speaking', person_speaking) else log_flag
                    # log_flag = True
                    if person_speaking != old_speaker:  # If this person wasn't already speaking…
                        start_time = datetime.timestamp(datetime.now())
                        updateLog('start_time', start_time)
                        number_of_speakups[person_speaking-1] += 1
                        log_flag = True if updateLog(
                            'speech'+str(person_speaking), number_of_speakups[person_speaking-1]) else log_flag
                        # log_flag = True if updateLog(
                        #     'speech1', number_of_speakups[0]) else log_flag
                        # log_flag = True if updateLog(
                        #     'speech2', number_of_speakups[1]) else log_flag
                        # log_flag = True
                        # print(number_of_speakups)
                        if old_speaker == 0:    # If nobody was speaking…
                            silence_ended = time.perf_counter()  # Silence ended
                            silence_gap = silence_ended - silence_started
                            # print('after {:0.2f}s of silence'.format(silence_gap))
                        else:
                            pass
                            # print('\n')
                        # print('Person {} is speaking at {}º'.format(
                        #     person_speaking, Mic_tuning.direction))
                        # print('-----')
                        # Someone else was speaking
                        if old_speaker and silence_gap <= 2:
                            # Record as response
                            responses[old_speaker
                                      - 1][person_speaking-1] += 1
                            # log['response1'] = responses[0]
                            # log['response2'] = responses[1]
                            scores, inclusivity = ctrb.contributions(
                                responses)
                            # log['score1'] = scores[0]
                            # log['score2'] = scores[1]
                            # log['inclusivity'] = inclusivity
                            # log_flag = True if updateLog(
                            #     'response1', responses[0]) else log_flag
                            # log_flag = True if updateLog(
                            #     'response2', responses[1]) else log_flag
                            for p in participants.keys():
                                log_flag = True if updateLog('response'+str(p), responses[p-1]) else log_flag
                            # log_flag = True if updateLog(
                            #     'score1', scores[0]) else log_flag
                            # log_flag = True if updateLog(
                            # 'score2', scores[1]) else log_flag

                            # for p in participants.keys():
                                log_flag = True if updateLog('score'+str(p), scores[p-1]) else log_flag

                            # log_flag = True if updateLog(
                            #     'score'+str(person_speaking), scores[person_speaking-1]) else log_flag

                            log_flag = True if updateLog(
                                'inclusivity', inclusivity) else log_flag
                            # print(scores, inclusivity)
                            # print(responses)
                            # print('\n-----')
                            # print(ctrb.contributions(responses))
                    else:   # If this person was already speaking…
                        # After 0.5s of speaking, make this person an 'active speaker'
                        if time.perf_counter()-silence_ended > 0.5 and active_speaker != person:
                            active_speaker = person
                            inactive_speaker = 0
                        # pass # ???
                    break   # Loop back again
        else:
            if not silence_started:  # If it wasn't silent, now it is
                silence_started = time.perf_counter()
                silence_gap = 0
            else:
                # If silent after someone spoke more than 2 seconds ago, noone is 'speaking' anymore
                if silence_started and old_speaker and time.perf_counter()-silence_started > 2:
                    person_speaking = 0
                    # log['person speaking'] = person_speaking
                    log_flag = True if updateLog(
                        'person_speaking', person_speaking) else log_flag
                    # log_flag = True
                    # print('\n…\n\n-----')
                else:                # Otherwise, the speaker is just inactive
                    if active_speaker:
                        inactive_speaker = active_speaker
                        active_speaker = 0
                    continue
        old_speaker = person_speaking
        # print(log_flag)
        if log_flag:
            json_obj = json.dumps(log)
            print(json_obj, flush=True)
            # print(log)

        # except KeyboardInterrupt:
        #     break


if __name__ == "__main__":
    while True:
        data = sys.stdin.readline()
        data = data.split('\n')[0]
        if data == 'setup':
            mic_tuning = setup()
        elif data == 'contrib':
            contrib(mic_tuning)
            # print(json.dumps(log))
        else:
            print('Unknown input')

