import { vi } from "vitest";

vi.mock("three", () => ({
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  })),
  Scene: vi.fn(),
  OrthographicCamera: vi.fn().mockImplementation(() => ({
    position: { z: 0 },
  })),
}));
