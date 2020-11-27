let width = window.innerWidth * 0.3;
let height = window.innerHeight * 0.3;
let margin = { top: 20, bottom: 50, left: 120, right: 70 };

let state = {
  data: [],
  salary: null,
  prices: [],
  zip: null,
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
  // form building
  // remember to sanitize the input when you get the rest of this working

  const enter = d3.select("#salgo").on("click", function () {
    state.salary = document.getElementById("salary").value;
    draw();
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

    zipmap.addLayer({
      id: "zips-highlighted",
      type: "fill",
      source: "zip-code-tabulation-area-1dfnll",
      "source-layer": "zip-code-tabulation-area-1dfnll",
      paint: {
        "fill-outline-color": "#484896",
        "fill-color": "#6e599f",
        "fill-opacity": 0.75,
      },
      filter: ["in", "ZCTA5CE10", ""],
    }); // Place polygon under these labels, per MB documentation
  });

  this.zipmap.on("click", "zips", (e) => {
    console.log("Hello");
    console.log(e);
    zipmap.getCanvas().style.cursor = "pointer";
    const feature = e.features[0];
    state.zip = feature.properties.ZCTA5CE10;
  });
  //end mapbox
}

function draw() {
  console.log("updated state", state);
  state.data.forEach((d) => {
    let p = d.priceIndex * 0.2;
    let yp = (d.priceIndex - p) / 30;
    let fym = yp + p;
    if (state.salary * 0.3 - fym > 0) {
      return state.prices.push(d);
    }
  });
  console.log(state.prices);
  console.log(state.salary);
  // REMEMBER TO FILTER FOR THE YEAR BEFORE ATTACHING THE FILTER TO THE MAP.
  let prices09 = state.prices.filter((d) => d.year == 2009);
  let prices19 = state.prices.filter((d) => d.year == 2019);
  //note to self: the below DOES NOT RESET when you enter a new salary
  //clear the array when they re-enter a value.
  console.log(prices19);

  //SWITCH
  //attach the switch to values here

  // COLOR
  const color = d3
    .scaleSequential()
    .domain(d3.extent(prices19, (d) => d.priceIndex))
    .range(["#6ea5c6", "#494197"]);

  //  MAP -- REDRAWN WITH COLOR LAYERS

  this.zipmap.on("click", (d) => {
    console.log("Hello");
  });

  //should filter using the filtered array--only highlight areas that show up in the prices09 or prices19

  // zipmap.on("mouseleave", "zips-highlighted", function () {
  //   zipmap.getCanvas().style.cursor = "";
  //   popup.remove();
  //   map.setFilter("counties-highlighted", ["in", "ZCTA5CE10", ""]);
  //   overlay.style.display = "none";
  // });

  //current:

  // const ziplayer = this.zipmap.addLayer({
  //   id:'',
  //   source:'',
  //   'source-layer':'',
  //   paint:{

  //   }
  // })

  // ziplayer["paint"] = {
  //   "fill-color": { property: "ZCTA5CE10", stops: [[], []] },
  // };

  //LINE CHART STARTS HERE--CURRENTLY FUNCTIONAL!

  const filtered = state.data.filter((d) => d.zip == state.zip);
  console.log(filtered);

  function average(array) {
    return array.reduce((a, b) => a + b) / array.length;
  }

  const formatMoney = (num) => d3.format("($,.2f")(num);

  const summstats = d3.select("#stats");

  summstats
    .selectAll(".stats")
    .data([filtered])
    .join("div", (d) => {
      if (state.salary) {
        summstats.html(`
        <span><b>Summary for <span style="color:#6ea5c6">${
          filtered.map((d) => d.zip)[0]
        }</span></b></span><br>
             <span>Average Price Index: ${formatMoney(
               average(filtered.map((d) => d.priceIndex))
             )}</span><br>
             <span>10-Year Low: ${formatMoney(
               d3.min(filtered.map((d) => d.priceIndex))
             )}</span><br>
             <span>10-Year High: ${formatMoney(
               d3.max(filtered.map((d) => d.priceIndex))
             )}</span><br>
             <span>State: ${filtered.map((d) => d.stateName)[0]}</span><br>
             <span>County: ${filtered.map((d) => d.county)[0]}</span> 
        `);
      }
    });

  // LINE CHART CAN GO HERE--IT GETS DRAWN ON CLICK OF THE MAP.

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
    .attr("width", width)
    .attr("height", height);

  const xAxis = d3.axisBottom(x).tickFormat((d) => d3.format("")(d));
  const yAxis = d3.axisLeft(y).tickFormat(formatMoney);

  svg
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .append("text")
    .attr("transform", "rotate(-55)")
    .attr("class", "axis-label")
    .attr("x", "50%")
    .attr("dy", "3em")
    .text("Year");

  svg
    .append("g")
    .attr("class", "axis y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("y", "50%")
    .attr("dx", "-3em")
    .attr("writing-mode", "vertical-rl")
    .text("Price Index");

  const line = d3
    .line()
    .defined((d) => !isNaN(d.priceIndex))
    .x((d) => x(d.year))
    .y((d) => y(d.priceIndex));

  const lcContainer = svg
    .append("path")
    .datum(filtered)
    .attr("fill", "none")
    .attr("stroke", "#494197")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);
}