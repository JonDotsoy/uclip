import { buildArgs } from "./buildArgs.mjs"

describe('build args', () => {
  it('parse args', () => {
    const builder = buildArgs(['--ds', '--foo', 'bar', '--baz', 'qux', 'param1', '--', 'param2', '--fid', '123'], {
      singleFlags: ['ds', 'fid'],
    });

    console.log(builder);
  })
  it('parse args', () => {
    const builder = buildArgs(['--foo', 'bar', '--baz', 'qux', 'param1', 'param2', '--fid', '123'], {
      singleFlags: ['foo', 'baz'],
    });

    console.log(builder);
  })
})