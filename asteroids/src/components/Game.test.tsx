import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Game } from "./Game";

describe("Game", () => {
  it("renders canvas with correct dimensions", () => {
    const { container } = render(<Game width={800} height={600} />);
    const canvas = container.querySelector("canvas");

    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveStyle({
      width: "800px",
      height: "600px",
    });
  });
});
