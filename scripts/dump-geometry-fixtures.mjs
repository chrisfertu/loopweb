// Dump reference points from the web shape library for the iOS parity test.
import { createServer } from 'vite';
const server = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const shapes = await server.ssrLoadModule('/src/geometry/shapes.js');
const COUNT = 6000;
const KEYS = ['ringcore', 'circle', 'dial', 'lotus:2', 'lotus:6', 'lotus:8', 'lotus:16', 'mandala:2', 'mandala:6', 'mandala:10', 'mandala:16', 'phyllotaxis', 'vesica', 'plate', 'bell:8,2,0', 'wavering', 'point', 'brownian', 'dust'];
const STEP = 251; // sample every 251st point (coprime with everything in sight)
const lines = [];
lines.push('//');
lines.push('//  GeometryShapeFixtures.swift');
lines.push('//  OPUS LoopTests');
lines.push('//');
lines.push('//  Generated from the website\'s shape library (loopweb, src/geometry/shapes.js)');
lines.push('//  at 6000 points. Regenerate with scripts/dump-geometry-fixtures.mjs in loopweb.');
lines.push('//  Do not edit by hand.');
lines.push('//');
lines.push('');
lines.push('struct GeometryShapeFixture {');
lines.push('    let key: String');
lines.push('    let count: Int');
lines.push('    let body: Int');
lines.push('    let gain: Float');
lines.push('    /// [index, x, y, z, group, u]');
lines.push('    let samples: [[Float]]');
lines.push('}');
lines.push('');
lines.push('enum GeometryShapeFixtures {');
lines.push('    static let all: [GeometryShapeFixture] = [');
for (const key of KEYS) {
  const s = shapes.buildShape(key, COUNT);
  const samples = [];
  for (let i = 0; i < COUNT; i += STEP) {
    samples.push(`[${i}, ${s.pos[i*3].toPrecision(8)}, ${s.pos[i*3+1].toPrecision(8)}, ${s.pos[i*3+2].toPrecision(8)}, ${s.meta[i*2]}, ${s.meta[i*2+1].toPrecision(8)}]`);
  }
  lines.push(`        GeometryShapeFixture(key: "${key}", count: ${COUNT}, body: ${s.body}, gain: ${s.gain.toPrecision(8)}, samples: [`);
  lines.push('            ' + samples.join(',\n            ') + ',');
  lines.push('        ]),');
}
lines.push('    ]');
lines.push('');
const seeds = shapes.buildSeeds(COUNT);
const seedSamples = [];
for (let i = 0; i < COUNT; i += STEP * 4) seedSamples.push(`[${i}, ${seeds[i*4].toPrecision(8)}, ${seeds[i*4+1].toPrecision(8)}, ${seeds[i*4+2].toPrecision(8)}, ${seeds[i*4+3].toPrecision(8)}]`);
lines.push('    /// [index, index fraction, r1, r2, r3]');
lines.push('    static let seeds: [[Float]] = [');
lines.push('        ' + seedSamples.join(',\n        ') + ',');
lines.push('    ]');
lines.push('}');
process.stdout.write(lines.join('\n') + '\n');
await server.close();
