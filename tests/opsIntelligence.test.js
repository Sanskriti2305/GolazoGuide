const { applyEvent } = require('../routes/opsIntelligence');

describe('applyEvent', () => {
  const baseZones = [
    { id: "A", name: "Section A", noise: 40, crowd: 30 },
    { id: "B", name: "Section B", noise: 85, crowd: 90 },
  ];

  test('goal increases both noise and crowd', () => {
    const result = applyEvent(baseZones, "goal");
    expect(result[0].noise).toBe(80); // 40 + 40
    expect(result[0].crowd).toBe(50); // 30 + 20
  });

  test('red_card increases only noise', () => {
    const result = applyEvent(baseZones, "red_card");
    expect(result[0].noise).toBe(65); // 40 + 25
    expect(result[0].crowd).toBe(30); // unchanged
  });

  test('halftime increases only crowd', () => {
    const result = applyEvent(baseZones, "halftime");
    expect(result[0].crowd).toBe(80); // 30 + 50
    expect(result[0].noise).toBe(40); // unchanged
  });

  test('values are capped at 100', () => {
    const result = applyEvent(baseZones, "goal");
    expect(result[1].noise).toBe(100); // 85 + 40 = 125, capped
    expect(result[1].crowd).toBe(100); // 90 + 20 = 110, capped
  });

  test('unrecognized event returns zones unchanged', () => {
    const result = applyEvent(baseZones, "unknown_event");
    expect(result).toEqual(baseZones);
  });
});