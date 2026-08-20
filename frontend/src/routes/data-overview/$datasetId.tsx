import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";

import DataOverview from "@/features/data_overview/DataOverview";
import { EmptyDemo } from "@/components/app/ui/EmptyState";
import fetchWrapper from "@/lib/fetchWrapper";

type DataOverviewMetadata = {
  total_rows: number;
  total_columns: number;
  missing_values: number;
  numeric_cols: number;
  categorical_cols: number;
};

type DataOverViewValuesRow = Record<string, string | number | boolean | null>;

type DataOverviewValues = {
  page: number;
  per_page: number;
  total_rows: number;
  total_pages: number;
  data: DataOverViewValuesRow[];
};

const dataOverviewSearchSchema = z.object({
  page: z.number().default(1),
});

export const Route = createFileRoute("/data-overview/$datasetId")({
  validateSearch: (search) => dataOverviewSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ params, deps }) => {
    if (params.datasetId === undefined) throw notFound();

    const doesDataSetExists = await fetchWrapper(
      `dataset/check-if-dataset-exists/${params.datasetId}`,
    );

    if (!doesDataSetExists) {
      throw notFound();
    }

    const metadata = await fetchWrapper<DataOverviewMetadata>(
      `dataset/metadata/${params.datasetId}`,
    );

    const values = await fetchWrapper<DataOverviewValues>(
      `dataset/values/${params.datasetId}?page=${deps.page}`,
    );

    return { metadata, values };
  },
  notFoundComponent: EmptyDemo,
  component: DataOverview,
});
