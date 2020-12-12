let width, height;
if (window.innerWidth < 1000) {
  width = window.innerWidth * 0.5;
} else {
  width = window.innerWidth * 0.3;
}
if (window.innerHeight > 1000) {
  height = window.innerHeight * 0.2;
} else {
  height = window.innerHeight * 0.3;
}

let margin = { top: 20, bottom: 50, left: 120, right: 70 };

let state = {
  data: [],
  salary: null,
  prices: [],
  selectedprices: [],
  zip: null,
  legCode: [],
  color: () => {},
};

d3.csv(
  "https://raw.githubusercontent.com/jramadani/housing-data/master/data/finaldataset.csv",
  (d) => ({
    county: d.countyName,
    priceIndex: +d.priceIndex,
    zip: d.regionName,
    stateName: d.stateName,
    year: +d.year,
  })
).then((data) => {
  state.data = data;
  console.log("state: ", state);
  init();
});

function init() {
  state.selectedprices = state.data.filter(
    (d) => d.year == 2009 && d.priceIndex != 0
  );
  console.log(state.selectedprices);

  let switcher = d3.select("#customSwitch1").on("change", (e) => {
    if (d3.select("#customSwitch1").property("checked") == true) {
      state.selectedprices = [];
      state.selectedprices = state.data.filter((d) => d.year == 2019);
      draw();
    } else {
      state.selectedprices = [];
      state.selectedprices = state.data.filter((d) => d.year == 2009);
      draw();
    }
  });

  // form building
  // remember to sanitize the input when you get the rest of this working

  const click = d3.select("#salgo").on("click", function (e) {
    state.salary = document.getElementById("salary").value;
    draw();
  });

  const enter = d3.select("#salary").on("keydown", function (e) {
    if (e.code == "Enter") {
      state.salary = document.getElementById("salary").value;
      console.log(state.selectedprices);
      draw();
    }
  });

  // MAPBOX MAP

  mapboxgl.accessToken =
    "pk.eyJ1IjoianJhbWFkYW5pIiwiYSI6ImNrOW9xbWtmMzAxczYzZnA4bGlib2s3ZGgifQ.ZNLlxgGb_C51ZEzEGoPfbg";
  this.zipmap = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/jramadani/ckhnvjll016r319qnci9rb9z5", // stylesheet location
    center: [-90, 40], // starting position [lng, lat]
    zoom: 4, // starting zoom
  });

  this.zipmap.on("load", function () {
    zipmap.addSource("zip-code-tabulation-area-1dfnll", {
      type: "vector",
      url: "mapbox://jramadani.aczl2uyl",
    });
    zipmap.addLayer({
      id: "zips",
      type: "fill",
      source: "zip-code-tabulation-area-1dfnll",
      "source-layer": "zip-code-tabulation-area-1dfnll",
      paint: {
        "fill-outline-color": "rgba(0,0,0,0.1)",
        "fill-color": "rgba(0,0,0,0.1)",
      },
    });
    mapColor();
  });

  this.zipmap.on("click", "zips", (e) => {
    zipmap.getCanvas().style.cursor = "pointer";
    const feature = e.features[0];
    state.zip = feature.properties.ZCTA5CE10;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(
        `<a style="padding-top:10px;" href="https://www.zillow.com/homes/${feature.properties.ZCTA5CE10}_rb/" target="_blank">${feature.properties.ZCTA5CE10}</a>`
      )
      .addTo(zipmap);
    summary();
  });

  //end mapbox core construction
}

function draw() {
  //RESETS -- WHEN USER INTERACTS W/O REFRESHING, THESE CLEAR EXISTING DECLARATIONS
  state.prices = [];

  d3.select(".legend svg").remove();

  if (zipmap.getLayer("selected-prices")) {
    zipmap.removeLayer("selected-prices");
  }

  state.prices = state.data.filter((d) => d.priceIndex != 0);

  // REMEMBER TO FILTER FOR THE YEAR BEFORE ATTACHING THE FILTER TO THE MAP.

  if (d3.select("#customSwitch1").property("checked") == true) {
    console.log("checked!");
    state.selectedprices = state.prices.filter((d) => d.year == 2019);
  } else {
    console.log("unchecked!");
    state.selectedprices = state.prices.filter((d) => d.year == 2009);
  }

  state.prices = [];

  state.selectedprices.forEach((d) => {
    let p = d.priceIndex * 0.2;
    let yp = (d.priceIndex - p) / 30;
    let fym = yp + p;
    if (state.salary * 0.3 - fym > 0) {
      return state.prices.push(d);
    }
  });

  state.selectedprices = state.prices;

  state.prices = [];

  // STATE CHECK-IN
  console.log("updated state", state);

  if (state.salary == null) {
    if (d3.select("#customSwitch1").property("checked") == true) {
      console.log("checked!");
      state.selectedprices = state.data.filter(
        (d) => d.year == 2019 && d.priceIndex != 0
      );
    } else {
      console.log("unchecked!");
      state.selectedprices = state.data.filter(
        (d) => d.year == 2009 && d.priceIndex != 0
      );
    }
  }

  mapColor();
  state.selectedprices = [];
}

function mapColor() {
  if (zipmap.getLayer("selected-prices")) {
    zipmap.removeLayer("selected-prices");
  }
  console.log(state.selectedprices);
  // COLOR BASE

  if (state.salary == null) {
    state.color = d3
      .scaleSequential()
      .domain([d3.min(state.selectedprices, (d) => d.priceIndex), 750000])
      .range(["#6ea5c6", "#494197"]);
  } else {
    state.color = d3
      .scaleSequential()
      .domain(d3.extent(state.selectedprices, (d) => d.priceIndex))
      .range(["#6ea5c6", "#494197"]);
  }

  // CONSTRUCTING THE ZIPS/COLOR ARRAY FOR COLORING THE MAP

  let emptyArray = [];

  const intersperse = state.selectedprices.reduce((acc, property) => {
    const zipCode = `${property.zip}`;
    acc[zipCode] = state.color(property.priceIndex);
    return acc;
  }, {});
  const ia = Object.entries(intersperse);
  const step = ia.map((d) => [d[0], d[1]]);
  let flattening = step.flat();
  flattening.unshift("match", ["get", "ZCTA5CE10"]);
  flattening.push("rgba(0,0,0,0)");

  flattening.forEach((d) => {
    if (d == "rgb(0, 0, 0)") {
      emptyArray.push("rgb(50, 7, 118)");
    } else {
      emptyArray.push(d);
    }
  });
  console.log(emptyArray);

  //  MAP -- REDRAWN WITH COLOR LAYERS

  zipmap.addLayer({
    id: "selected-prices",
    source: "zip-code-tabulation-area-1dfnll",
    "source-layer": "zip-code-tabulation-area-1dfnll",
    type: "fill",
    paint: {
      "fill-color": emptyArray,
      "fill-opacity": 0.7,
    },
  });

  if (state.salary == null) {
    state.legCode = [
      d3.min(state.selectedprices, (d) => Math.floor(d.priceIndex)),
      750000,
    ];
  } else {
    state.legCode = d3
      .extent(state.selectedprices, (d) => d.priceIndex)
      .map((d) => Math.floor(d));
  }

  // legend construction -- base from Mike Bostock on Observable
  {
    function legendConstruction(color, n = 256) {
      const canv = document.createElement("canvas");
      canv.width = n;
      canv.height = 1;
      const canvas = canv.getContext("2d");
      for (let i = 0; i < n; ++i) {
        canvas.fillStyle = color(i / (n - 1));
        canvas.fillRect(i, 0, 1, 1);
      }
      return canv;
    }

    let legendColor,
      title,
      tickSize = 6,
      width = 320,
      height = 50 + tickSize,
      marginTop = 18,
      marginRight = 0,
      marginBottom = 16 + tickSize,
      marginLeft = 0,
      ticks = width / 64,
      tickFormat,
      tickValues;

    legendColor = d3.scaleSequential(state.legCode, ["#6ea5c6", "#494197"]);

    title = "Zip Code Single-Family House Price Index (USD)";

    const legendSvg = d3
      .selectAll(".legend")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("overflow", "visible")
      .style("display", "block");

    let tickAdjust = (g) =>
      g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;

    x = Object.assign(
      legendColor
        .copy()
        .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
      {
        range() {
          return [marginLeft, width - marginRight];
        },
      }
    );

    legendSvg
      .append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr(
        "xlink:href",
        legendConstruction(legendColor.interpolator()).toDataURL()
      );

    legendSvg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
          .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
          .tickSize(tickSize)
          .tickValues(tickValues)
      )
      .call(tickAdjust)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", marginLeft)
          .attr("y", marginTop + marginBottom - height - 6)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(title)
      );
  }

  // STATE CHECK-IN
  console.log("updated state", state);
}

function summary() {
  d3.selectAll(".lines").remove();
  //LINE CHART AND SUMMARY

  let filtered = state.data.filter((d) => d.zip == state.zip);
  filtered = filtered.filter((d) => d.year !== 2020);
  let national = state.data.filter((d) => d.year !== 2020 && d.priceIndex != 0);

  const average = (arr) => arr.reduce((a, b) => a + b) / arr.length;

  const formatMoney = (num) => d3.format("($,.2f")(num);

  const summstats = d3.select("#stats");

  const baseData = state.data.filter(
    (d) => d.year != 2020 && d.priceIndex != 0
  );
  const stateAverage = formatMoney(
    average(
      baseData
        .filter(
          (d) => d.stateName == filtered.find((d) => d.stateName).stateName
        )
        .map((d) => d.priceIndex)
    )
  );
  const nationalAvg = formatMoney(average(baseData.map((d) => d.priceIndex)));

  // LINE CHART GETS DRAWN ON CLICK OF THE MAP

  const x = d3
    .scaleLinear()
    .domain(d3.extent(filtered, (d) => d.year))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(filtered, (d) => d.priceIndex))
    .range([height - margin.bottom, margin.top]);

  let svg = d3
    .select("#linechart")
    .append("svg")
    .attr("class", "lines")
    .attr("width", width)
    .attr("height", height);

  const xAxis = d3.axisBottom(x).tickFormat((d) => d3.format("")(d));
  const yAxis = d3.axisLeft(y).tickFormat(formatMoney);

  svg
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "start")
    .attr("dx", "-3em")
    .attr("dy", ".5em")
    .attr("transform", "rotate(-55)")
    .append("text")
    .attr("class", "axis-label")
    .attr("x", "50%")
    .attr("dy", "3em")
    .attr("fill", "black")
    .text("Year");

  svg
    .append("g")
    .attr("class", "axis y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("y", "50%")
    .attr("dx", "-8em")
    .attr("writing-mode", "vertical-rl")
    .attr("fill", "black")
    .text("Price Index");

  const line = d3
    .line()
    .defined((d) => !isNaN(d.priceIndex))
    .x((d) => x(d.year))
    .y((d) => y(d.priceIndex));

  filtered = filtered.filter((d) => d.priceIndex !== 0);

  // const tlContainer = svg
  //   .append("path")
  //   .datum(national)
  //   .attr("fill", "none")
  //   .attr("stroke", "#a6a6a6")
  //   .attr("stroke-width", 1.5)
  //   .attr("stroke-linejoin", "round")
  //   .attr("stroke-linecap", "round")
  //   .attr("d", line)
  //   .attr("background-color", "#f5f4f4");

  const lcContainer = svg
    .append("path")
    .datum(filtered)
    .attr("fill", "none")
    .attr("stroke", "#494197")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line)
    .attr("background-color", "#f5f4f4");

  const pathLength = lcContainer.node().getTotalLength();

  lcContainer
    .attr("stroke-dasharray", pathLength + " " + pathLength)
    .attr("stroke-dashoffset", pathLength)
    .transition()
    .duration(2500)
    .attr("stroke-dashoffset", 0)
    .ease();

  summstats
    .selectAll(".stats")
    .data([filtered])
    .join("div", (d) => {
      if (state.zip) {
        summstats.html(`
       <span style="font-size:1.15em"><u><b>Summary for <span style="color:#6ea5c6">${
         filtered.map((d) => d.zip)[0]
       }</span></b></u></span><br>
            <span><b>Average Price Index:</b> ${formatMoney(
              average(filtered.map((d) => d.priceIndex))
            )}</span><br>
            <span><b>10-Year Low:</b> ${formatMoney(
              d3.min(filtered.map((d) => d.priceIndex))
            )}</span><br>
            <span><b>10-Year High:</b> ${formatMoney(
              d3.max(filtered.map((d) => d.priceIndex))
            )}</span><br>
            <span><b>State:</b> ${
              filtered.map((d) => d.stateName)[0]
            }</span><br>
            <span><b>County:</b> ${filtered.map((d) => d.county)[0]}</span><br>
            <span><b>State Average:</b> ${stateAverage}</span> <br>
            <span><b>National Average:</b> ${nationalAvg}</span>  
       `);
      }
    });
}
