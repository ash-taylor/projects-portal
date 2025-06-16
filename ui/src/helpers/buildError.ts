export const buildError = (error: unknown) =>
  new Error((error as { response: { data: { message: string } } }).response?.data.message || 'Something went wrong...');
