import { vi } from "vitest";

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();

  class MockWebGLRenderer {
    info = {
      memory: { geometries: 0, textures: 0 },
      render: { frame: 0, calls: 0, triangles: 0, points: 0, lines: 0 },
    };

    setSize = vi.fn();
    setClearColor = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});
