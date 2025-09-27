// Placeholder for errors
export class AppError extends Error {
  constructor(public error: any) {
    super(error.message);
    this.name = error.name;
  }
}