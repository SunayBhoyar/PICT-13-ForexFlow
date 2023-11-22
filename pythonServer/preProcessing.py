import pandas as pd

def read_csv(file_path):
    # Reads a CSV file into a DataFrame.
    df = pd.read_csv(file_path)
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

def save_and_display_result(df, output_file_path):
    # Saves the DataFrame to a new CSV file and displays the result.
    df.to_csv(output_file_path, index=False)
    print(f"DataFrame with missing dates saved to {output_file_path}")
    print(df)

def main():
    file_path = 'Exchange_Rate_Report_2012.csv'
    output_file_path = 'output_processed.csv'

    # Step 1: Read CSV
    df = read_csv(file_path)

    # Step 2: Extract year and generate date ranges
    year, original_date_range, new_date_range = extract_year_and_date_range(df)

    # Step 3: Identify missing dates
    missing_dates = identify_missing_dates(original_date_range, df)
    print("Dates that were missing in the original data:")
    print(missing_dates)

    # Step 4: Reindex the DataFrame with the new date range
    df = df.set_index('Date').reindex(new_date_range)
    df.reset_index(inplace=True)

    # Step 5: Fill missing values
    df = fill_missing_dates(df, df.columns)

    # Step 6: Save and display the result
    save_and_display_result(df, output_file_path)

if __name__ == "__main__":
    main()
