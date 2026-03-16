import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
import time

start_time = time.time()

# Notice we are using the new v2 CSV
features_csv_path = '/content/drive/MyDrive/Phishing_Data/extracted_features_v2.csv'
model_save_path = '/content/drive/MyDrive/Phishing_Data/phishing_sentinel_model_v2.pkl'

print("Loading upgraded features from Google Drive...")
df = pd.read_csv(features_csv_path)

X = df.drop('label', axis=1)
y = df['label']

print("Splitting dataset into training and testing sets...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training the Balanced Random Forest Classifier...")
# NEW: class_weight='balanced' forces the model to treat the 30k phishing sites as heavily as the 50k legitimate sites
clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1, class_weight='balanced')
clf.fit(X_train, y_train)

print("\n--- Training Complete! ---")
print("Evaluating upgraded model...")
y_pred = clf.predict(X_test)
accuracy = accuracy_score(y_test, y_pred) * 100
print(f"Accuracy: {accuracy:.2f}%\n")
print(classification_report(y_test, y_pred))

print(f"Saving the final model directly to Drive...")
joblib.dump(clf, model_save_path)

elapsed_time = (time.time() - start_time) / 60
print(f"All done! Total execution time: {elapsed_time:.2f} minutes.")
"""Loading upgraded features from Google Drive...
Splitting dataset into training and testing sets...
Training the Balanced Random Forest Classifier...

--- Training Complete! ---
Evaluating upgraded model...
Accuracy: 94.58%

              precision    recall  f1-score   support

           0       0.95      0.96      0.96      9910
           1       0.94      0.92      0.93      6042

    accuracy                           0.95     15952
   macro avg       0.94      0.94      0.94     15952
weighted avg       0.95      0.95      0.95     15952

Saving the final model directly to Drive...
All done! Total execution time: 0.24 minutes."""