import { Card, CardContent, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          {icon}
          <Stack>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5">{value}</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
