export class MediaWikiClientError extends Error {
  code: string;
  isPrivateLogError: boolean;

  constructor(message: string, code = "unknown", isPrivateLogError = false) {
    super(message);
    this.name = "MediaWikiClientError";
    this.code = code;
    this.isPrivateLogError = isPrivateLogError;
  }
}

const privateLogErrorCodes = new Set([
  "permissiondenied",
  "readapidenied",
  "badaccess-groups",
  "nosuchaction",
  "nosuchlist",
  "missingtitle",
]);

export function isPrivateLogLikeError(code: string, message: string) {
  const text = `${code} ${message}`.toLowerCase();
  return (
    privateLogErrorCodes.has(code) ||
    text.includes("permission") ||
    text.includes("not allowed") ||
    text.includes("private") ||
    text.includes("hidden") ||
    text.includes("patrol") && text.includes("disabled")
  );
}
