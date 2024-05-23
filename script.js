var svg = d3.select("svg"),
    width = 960,
    height = 600,
    g = svg.append("g");

svg.attr("width", width).attr("height", height);

var projection = d3.geoNaturalEarth1()
    .scale((width / 6.3) * 0.95)
    .translate([width / 2, height / 2]);

var path = d3.geoPath().projection(projection);

var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', function(event) {
        g.attr('transform', event.transform);
    });

svg.call(zoom);

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 100000]);

var world, dataByCountryYear = {};

Promise.all([
    d3.json("World_Map.geojson"),
    d3.csv("HEALTH_WFMI.csv")
]).then(function([worldData, data]) {
    world = worldData;

    // Extract year range and calculate total count
    var years = data.map(d => +d.Year);
    var minYear = d3.min(years);
    var maxYear = d3.max(years);
    var totalCount = d3.sum(data, d => +d.Value);

    // Display year range and total count
    document.getElementById('yearRange').textContent = `${minYear} - ${maxYear}`;
    document.getElementById('totalCount').textContent = totalCount.toLocaleString();

    // Prepare data by country and year
    data.forEach(function(d) {
        var countryISO = d.COU;
        if (!dataByCountryYear[countryISO]) {
            dataByCountryYear[countryISO] = {};
        }
        dataByCountryYear[countryISO][d.Year] = +d.Value;
    });

    // Draw the map
    g.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", function(d) {
            var countryData = dataByCountryYear[d.properties.ISO_A3];
            var value = countryData ? d3.mean(Object.values(countryData)) : 0;
            return value ? colorScale(value) : "#ccc";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", "0.5px")
        .classed("no-data", function(d) {
            return !dataByCountryYear[d.properties.ISO_A3];
        })
        .on("mouseover", function(event, d) {
            var countryData = dataByCountryYear[d.properties.ISO_A3];
            if (countryData) {
                var value = d3.mean(Object.values(countryData));
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(d.properties.NAME + "<br/>" + value.toLocaleString())
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function(d) {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event, d) {
            var countryData = dataByCountryYear[d.properties.ISO_A3];
            if (countryData) {
                window.localStorage.setItem('selectedCountryISO', d.properties.ISO_A3);
                window.localStorage.setItem('selectedCountryName', d.properties.NAME);
                var newWindow = window.open("details.html", '_blank');
                if (newWindow) {
                    newWindow.focus();
                } else {
                    console.log("Popup blocked. Unable to open details.html");
                }
            }
        });
});

// Ensure the map loads only after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for navigation links within the same page
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(this.getAttribute('href'));
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});
