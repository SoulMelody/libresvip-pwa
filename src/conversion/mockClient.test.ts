import { describe, expect, it } from "vitest";

import { MockConversionClient } from "./mockClient";

describe("MockConversionClient", () => {
  it("emits running and completed events and returns browser download data", async () => {
    const client = new MockConversionClient();
    const events: string[] = [];

    await client.init();
    const result = await client.convert(
      {
        mode: "direct",
        inputFormat: "ust",
        outputFormat: "svip",
        inputOptions: {},
        outputOptions: {},
        middlewareOptions: {},
        tasks: [
          {
            id: "task-1",
            name: "demo.ust",
            inputFormat: "ust",
            file: new File(["demo"], "demo.ust"),
          },
        ],
      },
      (event) => events.push(event.type),
    );

    expect(events).toEqual(["task-started", "task-warning", "task-completed"]);
    expect(result.outputs[0]).toMatchObject({
      taskId: "task-1",
      fileName: "demo.svip",
      mime: "application/octet-stream",
    });
    expect(await new Blob([result.outputs[0].data]).text()).toContain("mock conversion");
  });
});
