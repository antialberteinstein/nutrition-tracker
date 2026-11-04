import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { MarginRow, NotebookPage } from "@/components/notebook";

describe("NotebookPage / MarginRow", () => {
  it("renders content without a mark by default", async () => {
    await render(
      <NotebookPage>
        <MarginRow>
          <Text>Đạm</Text>
        </MarginRow>
      </NotebookPage>,
    );
    expect(screen.getByText("Đạm")).toBeTruthy();
    expect(screen.queryByTestId("margin-mark-alert")).toBeNull();
  });

  it("puts the alert mark in the margin with a spoken label", async () => {
    await render(
      <MarginRow mark="alert" markLabel="Vượt ngưỡng">
        <Text>Natri</Text>
      </MarginRow>,
    );
    expect(screen.getByTestId("margin-mark-alert")).toBeTruthy();
    expect(screen.getByLabelText("Vượt ngưỡng")).toBeTruthy();
  });
});
