import { messageForCode } from '../messageForCode';
import { ErrorCode, AsynchronousCode, SynchronousCode } from '../types';

describe('messageForCode', () => {
  it('works', () => {
    expect(messageForCode(ErrorCode.ConnectionRejected)).toMatchInlineSnapshot(`
      "120 connection rejected
      "
    `);

    expect(
      messageForCode(AsynchronousCode.ConnectionInfo, {
        param1: 'wow',
        param2: 'ok',
      })
    ).toMatchInlineSnapshot(`
      "500 connection info:
      param1: wow
      param2: ok

      "
    `);

    expect(messageForCode(SynchronousCode.OK, 'okie dokie')).toMatchInlineSnapshot(`
      "200 okie dokie
      "
    `);
  });

  it('filters out null and undefined values', () => {
    expect(messageForCode(SynchronousCode.OK, { param1: null, param2: undefined } as any))
      .toMatchInlineSnapshot(`
      "200 ok
      "
    `);
  });

  it('stringifies primitives', () => {
    expect(messageForCode(SynchronousCode.OK, { param1: 1234, param2: true, param3: false }))
      .toMatchInlineSnapshot(`
      "200 ok:
      param1: 1234
      param2: true
      param3: false

      "
    `);
  });

  it('throws an error if a non-primitive param type is encountered', () => {
    expect(() =>
      messageForCode(SynchronousCode.OK, { param1: { hmmm: true } as any })
    ).toThrowErrorMatchingInlineSnapshot(`"Unhandled value type for key \`param1\`: \`object\`"`);
  });
});
