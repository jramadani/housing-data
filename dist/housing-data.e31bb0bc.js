// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"index.js":[function(require,module,exports) {
var width = window.innerWidth * 0.3;
var height = window.innerHeight * 0.3;
var margin = {
  top: 20,
  bottom: 50,
  left: 120,
  right: 70
};
var state = {
  data: [],
  salary: null,
  prices: [],
  selectedprices: [],
  zip: null
};
d3.csv("https://raw.githubusercontent.com/jramadani/housing-data/master/data/finaldataset.csv", function (d) {
  return {
    county: d.countyName,
    priceIndex: +d.priceIndex,
    zip: d.regionName,
    stateName: d.stateName,
    year: +d.year
  };
}).then(function (data) {
  state.data = data;
  console.log("state: ", state);
  init();
});

function init() {
  // form building
  // remember to sanitize the input when you get the rest of this working
  var enter = d3.select("#salgo").on("click", function () {
    state.salary = document.getElementById("salary").value;
    draw();
  }); // MAPBOX MAP

  mapboxgl.accessToken = "pk.eyJ1IjoianJhbWFkYW5pIiwiYSI6ImNrOW9xbWtmMzAxczYzZnA4bGlib2s3ZGgifQ.ZNLlxgGb_C51ZEzEGoPfbg";
  this.zipmap = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/jramadani/ckhnvjll016r319qnci9rb9z5",
    // stylesheet location
    center: [-90, 40],
    // starting position [lng, lat]
    zoom: 4 // starting zoom

  });
  this.zipmap.on("load", function () {
    zipmap.addSource("zip-code-tabulation-area-1dfnll", {
      type: "vector",
      url: "mapbox://jramadani.aczl2uyl"
    });
    zipmap.addLayer({
      id: "zips",
      type: "fill",
      source: "zip-code-tabulation-area-1dfnll",
      "source-layer": "zip-code-tabulation-area-1dfnll",
      paint: {
        "fill-outline-color": "rgba(0,0,0,0.1)",
        "fill-color": "rgba(0,0,0,0.1)"
      }
    });
    zipmap.addLayer({
      id: "zips-highlighted",
      type: "fill",
      source: "zip-code-tabulation-area-1dfnll",
      "source-layer": "zip-code-tabulation-area-1dfnll",
      paint: {
        "fill-outline-color": "#484896",
        "fill-color": "#6e599f",
        "fill-opacity": 0.75
      },
      filter: ["in", "ZCTA5CE10", ""]
    }); // Place polygon under these labels, per MB documentation
  });
  this.zipmap.on("click", "zips", function (e) {
    console.log("Hello");
    console.log(e);
    zipmap.getCanvas().style.cursor = "pointer";
    var feature = e.features[0];
    state.zip = feature.properties.ZCTA5CE10;
  }); //end mapbox
}

function draw() {
  //ARRAY RESET
  state.prices = [];
  d3.selectAll(".lines").remove();
  state.data.forEach(function (d) {
    var p = d.priceIndex * 0.2;
    var yp = (d.priceIndex - p) / 30;
    var fym = yp + p;

    if (state.salary * 0.3 - fym > 0) {
      return state.prices.push(d);
    }
  });
  console.log("prices: ", state.prices);
  console.log("salary: ", state.salary); // REMEMBER TO FILTER FOR THE YEAR BEFORE ATTACHING THE FILTER TO THE MAP.

  var prices09 = state.prices.filter(function (d) {
    return d.year == 2009;
  });
  var prices19 = state.prices.filter(function (d) {
    return d.year == 2019;
  }); //note to self: the below DOES NOT RESET when you enter a new salary
  //clear the array when they re-enter a value.

  console.log(prices19); //SWITCH
  //attach the switch to values here

  var switcher = d3.select("#customSwitch1").on("change", function (e) {
    if (d3.select("#customSwitch1").property("checked") == true) {
      console.log("I'm on!");
      state.selectedprices = prices19;
    } else {
      console.log("I'm off!");
      state.selectedprices = prices09;
    }
  }); // COLOR

  var color = d3.scaleSequential().domain(d3.extent(prices19, function (d) {
    return d.priceIndex;
  })).range(["#6ea5c6", "#494197"]);

  var colorblock = function colorblock() {
    // in short, i'm turning the returned filtered prices into bins
    // then applying color in the way that mapbox will accept it
    var buckets = function buckets() {
      return d3.bin();
    };

    var price = Array.from(new Set(state.selectedprices.map(function (d) {
      return d.priceIndex;
    })));
    var priceBuckets = buckets(price);
    var bucketing = priceBuckets.map(function (d) {
      return d[0];
    });
    var intersperse = bucketing.reduce(function (acc, property) {
      acc[property] = color(property);
      return acc;
    }, {});
    var ia = Object.entries(intersperse);
    var step = ia.map(function (d) {
      return [parseInt(d[0]), d[1]];
    });
    var flattening = step.flattening;
    return {
      flattening: flattening
    };
  }; // console.log("flattened array: ", colorblock)


  console.log("selected prices: ", state.selectedprices); //  MAP -- REDRAWN WITH COLOR LAYERS
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

  var filtered = state.data.filter(function (d) {
    return d.zip == state.zip;
  });
  console.log(filtered);

  var average = function average(arr) {
    return arr.reduce(function (a, b) {
      return a + b;
    }) / arr.length;
  };

  var formatMoney = function formatMoney(num) {
    return d3.format("($,.2f")(num);
  };

  var summstats = d3.select("#stats");
  summstats.selectAll(".stats").data([filtered]).join("div", function (d) {
    if (state.salary) {
      summstats.html("\n        <span><b>Summary for <span style=\"color:#6ea5c6\">".concat(filtered.map(function (d) {
        return d.zip;
      })[0], "</span></b></span><br>\n             <span>Average Price Index: ").concat(formatMoney(average(filtered.map(function (d) {
        return d.priceIndex;
      }))), "</span><br>\n             <span>10-Year Low: ").concat(formatMoney(d3.min(filtered.map(function (d) {
        return d.priceIndex;
      }))), "</span><br>\n             <span>10-Year High: ").concat(formatMoney(d3.max(filtered.map(function (d) {
        return d.priceIndex;
      }))), "</span><br>\n             <span>State: ").concat(filtered.map(function (d) {
        return d.stateName;
      })[0], "</span><br>\n             <span>County: ").concat(filtered.map(function (d) {
        return d.county;
      })[0], "</span> \n        "));
    }
  }); // LINE CHART CAN GO HERE--IT GETS DRAWN ON CLICK OF THE MAP.

  var x = d3.scaleLinear().domain(d3.extent(filtered, function (d) {
    return d.year;
  })).range([margin.left, width - margin.right]);
  var y = d3.scaleLinear().domain(d3.extent(filtered, function (d) {
    return d.priceIndex;
  })).range([height - margin.bottom, margin.top]);
  var svg = d3.select("#linechart").append("svg").attr("class", "lines").attr("width", width).attr("height", height);
  var xAxis = d3.axisBottom(x).tickFormat(function (d) {
    return d3.format("")(d);
  });
  var yAxis = d3.axisLeft(y).tickFormat(formatMoney);
  svg.append("g").attr("class", "axis x-axis").attr("transform", "translate(0, ".concat(height - margin.bottom, ")")).call(xAxis).append("text").attr("transform", "rotate(-55)").attr("class", "axis-label").attr("x", "50%").attr("dy", "3em").text("Year");
  svg.append("g").attr("class", "axis y-axis").attr("transform", "translate(".concat(margin.left, ", 0)")).call(yAxis).append("text").attr("class", "axis-label").attr("y", "50%").attr("dx", "-3em").attr("writing-mode", "vertical-rl").text("Price Index");
  var line = d3.line().defined(function (d) {
    return !isNaN(d.priceIndex);
  }).x(function (d) {
    return x(d.year);
  }).y(function (d) {
    return y(d.priceIndex);
  });
  var lcContainer = svg.append("path").datum(filtered).attr("fill", "none").attr("stroke", "#494197").attr("stroke-width", 1.5).attr("stroke-linejoin", "round").attr("stroke-linecap", "round").attr("d", line); // STATE CHECK-IN

  console.log("updated state", state);
  state.selectedprices = [];
}
},{}],"node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "56824" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["node_modules/parcel/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/housing-data.e31bb0bc.js.map