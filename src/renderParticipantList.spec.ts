import renderParticipantList from "./renderParticipantList";

describe("renderParticipantList", function () {
  describe("not complete", function () {
    test("empty", () => {
      expect(renderParticipantList([], {})).toEqual("");
    });

    test("single entry, incomplete", () => {
      expect(
        renderParticipantList([{ id: "1", renderName: "asdf" }], {})
      ).toEqual("🏎  asdf");
    });

    test("single entry, complete", () => {
      expect(
        renderParticipantList([{ id: "1", renderName: "asdf" }], { 1: 1000 })
      ).toEqual("🏁  asdf");
    });

    test("multiple entry, mixed bag", () => {
      expect(
        renderParticipantList(
          [
            { id: "1", renderName: "asdf" },
            { id: "2", renderName: "fdsa" },
          ],
          { 1: 1000 }
        )
      ).toEqual("🏁  asdf\n🏎  fdsa");
    });

    test("multiple entry, complete", () => {
      expect(
        renderParticipantList(
          [
            { id: "1", renderName: "asdf" },
            { id: "2", renderName: "fdsa" },
          ],
          { 1: 1000, 2: 1200 }
        )
      ).toEqual("🏁  asdf\n🏁  fdsa");
    });
  });
  describe("complete", function () {
    test("single entry, incomplete", () => {
      expect(
        renderParticipantList([{ id: "1", renderName: "asdf" }], {}, true)
      ).toEqual("❌  asdf");
    });

    test("mixed results", function () {
      expect(
        renderParticipantList(
          [
            { id: "no2", renderName: "no2" },
            { id: "no5", renderName: "no5" },
            { id: "no3", renderName: "no3" },
            { id: "no1", renderName: "no1" },
            { id: "no4", renderName: "no4" },
          ],
          {
            no2: 2000,
            no3: 3000,
            no1: 1000,
            no4: 4000,
          },
          true,
          "this string is considered 8 words long"
        )
      ).toEqual(
        "🥇  no1 - 1 seconds (480 WPM)\n" +
          "🥈  no2 - 2 seconds (240 WPM)\n" +
          "🥉  no3 - 3 seconds (160 WPM)\n" +
          "🏎  no4 - 4 seconds (120 WPM)\n" +
          "❌  no5"
      );
    });
  });
});
