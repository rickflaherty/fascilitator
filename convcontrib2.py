import math
import numpy as np
import networkx as nx
import statistics as stats


def from_list_of_list(list):
    G = nx.DiGraph()
    edges = [(i, j, w) for i, row in enumerate(list) for j, w in enumerate(row)]
    # edges = [(j, i, w) for i, row in enumerate(list) for j, w in enumerate(row)]
    G.add_weighted_edges_from(edges)
    return G


def contributions(matrix):
    a = np.array(matrix)
    g = from_list_of_list(a)
    pr = nx.pagerank_numpy(g, alpha=0.9)

    scores = list([round(v, 5) for v in pr.values()])

    exclusivity = stats.stdev(scores)*math.sqrt(len(a))
    # exclusivity = 1 if exclusivity > 1 else exclusivity
    exclusivity = round(exclusivity, 5)

    return scores, exclusivity

