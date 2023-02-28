import { invalidArgumentError, unauthenticatedError } from './errors';

export function validateNullArguments(args: any[]) {
  if (args && args.length > 0) {
    for (let i = 0; i < args.length; i++) {
      if (args[i] == null) {
        throw invalidArgumentError();
      }
    }
  }
}

export function validateAuthAndInput(auth: any, args: any[]) {
  if (!auth) {
    throw unauthenticatedError();
  }
  validateNullArguments(args);
}
