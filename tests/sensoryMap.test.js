const { classifyIntensity } = require('../routes/sensoryMap');

describe('classifyIntensity', () => {
  test('classifies low noise and crowd as calm', () => {
    const zone = { name: "Section A", noise: 20, crowd: 15 };
    const result = classifyIntensity(zone);
    expect(result.intensity).toBe('calm');
  });

  test('classifies mid-range values as moderate', () => {
    const zone = { name: "Section B", noise: 50, crowd: 50 };
    const result = classifyIntensity(zone);
    expect(result.intensity).toBe('moderate');
  });

  test('classifies high noise and crowd as overwhelming', () => {
    const zone = { name: "Section C", noise: 90, crowd: 85 };
    const result = classifyIntensity(zone);
    expect(result.intensity).toBe('overwhelming');
  });

  test('preserves original zone fields alongside intensity', () => {
    const zone = { name: "Section D", noise: 30, crowd: 30 };
    const result = classifyIntensity(zone);
    expect(result.name).toBe('Section D');
    expect(result.noise).toBe(30);
    expect(result.crowd).toBe(30);
  });

  test('boundary case: exactly 70 average is not overwhelming', () => {
    const zone = { name: "Edge Case", noise: 70, crowd: 70 };
    const result = classifyIntensity(zone);
    expect(result.intensity).toBe('moderate');
  });
});