import csv
import json
import convcontrib2 as ctrb

data = []
responses = []
scores = []

with open('./data.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',', quotechar='"')
    for row in reader:
        data.append(row)
        print(row)

for d in data:
    response = [[],[],[]]
    response[0] = list(map(int, d['Responses_to_Person_0'].split(',')))
    response[1] = list(map(int, d['Responses_to_Person_1'].split(',')))
    response[2] = list(map(int, d['Responses_to_Person_2'].split(',')))
    responses.append(response)

header = ['Spreadability of Person 0','Spreadability of Person 1','Spreadability of Person 2','Exclusivity']
outs = []
for r in responses:
    # print(r)
    scores, exclusivity = ctrb.contributions(r)
    out = scores
    out.append(exclusivity)
    # print(out)
    outs.append(out)

with open('output.csv', 'w', encoding='UTF8') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for o in outs:
        writer.writerow(o)