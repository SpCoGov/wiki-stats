import { Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MediaWikiClientError } from "../api/errors";

export function ErrorState({ error }: { error: unknown }) {
  const { t } = useTranslation();

  let message = t("errors.generic");
  if (error instanceof MediaWikiClientError) {
    if (error.isPrivateLogError) {
      message = t("errors.privateLog");
    } else if (error.code === "network") {
      message = t("errors.network");
    } else if (error.code === "timeout") {
      message = t("errors.timeout");
    } else {
      message = error.message || message;
    }
  }

  return <Alert severity="error">{message}</Alert>;
}
