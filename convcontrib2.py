import math
import numpy as np
import networkx as nx
import statistics as stats


def from_list_of_list(list):
    G = nx.DiGraph()
    # edges = [(i, j, w) for i, row in enumerate(list) for j, w in enumerate(row) if w != 0]
    edges = [(i, j, w) for i, row in enumerate(list) for j, w in enumerate(row)]
    # edges = [(j, i, w) for i, row in enumerate(list) for j, w in enumerate(row)]
    G.add_weighted_edges_from(edges)
    return G


def contributions(matrix):
    a = np.array(matrix)
    g = from_list_of_list(a)
    # print(g.nodes, g.edges(data=True))
    pr = nx.pagerank_numpy(g, alpha=0.9)

    scores = list([round(v, 5) for v in pr.values()])

    inclusivity = 1-stats.stdev(scores)*math.sqrt(len(a))
    inclusivity = 0 if inclusivity < 0 else inclusivity
    inclusivity = round(inclusivity, 5)

    return scores, inclusivity

