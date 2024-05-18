document.addEventListener('DOMContentLoaded', function () {
    const countryISO = window.localStorage.getItem('selectedCountryISO');
    const countryName = window.localStorage.getItem('selectedCountryName');
    const yearSelect = document.getElementById('yearSelect');
    const countryNameElem = document.getElementById('countryName');

    if (!countryISO || !countryName) {
        alert("No country selected.");
        return;
    }

    countryNameElem.textContent = countryName;

    // Load data files
    const files = {
        'AUS': ['HEALTH_WF_AUS_DOC.csv', 'HEALTH_WF_AUS_NUR.csv'],
        'CAN': ['HEALTH_WF_CAD_DOC.csv', 'HEALTH_WF_CAD_NUR.csv'],
        'GBR': ['HEALTH_WF_UK_DOC.csv', 'HEALTH_WF_UK_NUR.csv']
    };

    const filePromises = files[countryISO].map(file => d3.csv(file));

    Promise.all(filePromises).then(dataArrays => {
        const [docData, nurData] = dataArrays;

        console.log('Doctor Data:', docData);
        console.log('Nurse Data:', nurData);

        // Extract years
        const years = Array.from(new Set(docData.map(d => +d.Year)));
        years.sort((a, b) => a - b);

        console.log('Years:', years);

        // Populate year dropdown
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        yearSelect.addEventListener('change', function () {
            const selectedYear = +this.value;
            const docValues = docData.filter(d => +d.Year === selectedYear).map(d => +d.Value);
            const nurValues = nurData.filter(d => +d.Year === selectedYear).map(d => +d.Value);

            console.log('Selected Year:', selectedYear);
            console.log('Doctor Values:', docValues);
            console.log('Nurse Values:', nurValues);

            // Update the bar chart
            updateBarChart(docValues, nurValues);
        });

        // Initial plot
        yearSelect.dispatchEvent(new Event('change'));
    });

    function updateBarChart(docValues, nurValues) {
        const svg = d3.select('#line-chart').html('').append('svg').attr('width', 960).attr('height', 500);
        const margin = {top: 20, right: 30, bottom: 50, left: 80}; // Adjusted margins
        const width = svg.attr('width') - margin.left - margin.right;
        const height = svg.attr('height') - margin.top - margin.bottom;

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(['Doctors', 'Nurses']).range([0, width]).padding(0.4);
        const y = d3.scaleLinear().domain([0, d3.max([...docValues, ...nurValues])]).nice().range([height, 0]);

        g.append('g').attr('class', 'axis axis--x').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).tickSize(0));
        g.append('g').attr('class', 'axis axis--y').call(d3.axisLeft(y).ticks(10).tickFormat(d3.format("~s")));

        g.selectAll('.bar-doctors')
            .data(docValues)
            .enter().append('rect')
            .attr('class', 'bar-doctors')
            .attr('x', x('Doctors'))
            .attr('y', d => y(d))
            .attr('width', x.bandwidth() / 2)
            .attr('height', d => height - y(d))
            .attr('fill', 'blue');

        g.selectAll('.bar-nurses')
            .data(nurValues)
            .enter().append('rect')
            .attr('class', 'bar-nurses')
            .attr('x', x('Nurses') + x.bandwidth() / 2)
            .attr('y', d => y(d))
            .attr('width', x.bandwidth() / 2)
            .attr('height', d => height - y(d))
            .attr('fill', 'green');

        // Add labels to the bars
        g.append("text")
            .attr("x", x('Doctors') + x.bandwidth() / 4)
            .attr("y", y(docValues[0]) - 5)
            .attr("text-anchor", "middle")
            .style("fill", "blue")
            .text(docValues[0]);

        g.append("text")
            .attr("x", x('Nurses') + 3 * x.bandwidth() / 4)
            .attr("y", y(nurValues[0]) - 5)
            .attr("text-anchor", "middle")
            .style("fill", "green")
            .text(nurValues[0]);

        // Add labels under the bars
        g.append("text")
            .attr("x", x('Doctors') + x.bandwidth() / 4)
            .attr("y", height + 20)
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .text("Doctors");

        g.append("text")
            .attr("x", x('Nurses') + 3 * x.bandwidth() / 4)
            .attr("y", height + 20)
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .text("Nurses");
    }
});
