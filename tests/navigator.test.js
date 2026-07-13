const { findShortestPath } = require('../routes/navigator');

describe('findShortestPath', () => {
  const testMap = {
    nodes: ["A", "B", "C", "D"],
    edges: [
      { from: "A", to: "B", distance: 10 },
      { from: "B", to: "C", distance: 5 },
      { from: "A", to: "D", distance: 3 },
      { from: "D", to: "C", distance: 4 },
    ],
  };

  test('finds a direct path when one exists', () => {
    const path = findShortestPath(testMap, "A", "B");
    expect(path).toEqual(["A", "B"]);
  });

  test('finds the shortest path through multiple nodes', () => {
    const path = findShortestPath(testMap, "A", "C");
    expect(path).toEqual(["A", "D", "C"]);
  });

  test('returns null when no path exists', () => {
    const disconnectedMap = {
      nodes: ["X", "Y"],
      edges: [],
    };
    const path = findShortestPath(disconnectedMap, "X", "Y");
    expect(path).toBeNull();
  });

  test('returns single-node path when start equals end', () => {
    const path = findShortestPath(testMap, "A", "A");
    expect(path).toEqual(["A"]);
  });
});