import util from 'util';

export class FormattedError extends Error {
  constructor(template: string, ...args: any[]) {
    super(util.format(template, ...args));
    this.template = template;
    this.args = args;
  }

  public template: string;
  public args: any[];
}

export function invariant(condition: any, message: string, ...args: any[]): asserts condition {
  if (!condition) {
    throw new FormattedError(message, ...args);
  }
}
