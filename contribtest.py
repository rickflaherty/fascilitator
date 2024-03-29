import convcontrib as ctrb

# row n is the number of responses that person n gets from every person
# column m is the responses person m gives each person

a = [[0,1,2,2,2,1],
     [1,0,0,0,0,0],
     [2,0,0,0,0,0],
     [2,0,0,0,1,0],
     [2,0,0,1,0,0],
     [1,0,0,0,0,0]]

b = [[0,1,1,2,2,1],
     [1,0,0,0,0,0],
     [1,0,0,0,0,0],
     [0,0,0,0,1,0],
     [0,0,0,1,0,0],
     [1,0,0,0,0,0]]

c = [[0,1,1,0,0,1],
     [1,0,0,0,0,0],
     [2,0,0,0,0,0],
     [2,0,0,0,1,0],
     [2,0,0,1,0,0],
     [1,0,0,0,0,0]]

d = [[0,0,0,0,0,0],
     [1,0,0,0,0,0],
     [2,0,0,0,0,0],
     [2,0,0,0,1,0],
     [2,0,0,1,0,0],
     [1,0,0,0,0,0]]

e = [[0,1,0,0,0,0],
     [1,0,0,0,0,0],
     [0,0,0,1,0,0],
     [0,0,1,0,0,0],
     [0,0,0,0,0,1],
     [0,0,0,0,1,0]]

f = [[0,1,1],
     [1,0,1],
     [1,1,0]]

g = [[0,1,2],
     [1,0,1],
     [2,1,0]]

h = [[0,5,5],
     [1,0,1],
     [1,9,0]]

tests = [a,b,c,d,e,f,g,h]

for i, test_matrix in enumerate(tests,1):
    scores, exclusivity = ctrb.contributions(test_matrix)
    print(str(i)+': ')
    print(scores)
    print(exclusivity)

