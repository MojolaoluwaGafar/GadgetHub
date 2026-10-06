// An expected failure raised by a service, such as a product that does not
// exist or one that has sold out. The error handler turns it into an HTTP
// response with this status; any other error is unexpected and becomes a 500.
// `field` names the form field the error is about, when there is one, so the
// client can show it next to that input.
export class ServiceError extends Error {
  constructor(public readonly status: number, message: string, public readonly field?: string) {
    super(message);
    this.name = "ServiceError";
  }
}

export const isServiceError = (error: unknown): error is ServiceError => error instanceof ServiceError;
