import csv
import json
import convcontrib as ctrb

data = []
responses = []
next_speakers = []
scores = []
outs = []

with open('./data.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',', quotechar='"')
    for row in reader:
        data.append(row)
        print(row)

for d in data:
    response = [[],[],[]]
    response[0] = list(map(int, d['Responses to Person 0'].split(',')))
    response[1] = list(map(int, d['Responses to Person 1'].split(',')))
    response[2] = list(map(int, d['Responses to Person 2'].split(',')))
    responses.append(response)

    scores, exclusivity = ctrb.contributions(response)
    out = scores
    out.append(exclusivity)

    old_format_speaker = int(d['Person Speaking'])
    speaker = None if old_format_speaker == 0 else old_format_speaker - 1
    # speaker = old_format_speaker
    num_of_people = 3
    roll_to = None
    if speaker != None:
        response_sum = sum(response[speaker])
        interests = [0 for i in range(num_of_people)]
        for i in range(num_of_people):
            if i != speaker:
                prob_other_responds = 1 - (response[speaker][i] / response_sum) if response_sum != 0 else 0.5
                normed_score = scores[i]*num_of_people
                # score_factor = normed_score if normed_score > 1 else 2/3
                ideal_prop_other_repsponds = (num_of_people-2)/(num_of_people-1)
                # interest = score_factor * (prob_other_responds/ideal_prop_other_repsponds)
                interest = normed_score/3 * prob_other_responds/ideal_prop_other_repsponds/2
                interests[i] = interest
        interest_sum = sum(interests)
        if interest_sum != 0: roll_to = interests.index(max(interests))
    next_speakers.append(roll_to)
    out.append(roll_to)
    outs.append(out)

header = ['Spreadability of Person 0','Spreadability of Person 1','Spreadability of Person 2','Exclusivity', 'Should Speak Next']
# outs = []
# for r in responses:
#     # print(r)
#     scores, exclusivity = ctrb.contributions(r)
#     out = scores
#     out.append(exclusivity)
#     # print(out)
#     outs.append(out)

with open('output.csv', 'w', encoding='UTF8') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for o in outs:
        writer.writerow(o)