import { CONNECTION_ERROR_BODY, CONNECTION_ERROR_TITLE } from "../constants/app";

const STATUS_MESSAGES = {
  400: "The request could not be completed. Please check your details and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "The requested information could not be found.",
  409: "This action conflicts with existing information.",
  422: "Some information is invalid. Please review and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again.",
};

const NETWORK_MESSAGE = `${CONNECTION_ERROR_TITLE}\n\n${CONNECTION_ERROR_BODY}`;
const TIMEOUT_MESSAGE =
  "The request timed out.\n\nPlease check your internet connection and try again.";

function isSafeServerMessage(message) {
  if (typeof message !== "string") {
    return false;
  }

  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 180 || trimmed.includes("\n")) {
    return false;
  }

  return !/at\s+\S+\s+\(|node_modules|stack trace|mongodb(\+srv)?:\/\/|password|secret|jwt/i.test(
    trimmed
  );
}

export function toApiError(error) {
  if (error?.isApiError) {
    return error;
  }

  const status = error?.response?.status ?? null;
  const serverMessage = error?.response?.data?.message;
  const isTimeout = error?.code === "ECONNABORTED";
  const isNetworkError = !error?.response || isTimeout;

  let message = "Something went wrong. Please try again.";

  if (isTimeout) {
    message = TIMEOUT_MESSAGE;
  } else if (isNetworkError) {
    message = NETWORK_MESSAGE;
  } else if (isSafeServerMessage(serverMessage)) {
    message = serverMessage.trim();
  } else if (STATUS_MESSAGES[status]) {
    message = STATUS_MESSAGES[status];
  }

  return {
    isApiError: true,
    isNetworkError,
    status,
    message,
  };
}
