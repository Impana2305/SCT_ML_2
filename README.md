# Customer Segmentation using K-Means Clustering
**SkillCraft Technology - Machine Learning Internship (Task 02)**

This repository contains an end-to-end Machine Learning project to perform customer segmentation using the K-Means clustering algorithm. It includes a comprehensive Jupyter Notebook detailing the entire data science workflow, from data exploration to cluster visualization, based on customer purchasing behavior and demographic data.

## 📋 Table of Contents
- [🎯 Objective](#-objective)
- [🛠️ Machine Learning Workflow](#️-machine-learning-workflow)
- [📈 Evaluation Metrics & Performance](#-evaluation-metrics--performance)
- [📊 Project Visualizations & Insights](#-project-visualizations--insights)
- [📂 Repository Structure](#-repository-structure)
- [🚀 Getting Started & Local Execution](#-getting-started--local-execution)

## 🎯 Objective
The primary goal of this task is to construct an unsupervised machine learning model that groups retail customers into distinct segments based on their purchasing patterns and income. This helps businesses tailor their marketing strategies and optimize customer relationship management. The main features utilized for clustering are:
* **Annual Income (k$)**: The annual income of the customer in thousands of dollars.
* **Spending Score (1-100)**: A metric assigned by the store based on customer behavior and spending nature.
* **Age**: Age of the customer.

## 🛠️ Machine Learning Workflow
The model was built using the following step-by-step pipeline in the Jupyter Notebook:
1. **Data Collection & Load:** Loaded the raw customer dataset and validated rows, shapes, and features.
2. **Data Preprocessing & Cleaning:**
   * Checked and confirmed zero null values (`df.isnull().sum()`).
   * Examined data distributions to ensure clustering algorithms perform optimally.
3. **Feature Selection:** Selected relevant features for clustering, primarily focusing on `Annual Income (k$)` and `Spending Score (1-100)` for optimal 2D visualization and clear segmentation.
4. **Determining Optimal Clusters (Elbow Method):** 
   * Iterated through various cluster counts (e.g., 1 to 10) and calculated the Within-Cluster Sum of Squares (WCSS).
   * Plotted the Elbow Curve to pinpoint the optimal value for `K`.
5. **Model Building & Training:** 
   * Fitted a Scikit-Learn `KMeans` model using the optimal number of clusters derived from the Elbow Method (typically K=5).

## 📈 Evaluation Metrics & Performance
Unlike supervised learning, K-Means clustering is evaluated based on distance metrics and interpretability:
| Metric | Description |
| :--- | :--- |
| **WCSS (Within-Cluster Sum of Squares)** | Used to measure the variance within each cluster. A lower WCSS indicates tighter, more cohesive clusters. The "elbow" point dictates the balance between minimizing WCSS and keeping a reasonable number of clusters. |
| **Cluster Interpretability** | The final model yielded well-defined, actionable customer groups enabling targeted business strategies. |

## 📊 Project Visualizations & Insights
The Jupyter Notebook embeds comprehensive `seaborn` and `matplotlib` charts representing key findings:
* **Elbow Method Line Chart:** Visualizes the WCSS decline against the number of clusters, allowing for a clear identification of the optimal `K` value.
* **Cluster Scatter Plot:** Maps Annual Income vs. Spending Score, with distinct colors representing different customer segments. Centroids are prominently highlighted to show the center of each demographic block.
* **Insights Derived:**
  * **Target Customers:** High Income, High Spending - Ideal market for premium campaigns.
  * **Careless Spenders:** Low Income, High Spending.
  * **Careful Spenders:** High Income, Low Spending - High potential for strategic conversion.
  * **Sensible Customers:** Low Income, Low Spending.
  * **Average Customers:** Average Income, Average Spending.

## 📂 Repository Structure
```text
├── Customer_Segmentation_using_K_Means_Clustering.ipynb  # Pre-executed Jupyter Notebook
├── README.md                                             # Project portfolio documentation (this file)
```

## 🚀 Getting Started & Local Execution
**Running the Jupyter Notebook (.ipynb)**
To explore the machine learning model training steps and visualizations:

1. Ensure Python 3.10+ is installed.
2. Install dependencies:
   ```bash
   pip install pandas numpy matplotlib seaborn scikit-learn notebook ipykernel
   ```
3. Launch Jupyter:
   ```bash
   jupyter notebook
   ```
4. Open `Customer_Segmentation_using_K_Means_Clustering.ipynb` and run the cells.
