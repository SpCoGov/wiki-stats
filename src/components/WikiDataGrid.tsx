import { DataGrid, type DataGridProps } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";

export function WikiDataGrid(props: DataGridProps) {
  const { t } = useTranslation();

  return (
    <DataGrid
      pageSizeOptions={[25, 50, 100, 250, 500]}
      localeText={{
        paginationRowsPerPage: t("dataGrid.rowsPerPage"),
        paginationDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
          t("dataGrid.displayedRows", {
            from,
            to,
            count: count === -1 ? t("dataGrid.moreThan", { to }) : count,
          }),
        noRowsLabel: t("common.empty"),
        footerRowSelected: (count) => t("dataGrid.rowsSelected", { count }),
      }}
      {...props}
    />
  );
}
