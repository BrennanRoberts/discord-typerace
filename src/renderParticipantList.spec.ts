import renderParticipantList from "./renderParticipantList";

describe("renderParticipantList", function () {
  test("empty", () => {
    expect(renderParticipantList([], {})).toEqual("");
  });

  test("single entry, incomplete", () => {
    expect(renderParticipantList([{ id: 1, username: "asdf" }], {})).toEqual(
      "🏎  asdf"
    );
  });

  test("single entry, complete", () => {
    expect(
      renderParticipantList([{ id: 1, username: "asdf" }], { 1: 1000 })
    ).toEqual("🏎  asdf ✅ (1)");
  });

  test("multiple entry, mixed bag", () => {
    expect(
      renderParticipantList(
        [
          { id: 1, username: "asdf" },
          { id: 2, username: "fdsa" },
        ],
        { 1: 1000 }
      )
    ).toEqual("🏎  asdf ✅ (1)\n🏎  fdsa");
  });

  test("multiple entry, complete", () => {
    expect(
      renderParticipantList(
        [
          { id: 1, username: "asdf" },
          { id: 2, username: "fdsa" },
        ],
        { 1: 1000, 2: 1200 }
      )
    ).toEqual("🏎  asdf ✅ (1)\n🏎  fdsa ✅ (1.2)");
  });
});
