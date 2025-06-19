/**
 *
 * Helper function to parse standard Error or AxiosError objects into a consistent format.
 *
 * @param error any thrown error object
 * @returns an error containing a message string
 */
export const buildError = (error: unknown) =>
  new Error(
    (error as { response: { data: { message: string } } }).response?.data.message[0][0].toUpperCase() +
      (error as { response: { data: { message: string } } }).response?.data.message[0].slice(1) ||
      (error as Error).message[0].toUpperCase() + (error as Error).message.slice(1) ||
      'Something went wrong...',
  );
