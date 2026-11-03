import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { ScreenPlaceholder } from "@/components/screen-placeholder";

describe("ScreenPlaceholder", () => {
  it("renders the Vietnamese title as a header with the given testID", async () => {
    // @testing-library/react-native v14: render is async.
    await render(<ScreenPlaceholder title="Hôm nay" testID="screen-today" />);

    expect(screen.getByTestId("screen-today")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Hôm nay" })).toBeTruthy();
  });
});
