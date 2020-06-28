import { invariant } from './invariant';

export class Timecode {
  constructor(hh: number, mm: number, ss: number, ff: number) {
    const timecode = [hh, mm, ss, ff]
      .map((code) => {
        const codeInt = Math.floor(code);
        invariant(
          codeInt === code && code >= 0 && code <= 99,
          'Timecode params must be an integer between 0 and 99'
        );

        // turn the integer into a potentially zero-prefixed string
        return (codeInt + 100).toString().slice(-2);
      })
      .join(':');

    this.toString = () => timecode;
  }

  public toString: () => string;

  static toTimecode = (tcString: string): Timecode => {
    const bits = tcString.split(':');
    invariant(bits.length === 4, 'Expected 4 bits, received %o bits', bits.length);
    const bitsInt = bits.map((bit) => {
      const bitInt = parseInt(bit, 10);
      invariant(!isNaN(bitInt), 'bit `%s` is NaN', bit);
      return bitInt;
    });
    return new Timecode(bitsInt[0], bitsInt[1], bitsInt[2], bitsInt[3]);
  };
}
