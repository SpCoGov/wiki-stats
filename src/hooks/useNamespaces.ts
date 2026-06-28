import { useQuery } from "@tanstack/react-query";
import { fetchNamespaces } from "../api/siteinfo";
import { useSettings } from "../stores/settingsStore";

export function useNamespaces(enabled: boolean) {
  const { settings } = useSettings();

  return useQuery({
    queryKey: ["namespaces", settings.apiEndpoint],
    queryFn: ({ signal }) => fetchNamespaces(settings.apiEndpoint, signal),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
