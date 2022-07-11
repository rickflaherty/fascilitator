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
    'section_time': 0, 
    'avrg_speech_time': 0, 
    'speech1': 0,
    'speech2': 0,
    'speech3': 0,
    'response1': [0,0,0],
    'response2': [0,0,0],
    'response3': [0,0,0],
    'score1': 0,
    'score2': 0,
    'score3': 0,
    'exclusivity': 0
}
prev_log = log


def updateLog(name, value):
    if name != 'timestamp' and value != log[name]:
        log[name] = value
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
        # tuning.write('GAMMAVAD_SR', 5)
        tuning.write('GAMMAVAD_SR', 4.8)
        # tuning.write('GAMMAVAD_SR', 3.5)
        # tuning.write('GAMMAVAD_SR', 3)
        return tuning


def contrib(mic_tuning):
    voice_angle = 0
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
    exclusivity = 1

    speech_count = 0;
    avrg_speech_time = 0;
    section_time = 0;

    while True:
        log_flag = False
        timestamp = datetime.timestamp(datetime.now())
        start_time = timestamp
        updateLog('timestamp', timestamp)

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
                    log_flag = True if updateLog(
                        'person_speaking', person_speaking) else log_flag
                    if person_speaking != old_speaker:  # If this person wasn't already speaking…
                        start_time = datetime.timestamp(datetime.now())
                        updateLog('start_time', start_time)
                        speech_count += 1
                        if speech_count == 1:
                            avrg_speech_time = section_time
                            log_flag = True if updateLog('avrg_speech_time', avrg_speech_time) else log_flag
                        elif speech_count > 1:
                            avrg_speech_time = avrg_speech_time * ((speech_count - 1)/speech_count) + section_time/speech_count
                            log_flag = True if updateLog('avrg_speech_time', avrg_speech_time) else log_flag
                        section_time = 0
                        updateLog('section_time', 0)
                        number_of_speakups[person_speaking-1] += 1
                        log_flag = True if updateLog('speech'+str(person_speaking), number_of_speakups[person_speaking-1]) else log_flag

                        if old_speaker == 0:    # If nobody was speaking…
                            silence_ended = time.perf_counter()  # Silence ended
                            silence_gap = silence_ended - silence_started
                            # print('after {:0.2f}s of silence'.format(silence_gap))
                        else:
                            pass

                        # Someone else was speaking
                        if old_speaker and silence_gap <= 2 and 0.3 <= (time.perf_counter() - silence_ended):
                            # Record as response
                            responses[old_speaker - 1][person_speaking - 1] += 1

                            scores, exclusivity = ctrb.contributions(responses)

                            for p in participants.keys():
                                log_flag = True if updateLog('response'+str(p), responses[p-1]) else log_flag
                                log_flag = True if updateLog('score'+str(p), scores[p-1]) else log_flag

                            log_flag = True if updateLog(
                                'exclusivity', exclusivity) else log_flag
                    else:   # If this person was already speaking…
                        # After 0.3s of speaking, make this person an 'active speaker'
                        if time.perf_counter()-silence_ended > 0.3 and active_speaker != person:
                            active_speaker = person
                            inactive_speaker = 0
                        section_time = time.perf_counter() - silence_ended
                        updateLog('section_time', time.perf_counter() - silence_ended)
                    break   # Loop back again
        else:
            if not silence_started:  # If it wasn't silent, now it is
                silence_started = time.perf_counter()
                silence_gap = 0
            else:
                # If silent after someone spoke more than 2 seconds ago, noone is 'speaking' anymore
                if silence_started and old_speaker and time.perf_counter()-silence_started > 2:
                    person_speaking = 0
                    if speech_count == 1:
                        avrg_speech_time = section_time
                        log_flag = True if updateLog('avrg_speech_time', avrg_speech_time) else log_flag
                    elif speech_count > 1:
                        avrg_speech_time = avrg_speech_time * ((speech_count - 1)/speech_count) + section_time/speech_count
                        log_flag = True if updateLog('avrg_speech_time', avrg_speech_time) else log_flag
                    section_time = 0
                    updateLog('section_time', 0)
                    log_flag = True if updateLog(
                        'person_speaking', person_speaking) else log_flag
                else:                # Otherwise, the speaker is just inactive
                    if active_speaker:
                        inactive_speaker = active_speaker
                        active_speaker = 0
                    continue
        old_speaker = person_speaking

        if log_flag:
            json_obj = json.dumps(log)
            print(json_obj, flush=True)


if __name__ == "__main__":
    while True:
        data = sys.stdin.readline()
        data = data.split('\n')[0]
        if data == 'setup':
            mic_tuning = setup()
        elif data == 'contrib':
            contrib(mic_tuning)
        else:
            print('Unknown input')

