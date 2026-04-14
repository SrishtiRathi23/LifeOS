import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api/v1",
  withCredentials: true
});

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Something went wrong. Please try again.";
  }

  return "Something went wrong. Please try again.";
}
