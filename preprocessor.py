from flask import Flask, request, jsonify, send_file
import pandas as pd
from io import BytesIO, StringIO

app = Flask(__name__)

def read_csv_from_string(csv_string):
    # Reads a CSV string into a DataFrame.
    df = pd.read_csv(StringIO(csv_string))
    return df

def extract_year_and_date_range(df):
    # Extracts the year from the first entry in the 'Date' column and generates date ranges.
    df['Date'] = pd.to_datetime(df['Date'])
    year = str(df['Date'].iloc[0].year)

    # Generate the original and new date ranges
    original_date_range = pd.date_range(start=df['Date'].min(), end=df['Date'].max(), freq='D')
    start_date = pd.to_datetime(df['Date'].min().strftime(f'{year}-01-01'))
    end_date = pd.to_datetime(df['Date'].max().strftime(f'{year}-12-31'))
    new_date_range = pd.date_range(start=start_date, end=end_date, freq='D')

    return year, original_date_range, new_date_range

def identify_missing_dates(original_date_range, df):
    # Identifies dates that are missing in the original data.
    missing_dates = original_date_range.difference(df['Date'])
    return missing_dates

def fill_missing_dates(df, column_names, window_size=10):
    # Fills missing values in the DataFrame.
    for i in range(1, len(column_names)):
        # Forward fill and then backward fill to fill missing values at the beginning
        df[column_names[i]].ffill(inplace=True)
        df[column_names[i]].bfill(inplace=True)
        # Fill missing values with the mean of a window of 10 surrounding elements
        df[column_names[i]].fillna(df[column_names[i]].rolling(window=window_size, min_periods=1).mean(), inplace=True)
    return df

def process_csv_file(csv_content):
    # Step 1: Read CSV
    df = read_csv_from_string(csv_content)

    # Step 2: Extract year and generate date ranges
    year, original_date_range, new_date_range = extract_year_and_date_range(df)

    # Step 3: Identify missing dates
    missing_dates = identify_missing_dates(original_date_range, df)

    # Step 4: Reindex the DataFrame with the new date range
    df = df.set_index('Date').reindex(new_date_range)
    df.reset_index(inplace=True)

    # Step 5: Fill missing values
    df = fill_missing_dates(df, df.columns)

    return df, missing_dates

@app.route('/process_csv', methods=['POST'])
def process_csv():
    try:
        file_content = request.files['file'].read().decode('utf-8')
        df_result, missing_dates = process_csv_file(file_content)

        # Step 6: Save the result to a new CSV file (optional)
        output_file_path = 'output_processed.csv'
        df_result.to_csv(output_file_path, index=False)

        # response_data = {
        #     'message': 'Processing complete',
        #     'missing_dates': missing_dates.tolist(),
        #     'result': jsonify(df_result)
        # }
        return send_file(
            BytesIO(output_file_path.encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name='output_processed.csv'
        )

        # return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
