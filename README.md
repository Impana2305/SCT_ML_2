# Customer Segmentation using K-Means Clustering

## Overview
This project aims to perform customer segmentation using the K-Means clustering algorithm. Customer segmentation is the practice of dividing a customer base into groups of individuals that are similar in specific ways relevant to marketing, such as age, gender, interests and spending habits. By understanding these segments, businesses can tailor their marketing strategies to target specific groups effectively.

## Dataset
The dataset used in this project contains information about customers, typically gathered from a mall or retail store. 
It consists of the following features:
*   **CustomerID:** Unique ID assigned to the customer.
*   **Gender:** Gender of the customer (Male/Female).
*   **Age:** Age of the customer.
*   **Annual Income (k$):** Annual income of the customer in thousands of dollars.
*   **Spending Score (1-100):** Score assigned by the store based on customer behavior and spending nature.

## Project Structure
*   `Customer_Segmentation_using_K_Means_Clustering.ipynb`: The main Jupyter Notebook containing the code for data exploration, preprocessing, model building, and visualization.
*   `README.md`: This file, providing an overview of the project.

## Dependencies
To run the code in this project, you will need the following Python libraries:
*   Python 3.x
*   pandas
*   numpy
*   matplotlib
*   seaborn
*   scikit-learn

You can install these dependencies using pip:
```bash
pip install pandas numpy matplotlib seaborn scikit-learn
```

## Methodology
The project follows these key steps:
1.  **Data Loading and Exploration:** Loading the dataset and understanding its structure, checking for missing values, and exploring basic statistics.
2.  **Exploratory Data Analysis (EDA):** Visualizing the distribution of features (Age, Annual Income, Spending Score) and understanding relationships between them using plots like histograms, scatter plots, and pair plots.
3.  **Data Preprocessing:** Selecting the relevant features for clustering. Often, 'Annual Income' and 'Spending Score' are used to visualize clusters in 2D, but more features can be used. Scaling the features is also an important step to ensure all variables contribute equally to the distance calculations in K-Means.
4.  **Determining the Optimal Number of Clusters (K):** Using the **Elbow Method** (plotting the Within-Cluster-Sum-of-Squares (WCSS) against the number of clusters) to find the "elbow" point, which indicates the most suitable number of clusters for the data.
5.  **Model Training:** Training the K-Means clustering algorithm with the optimal number of clusters determined in the previous step.
6.  **Visualizing the Clusters:** Creating scatter plots to visualize the formed customer segments and their respective centroids, making it easy to interpret the characteristics of each group.

## Results
The K-Means algorithm successfully identifies distinct customer segments based on their annual income and spending scores. These segments typically reveal groups such as:
*   High income, high spending (Target Customers)
*   High income, low spending
*   Low income, high spending
*   Low income, low spending
*   Average income, average spending

## Conclusion
Customer segmentation provides valuable insights into customer behavior. By categorizing customers into distinct groups, businesses can create personalized marketing campaigns, optimize product offerings, and improve overall customer satisfaction and retention.
