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

# 2. Train KMeans
kmeans = KMeans(n_clusters=5, random_state=42)
y_kmeans = kmeans.fit_predict(X)

# 3. Extract Centroids
centroids = kmeans.cluster_centers_.tolist()

# 4. Extract dataset for scatter plot
data_points = []
for i in range(len(df)):
    data_points.append({
        "income": float(df.iloc[i]['Annual Income (k$)']),
        "score": float(df.iloc[i]['Spending Score (1-100)']),
        "cluster": int(y_kmeans[i])
    })

# 5. Format the clusters descriptions
clusters_info = {
    0: {"name": "Target Customers", "desc": "High Income, High Spending"},
    1: {"name": "Average Customers", "desc": "Average Income, Average Spending"},
    2: {"name": "Careful Spenders", "desc": "High Income, Low Spending"},
    3: {"name": "Careless Spenders", "desc": "Low Income, High Spending"},
    4: {"name": "Sensible Customers", "desc": "Low Income, Low Spending"}
}
# Note: The indices might vary slightly depending on the K-Means random state, but with 42, we can see later. Let's just pass the centroids.
# Actually let's assign names based on centroids to be completely robust
cluster_names = {}
for i, center in enumerate(centroids):
    inc, scr = center
    if inc > 70 and scr > 70:
        cluster_names[i] = {"name": "Target Customers", "desc": "High Income, High Spending", "color": "#10b981"} # Green
    elif inc > 70 and scr < 40:
        cluster_names[i] = {"name": "Careful Spenders", "desc": "High Income, Low Spending", "color": "#3b82f6"} # Blue
    elif inc < 40 and scr > 70:
        cluster_names[i] = {"name": "Careless Spenders", "desc": "Low Income, High Spending", "color": "#f43f5e"} # Rose
    elif inc < 40 and scr < 40:
        cluster_names[i] = {"name": "Sensible Customers", "desc": "Low Income, Low Spending", "color": "#8b5cf6"} # Violet
    else:
        cluster_names[i] = {"name": "Average Customers", "desc": "Average Income, Average Spending", "color": "#f59e0b"} # Amber


model_params = {
    "centroids": centroids,
    "cluster_metadata": cluster_names,
    "data_points": data_points
}

# 6. Save to JSON
with open('model_params.json', 'w') as f:
    json.dump(model_params, f, indent=4)

print("model_params.json successfully created!")
