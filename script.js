const { DataFrame, to_datetime, date_range } = require('pandas-js');
// const { read_csv } = require('pandas-js/io');
const csv = require('csv-parser');

function readCsv(file_path) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(file_path)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve(rows);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function freadCsv(file_path) {
    // Reads a CSV file into a DataFrame.
    const df = new DataFrame(readCsv(file_path));
    return df;
}

function extractYearAndDateRange(df) {
    // Extracts the year from the first entry in the 'Date' column and generates date ranges.
    df.set('Date', to_datetime(df.get('Date')));
    const year = df.get('Date').iloc(0).year.toString();

    // Generate the original and new date ranges
    const originalDateRange = date_range({
        start: df.get('Date').min(),
        end: df.get('Date').max(),
        freq: 'D'
    });
    const startDate = to_datetime(df.get('Date').min().strftime(`${year}-01-01`));
    const endDate = to_datetime(df.get('Date').max().strftime(`${year}-12-31`));
    const newDateRange = date_range({
        start: startDate,
        end: endDate,
        freq: 'D'
    });

    return [year, originalDateRange, newDateRange];
}

function identifyMissingDates(originalDateRange, df) {
    // Identifies dates that are missing in the original data.
    const missingDates = originalDateRange.difference(df.get('Date'));
    return missingDates;
}

function fillMissingDates(df, columnNames, windowSize = 10) {
    // Fills missing values in the DataFrame.
    for (let i = 1; i < columnNames.length; i++) {
        // Forward fill and then backward fill to fill missing values at the beginning
        df.set(columnNames[i], df.get(columnNames[i]).ffill());
        df.set(columnNames[i], df.get(columnNames[i]).bfill());
        // Fill missing values with the mean of a window of 10 surrounding elements
        df.set(columnNames[i], df.get(columnNames[i]).rolling(windowSize, 1).mean().fillna());
    }
    return df;
}

function saveAndDisplayResult(df, outputFilePath) {
    // Saves the DataFrame to a new CSV file and displays the result.
    df.to_csv(outputFilePath, { index: false });
    console.log(`DataFrame with missing dates saved to ${outputFilePath}`);
    console.log(df.toString());
}

function main() {
    const filePath = 'Exchange_Rate_Report_2012.csv';
    const outputFilePath = 'output_processed.csv';

    // Step 1: Read CSV
    const df = freadCsv(filePath);

    // Step 2: Extract year and generate date ranges
    const [year, originalDateRange, newDateRange] = extractYearAndDateRange(df);

    // Step 3: Identify missing dates
    const missingDates = identifyMissingDates(originalDateRange, df);
    console.log('Dates that were missing in the original data:');
    console.log(missingDates.toString());

    // Step 4: Reindex the DataFrame with the new date range
    df.set('Date', df.get('Date').setIndex(newDateRange));
    df.resetIndex(inplace=true);

    // Step 5: Fill missing values
    df = fillMissingDates(df, df.columns);

    // Step 6: Save and display the result
    saveAndDisplayResult(df, outputFilePath);
}

main();
