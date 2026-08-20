// This file is responsible for fetching data from backend.

import fetchWrapper from "@/lib/fetchWrapper";

type DataOverviewMetadata = {
  total_rows: number;
  total_columns: number;
  missing_values: number;
  numeric_cols: number;
  categorical_cols: number;
};

export async function getDataOverviewPageMetadata(datasetId: string) {
  const res = await fetchWrapper<DataOverviewMetadata>(
    `dataset/metadata/${datasetId}`,
  );

  return res;
}
