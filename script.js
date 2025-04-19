
const EDUCATION_URL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
const COUNTIES_URL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

const svg = d3.select("svg");
const tooltip = d3.select("#tooltip");

const width = 960;
const height = 600;

Promise.all([d3.json(COUNTIES_URL), d3.json(EDUCATION_URL)])
  .then(([us, education]) => {
    const counties = topojson.feature(us, us.objects.counties).features;

    const eduMap = new Map(education.map(d => [d.fips, d]));

    const colorScale = d3.scaleThreshold()
      .domain([10, 20, 30, 40, 50, 60])
      .range(d3.schemeBlues[7]);

    svg.selectAll("path")
      .data(counties)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", d3.geoPath())
      .attr("data-fips", d => d.id)
      .attr("data-education", d => eduMap.get(d.id)?.bachelorsOrHigher || 0)
      .attr("fill", d => {
        const educationValue = eduMap.get(d.id)?.bachelorsOrHigher;
        return educationValue ? colorScale(educationValue) : "#ccc";
      })
      .on("mouseover", (event, d) => {
        const edu = eduMap.get(d.id);
        tooltip
          .style("visibility", "visible")
          .attr("data-education", edu.bachelorsOrHigher)
          .html(`${edu.area_name}, ${edu.state}<br>
                ${edu.bachelorsOrHigher}%`)
          .style("top", event.pageY - 40 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Legend
    const legendWidth = 300;
    const legendHeight = 10;
    const legendThresholds = colorScale.domain();

    const legendX = d3.scaleLinear()
      .domain([d3.min(legendThresholds), d3.max(legendThresholds)])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendX)
      .tickValues(legendThresholds)
      .tickFormat(d => d + "%");

    const legend = svg.append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${(width - legendWidth) / 2}, ${height - 40})`);

    legend.selectAll("rect")
      .data(colorScale.range().map((color, i) => {
        const x0 = i ? legendThresholds[i - 1] : legendX.domain()[0];
        const x1 = legendThresholds[i] || legendX.domain()[1];
        return { x0, x1, color };
      }))
      .enter()
      .append("rect")
      .attr("x", d => legendX(d.x0))
      .attr("y", 0)
      .attr("width", d => legendX(d.x1) - legendX(d.x0))
      .attr("height", legendHeight)
      .attr("fill", d => d.color);

    legend.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  });

