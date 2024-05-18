document.addEventListener('DOMContentLoaded', function () {
    const countrySelect = document.getElementById('country');
    const yearSelect = document.getElementById('year');

    const colors = {
        'AUS': 'blue',
        'CAN': 'green',
        'GBR': 'red'
    };

    let deathData, ausData, canData, gbrData;

    // Load the datasets
    Promise.all([
        d3.csv('DeathRate.csv'),
        d3.csv('HEALTH_WF_AUS_ALL.csv'),
        d3.csv('HEALTH_WF_CAD_ALL.csv'),
        d3.csv('HEALTH_WF_UK_ALL.csv')
    ]).then(function (datasets) {
        deathData = datasets[0];
        ausData = datasets[1];
        canData = datasets[2];
        gbrData = datasets[3];

        console.log('Datasets loaded:', { deathData, ausData, canData, gbrData });

        const years = Array.from(new Set(deathData.map(d => d.Year))).sort();
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        updateChart();
    }).catch(error => {
        console.error('Error loading the CSV files:', error);
    });

    countrySelect.addEventListener('change', updateChart);
    yearSelect.addEventListener('change', updateChart);

    function updateChart() {
        const selectedCountry = countrySelect.value;
        const selectedYear = yearSelect.value;

        if (!selectedCountry || !selectedYear) {
            return;
        }

        const filteredDeathData = deathData.filter(d => d.Code === selectedCountry && d.Year === selectedYear);
        const filteredHealthData = filterHealthData(selectedCountry, selectedYear);

        if (filteredDeathData.length === 0 || filteredHealthData.length === 0) {
            d3.select("#line-chart").html("No data available for the selected country and year.");
            return;
        }

        const deathRateValue = +filteredDeathData[0].Total;
        const healthWorkforceValue = +filteredHealthData[0].Value;

        // Normalize the values to balance the scales
        const maxDeathRate = d3.max(deathData, d => +d.Total);
        const maxHealthWorkforce = d3.max([ausData, canData, gbrData].flat(), d => +d.Value);

        const normalizedDeathRate = (deathRateValue / maxDeathRate) * maxHealthWorkforce;

        const data = [
            { label: 'Death Rate', value: normalizedDeathRate },
            { label: 'Total Healthcare Workforce', value: healthWorkforceValue }
        ];

        drawAreaChart(data, selectedCountry);
    }

    function filterHealthData(country, year) {
        let data;
        if (country === 'AUS') {
            data = ausData;
        } else if (country === 'CAN') {
            data = canData;
        } else if (country === 'GBR') {
            data = gbrData;
        }

        return data.filter(d => d.COU === country && d.Year === year);
    }

    function drawAreaChart(data, country) {
        const width = 800;
        const height = 500;
        const margin = { top: 20, right: 30, bottom: 100, left: 50 };

        const svg = d3.select('#line-chart').html('')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scalePoint()
            .domain(data.map(d => d.label))
            .range([0, width])
            .padding(0.5);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append('g')
            .call(d3.axisLeft(y));

        const area = d3.area()
            .x(d => x(d.label))
            .y0(height)
            .y1(d => y(d.value));

        svg.append('path')
            .datum(data)
            .attr('fill', colors[country])
            .attr('fill-opacity', 0.3)
            .attr('d', area);

        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', colors[country])
            .attr('stroke-width', 2.5)
            .attr('d', d3.line()
                .x(d => x(d.label))
                .y(d => y(d.value))
                .curve(d3.curveMonotoneX)
            );

        svg.selectAll('.dot')
            .data(data)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.label))
            .attr('cy', d => y(d.value))
            .attr('r', 5)
            .attr('fill', colors[country]);

        svg.selectAll('.label')
            .data(data)
            .enter().append('text')
            .attr('class', 'label')
            .attr('x', d => x(d.label))
            .attr('y', d => y(d.value) - 10)
            .attr('text-anchor', 'middle')
            .text(d => `${d.value}`);

        // Add labels under the X-axis
        svg.selectAll('.x-axis-label')
            .data(data)
            .enter().append('text')
            .attr('class', 'x-axis-label')
            .attr('x', d => x(d.label))
            .attr('y', height + 30)
            .attr('text-anchor', 'middle')
            .text(d => d.label);
    }
});
