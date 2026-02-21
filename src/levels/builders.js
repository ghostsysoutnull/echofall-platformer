const STORM_FOUNDRY_SEGMENT = [
  "................................................................................................",
  "................................................................................................",
  "..............Y.................................................................................",
  ".............BBB.........................CCC.........................BBB........................",
  "................................................................................................",
  "..........C...........BBB....o...................BBB....C.................BBB.............U.....",
  ".....................BBB......................BBB..................BBB..........................",
  "...................................V............................................................",
  "...................................W.......................E....................................",
  "..................o.....................LLLL....................o...............................",
  ".....S.....................BBB..................BBB..................BBB........................",
  "............................................................BBB......................G....F.....",
  "...........BBB..................BBB..................BBB..................BBB...................",
  "................................................................................................",
  "......................o......................LLLLLLLL.................o.........................",
  ".......................LLLLLLLLLLLLLLLL.........................................................",
  "................................................................................................",
  "###########..#######.....####....#####....######....####....#####....######....####....#########"
];

const SIMBREACH_BASE_ROW = ".".repeat(96);
const simBreachRow = (markers) => {
  let row = SIMBREACH_BASE_ROW;
  for (let i = 0; i < markers.length; i++) {
    row = setGridChar(row, markers[i][0], markers[i][1]);
  }
  return row;
};

const SIMBREACH_SEGMENT = [
  SIMBREACH_BASE_ROW,
  SIMBREACH_BASE_ROW,
  simBreachRow([[17, "V"], [39, "W"], [61, "Y"]]),
  simBreachRow([[12, "B"], [13, "B"], [14, "B"], [30, "B"], [31, "B"], [32, "B"], [48, "B"], [49, "B"], [50, "B"]]),
  SIMBREACH_BASE_ROW,
  simBreachRow([[8, "o"], [21, "O"], [36, "o"], [51, "U"], [67, "X"]]),
  simBreachRow([[18, "B"], [19, "B"], [20, "B"], [39, "B"], [40, "B"], [41, "B"], [60, "B"], [61, "B"], [62, "B"]]),
  simBreachRow([[35, "W"], [66, "V"]]),
  simBreachRow([[26, "E"], [53, "E"]]),
  simBreachRow([[18, "o"], [40, "o"], [63, "o"]]),
  simBreachRow([[5, "S"], [27, "B"], [28, "B"], [29, "B"], [48, "B"], [49, "B"], [50, "B"], [67, "B"], [68, "B"], [69, "B"]]),
  SIMBREACH_BASE_ROW,
  simBreachRow([[11, "B"], [12, "B"], [13, "B"], [32, "B"], [33, "B"], [34, "B"], [51, "B"], [52, "B"], [53, "B"], [72, "B"], [73, "B"], [74, "B"]]),
  simBreachRow([[1, "H"]]),
  simBreachRow([[22, "o"], [45, "O"], [68, "o"]]),
  SIMBREACH_BASE_ROW,
  SIMBREACH_BASE_ROW,
  "###########..#######.....####....#####....######....####....#####....######....####....#########"
];

function setGridChar(row, index, value) {
  if (index < 0 || index >= row.length) return row;
  return row.slice(0, index) + value + row.slice(index + 1);
}

function buildStormFoundry6xGrid() {
  const rows = STORM_FOUNDRY_SEGMENT.map(row => row.repeat(6));
  const out = rows.map(row => row.replace(/S/g, ".").replace(/F/g, "."));

  const segmentWidth = STORM_FOUNDRY_SEGMENT[0].length;
  const linkChars = ["a", "b", "c", "d", "e", "f"];

  const placeSegmentMarkers = (segment, markers) => {
    const offset = segment * segmentWidth;
    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      out[m.y] = setGridChar(out[m.y], offset + m.x, m.ch);
    }
  };

  for (let segment = 0; segment < 6; segment++) {
    const linkCh = linkChars[segment] || "f";
    const markers = [{ x: 14, y: 1, ch: linkCh }];

    if (segment === 0) {
      markers.push(
        { x: 20, y: 4, ch: "A" },
        { x: 22, y: 4, ch: "=" },
        { x: 23, y: 4, ch: "=" },
        { x: 24, y: 4, ch: "=" },
        { x: 80, y: 4, ch: "A" },
        { x: 82, y: 4, ch: "=" },
        { x: 83, y: 4, ch: "=" },
        { x: 84, y: 4, ch: "=" },
        { x: 36, y: 7, ch: "J" },
        { x: 56, y: 7, ch: "J" }
      );
    } else if (segment === 1) {
      markers.push(
        { x: 24, y: 2, ch: "~" },
        { x: 22, y: 4, ch: "A" },
        { x: 24, y: 4, ch: "=" },
        { x: 25, y: 4, ch: "=" },
        { x: 26, y: 4, ch: "=" },
        { x: 76, y: 4, ch: "A" },
        { x: 78, y: 4, ch: "=" },
        { x: 79, y: 4, ch: "=" },
        { x: 80, y: 4, ch: "=" },
        { x: 34, y: 7, ch: "J" },
        { x: 58, y: 7, ch: "J" },
        { x: 82, y: 7, ch: "J" }
      );
    } else if (segment === 2) {
      markers.push(
        { x: 20, y: 2, ch: "~" },
        { x: 60, y: 10, ch: "K" },
        { x: 18, y: 4, ch: "A" },
        { x: 20, y: 4, ch: "=" },
        { x: 21, y: 4, ch: "=" },
        { x: 22, y: 4, ch: "=" },
        { x: 52, y: 4, ch: "A" },
        { x: 54, y: 4, ch: "=" },
        { x: 55, y: 4, ch: "=" },
        { x: 56, y: 4, ch: "=" },
        { x: 80, y: 4, ch: "A" },
        { x: 82, y: 4, ch: "=" },
        { x: 83, y: 4, ch: "=" },
        { x: 84, y: 4, ch: "=" },
        { x: 26, y: 7, ch: "J" },
        { x: 42, y: 7, ch: "J" },
        { x: 58, y: 7, ch: "J" }
      );
    } else if (segment === 3) {
      markers.push(
        { x: 18, y: 2, ch: "~" },
        { x: 72, y: 6, ch: "~" },
        { x: 58, y: 10, ch: "K" },
        { x: 30, y: 9, ch: "M" },
        { x: 16, y: 4, ch: "A" },
        { x: 18, y: 4, ch: "=" },
        { x: 19, y: 4, ch: "=" },
        { x: 20, y: 4, ch: "=" },
        { x: 50, y: 4, ch: "A" },
        { x: 52, y: 4, ch: "=" },
        { x: 53, y: 4, ch: "=" },
        { x: 54, y: 4, ch: "=" },
        { x: 78, y: 4, ch: "A" },
        { x: 80, y: 4, ch: "=" },
        { x: 81, y: 4, ch: "=" },
        { x: 82, y: 4, ch: "=" },
        { x: 22, y: 7, ch: "J" },
        { x: 38, y: 7, ch: "J" },
        { x: 54, y: 7, ch: "J" },
        { x: 84, y: 7, ch: "J" }
      );
    } else if (segment === 4) {
      markers.push(
        { x: 16, y: 2, ch: "~" },
        { x: 72, y: 2, ch: "~" },
        { x: 62, y: 10, ch: "K" },
        { x: 44, y: 9, ch: "M" },
        { x: 14, y: 4, ch: "A" },
        { x: 16, y: 4, ch: "=" },
        { x: 17, y: 4, ch: "=" },
        { x: 18, y: 4, ch: "=" },
        { x: 46, y: 4, ch: "A" },
        { x: 48, y: 4, ch: "=" },
        { x: 49, y: 4, ch: "=" },
        { x: 50, y: 4, ch: "=" },
        { x: 76, y: 4, ch: "A" },
        { x: 78, y: 4, ch: "=" },
        { x: 79, y: 4, ch: "=" },
        { x: 80, y: 4, ch: "=" },
        { x: 86, y: 4, ch: "A" },
        { x: 88, y: 4, ch: "=" },
        { x: 89, y: 4, ch: "=" },
        { x: 90, y: 4, ch: "=" },
        { x: 20, y: 7, ch: "J" },
        { x: 34, y: 7, ch: "J" },
        { x: 50, y: 7, ch: "J" },
        { x: 84, y: 7, ch: "J" }
      );
    } else {
      markers.push(
        { x: 12, y: 2, ch: "~" },
        { x: 68, y: 2, ch: "~" },
        { x: 40, y: 10, ch: "K" },
        { x: 70, y: 9, ch: "M" },
        { x: 12, y: 4, ch: "A" },
        { x: 14, y: 4, ch: "=" },
        { x: 15, y: 4, ch: "=" },
        { x: 16, y: 4, ch: "=" },
        { x: 44, y: 4, ch: "A" },
        { x: 46, y: 4, ch: "=" },
        { x: 47, y: 4, ch: "=" },
        { x: 48, y: 4, ch: "=" },
        { x: 74, y: 4, ch: "A" },
        { x: 76, y: 4, ch: "=" },
        { x: 77, y: 4, ch: "=" },
        { x: 78, y: 4, ch: "=" },
        { x: 84, y: 4, ch: "A" },
        { x: 86, y: 4, ch: "=" },
        { x: 87, y: 4, ch: "=" },
        { x: 88, y: 4, ch: "=" },
        { x: 18, y: 7, ch: "J" },
        { x: 32, y: 7, ch: "J" },
        { x: 48, y: 7, ch: "J" },
        { x: 74, y: 7, ch: "J" },
        { x: 88, y: 7, ch: "J" }
      );
    }

    placeSegmentMarkers(segment, markers);
  }

  out[10] = setGridChar(out[10], 5, "S");
  out[11] = setGridChar(out[11], out[11].length - 6, "F");
  return out;
}

function buildSimulationBreach4xGrid() {
  const rows = SIMBREACH_SEGMENT.map(row => row.repeat(4));
  const out = rows.map(row => row.replace(/S/g, ".").replace(/F/g, ".").replace(/H/g, "."));
  const segmentWidth = SIMBREACH_SEGMENT[0].length;

  const place = (segment, markers) => {
    const offset = segment * segmentWidth;
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      out[marker.y] = setGridChar(out[marker.y], offset + marker.x, marker.ch);
    }
  };

  place(0, [
    { x: 26, y: 5, ch: "U" },
    { x: 60, y: 7, ch: "V" },
    { x: 34, y: 8, ch: "E" }
  ]);

  place(1, [
    { x: 18, y: 5, ch: "O" },
    { x: 41, y: 5, ch: "O" },
    { x: 64, y: 5, ch: "U" },
    { x: 74, y: 5, ch: "O" },
    { x: 33, y: 8, ch: "E" },
    { x: 44, y: 8, ch: "E" },
    { x: 60, y: 8, ch: "E" },
    { x: 74, y: 11, ch: "P" }
  ]);

  place(2, [
    { x: 20, y: 2, ch: "V" },
    { x: 46, y: 5, ch: "O" },
    { x: 70, y: 8, ch: "E" },
    { x: 24, y: 11, ch: "P" },
    { x: 34, y: 12, ch: "X" }
  ]);

  place(3, [
    { x: 22, y: 5, ch: "T" },
    { x: 80, y: 8, ch: "E" },
    { x: 48, y: 11, ch: "D" },
    { x: 76, y: 14, ch: "O" }
  ]);

  out[10] = setGridChar(out[10], 6, "S");
  out[13] = setGridChar(out[13], 2, "H");
  out[13] = setGridChar(out[13], out[13].length - 10, "F");
  return out;
}

export { setGridChar, buildStormFoundry6xGrid, buildSimulationBreach4xGrid };
