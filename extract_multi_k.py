import pandas as pd
import numpy as np
import json
import os
import urllib.request
from sklearn.cluster import KMeans

# 1. Fetch data
csv_url = "https://raw.githubusercontent.com/SteffiPeTaffy/machineLearningAZ/master/Machine%20Learning%20A-Z%20Template%20Folder/Part%204%20-%20Clustering/Section%2024%20-%20K-Means%20Clustering/Mall_Customers.csv"
if not os.path.exists("Mall_Customers.csv"):
    urllib.request.urlretrieve(csv_url, "Mall_Customers.csv")

df = pd.read_csv("Mall_Customers.csv")
X = df[['Annual Income (k$)', 'Spending Score (1-100)']]

# Predefined premium color palette
COLORS = ["#10b981", "#3b82f6", "#f43f5e", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#14b8a6"]

def get_segment_info(inc, scr):
    # Helper to assign semantic names/descriptions based on income and spending score
    if inc > 70 and scr > 70:
        return "Target Customers", "High Income, High Spending"
    elif inc > 70 and scr < 40:
        return "Careful Spenders", "High Income, Low Spending"
    elif inc < 40 and scr > 70:
        return "Careless Spenders", "Low Income, High Spending"
    elif inc < 40 and scr < 40:
        return "Sensible Customers", "Low Income, Low Spending"
    elif 40 <= inc <= 70 and 40 <= scr <= 70:
        return "Average Customers", "Average Income, Average Spending"
    elif inc > 70:
        return "Affluent Moderates", "High Income, Moderate Spending"
    elif inc < 40:
        return "Budget Moderates", "Low Income, Moderate Spending"
    elif scr > 70:
        return "Active Spenders", "Moderate Income, High Spending"
    elif scr < 40:
        return "Frugal Average", "Moderate Income, Low Spending"
    else:
        return "Standard Customers", "Moderate Income, Moderate Spending"

multi_k_params = {}

for k in range(2, 9):
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    y_kmeans = kmeans.fit_predict(X)
    raw_centroids = kmeans.cluster_centers_.tolist()
    
    # To keep cluster coloring stable across K changes, sort clusters by (income, score)
    sorted_indices = sorted(range(k), key=lambda i: (raw_centroids[i][0], raw_centroids[i][1]))
    
    # Create mapping from old index to sorted index
    index_mapping = {old: new for new, old in enumerate(sorted_indices)}
    
    # Rearrange centroids
    centroids = [raw_centroids[idx] for idx in sorted_indices]
    
    # Assign metadata
    cluster_metadata = {}
    for new_idx, center in enumerate(centroids):
        inc, scr = center
        name, desc = get_segment_info(inc, scr)
        color = COLORS[new_idx % len(COLORS)]
        cluster_metadata[str(new_idx)] = {
            "name": name,
            "desc": desc,
            "color": color
        }
        
    # Format data points with the mapped cluster index
    data_points = []
    for i in range(len(df)):
        old_cluster = int(y_kmeans[i])
        new_cluster = index_mapping[old_cluster]
        data_points.append({
            "income": float(df.iloc[i]['Annual Income (k$)']),
            "score": float(df.iloc[i]['Spending Score (1-100)']),
            "cluster": new_cluster
        })
        
    multi_k_params[str(k)] = {
        "centroids": centroids,
        "cluster_metadata": cluster_metadata,
        "data_points": data_points
    }

# Save output to both root and client src
for path in ['client/src/model_params.json', 'model_params.json']:
    with open(path, 'w') as f:
        json.dump(multi_k_params, f, indent=4)

print("multi-K model params successfully saved to client/src/model_params.json")
