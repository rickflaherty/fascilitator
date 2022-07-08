import math
import numpy as np
import statistics as stats


def contributions(matrix):
    a = np.array(matrix)
    # a = a.transpose()
    # print(a)
    row_sum = np.sum(a, axis=1)
    # print(row_sum)
    b = []
    for i, row in enumerate(a):
        #if row_sum[i] == 0:
        #    row = [1/len(row) for n in row]
        b.append(list(row+(row_sum[i]/(9*len(row)))))
    # print(b)
    w, v = np.linalg.eig(b)
    #print(w,v)
    # eigen_index = np.where(np.around(w,5) == np.float64(1))
    w_closeness = [np.abs(round(np.abs(val)-1, 0)) for val in w]
    #print(w_closeness)
    eigen_index = np.array(w_closeness.index(min(w_closeness)))
    # print(eigen_index)
    v = v.transpose()
    v_eigen = np.abs(v[eigen_index])
    score_vector = v_eigen/np.sum(v_eigen)  # Can possibly remove this step
    # score_vector = v_eigen
    root_scores = score_vector/math.sqrt(np.sum(score_vector**2))
    scores = list(root_scores**2)

    # scores = list(np.around(score_vector, 3))

    exclusivity = stats.stdev(scores)*math.sqrt(len(a))
    exclusivity = 1 if exclusivity > 1 else exclusivity

    exclusivity = round(exclusivity, 3)

    return scores, exclusivity

