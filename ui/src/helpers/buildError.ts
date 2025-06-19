/**
 *
 * Helper function to parse standard Error or AxiosError objects into a consistent format.
 *
 * @param error any thrown error object
 * @returns an error containing a message string
 */
export const buildError = (error: unknown) =>
  new Error(
    (error as { response: { data: { message: string } } }).response?.data.message ||
      (error as Error).message ||
      'Something went wrong...',
  );
