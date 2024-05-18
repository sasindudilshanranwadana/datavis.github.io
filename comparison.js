document.addEventListener('DOMContentLoaded', function () {
    const countrySelect1 = document.getElementById('countrySelect1');
    const countrySelect2 = document.getElementById('countrySelect2');
    const typeSelect = document.getElementById('typeSelect');

    const countries = {
        'AUS': 'Australia',
        'CAD': 'Canada',
        'GBR': 'United Kingdom'
    };

    const files = {
        'AUS_DOC': 'HEALTH_WF_AUS_DOC.csv',
        'AUS_NUR': 'HEALTH_WF_AUS_NUR.csv',
        'CAD_DOC': 'HEALTH_WF_CAD_DOC.csv',
        'CAD_NUR': 'HEALTH_WF_CAD_NUR.csv',
        'GBR_DOC': 'HEALTH_WF_UK_DOC.csv',
        'GBR_NUR': 'HEALTH_WF_UK_NUR.csv'
    };

    const colors = {
        'AUS': 'blue',
        'CAD': 'green',
        'GBR': 'red'
    };

    function updateCountrySelect2() {
        const selectedCountry1 = countrySelect1.value;
        countrySelect2.innerHTML = '<option value="">--Select Country--</option>';
        for (const [code, name] of Object.entries(countries)) {
            if (code !== selectedCountry1) {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                countrySelect2.appendChild(option);
            }
        }
        updateChart();
    }

    function filterData(country, type) {
        if (type === 'Doctors') {
            return country === 'AUS' ? ausDocData : country === 'CAD' ? cadDocData : gbrDocData;
        } else if (type === 'Nurses') {
            return country === 'AUS' ? ausNurData : country === 'CAD' ? cadNurData : gbrNurData;
        }
    }

    function updateChart() {
        const country1 = countrySelect1.value;
        const country2 = countrySelect2.value;
        const type = typeSelect.value;

        if (!country1 || !country2 || !type) {
            console.log('Selections not complete:', { country1, country2, type });
            return; // Do not draw chart if any dropdown is not selected
        }

        const data1 = filterData(country1, type);
        const data2 = filterData(country2, type);

        console.log('Filtered data:', { data1, data2 });

        drawChart(data1, data2, country1, country2);
    }

    function drawChart(data1, data2, country1, country2) {
        const svgContainer = d3.select('#line-chart').html('').append('svg')
            .attr('width', '1000')
            .attr('height', '600');

        const margin = { top: 20, right: 30, bottom: 100, left: 80 };
        const width = 900 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const svg = svgContainer.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const parseDate = d3.timeParse('%Y');
        data1.forEach(d => d.Year = parseDate(d.Year));
        data2.forEach(d => d.Year = parseDate(d.Year));

        // Ensure both data sets are sorted by year
        data1.sort((a, b) => a.Year - b.Year);
        data2.sort((a, b) => a.Year - b.Year);

        const x = d3.scaleTime().domain(d3.extent([...data1, ...data2], d => d.Year)).range([0, width]);
        const y = d3.scaleLinear().domain([0, d3.max([...data1, ...data2], d => +d.Value)]).range([height, 0]);

        const xAxis = d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat('%Y'));
        const yAxis = d3.axisLeft(y).ticks(10).tickFormat(d3.format("~s"));

        svg.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        svg.append('g')
            .attr('class', 'axis axis--y')
            .call(yAxis);

        const line1 = d3.line().x(d => x(d.Year)).y(d => y(d.Value));
        const line2 = d3.line().x(d => x(d.Year)).y(d => y(d.Value));

        svg.append('path')
            .datum(data1)
            .attr('class', 'line')
            .attr('d', line1)
            .style('stroke', colors[country1])
            .style('fill', 'none');

        svg.append('path')
            .datum(data2)
            .attr('class', 'line')
            .attr('d', line2)
            .style('stroke', colors[country2])
            .style('fill', 'none');

        svg.selectAll('.dot1')
            .data(data1)
            .enter().append('circle')
            .attr('class', 'dot1')
            .attr('cx', d => x(d.Year))
            .attr('cy', d => y(d.Value))
            .attr('r', 3)
            .style('fill', colors[country1]);

        svg.selectAll('.dot2')
            .data(data2)
            .enter().append('circle')
            .attr('class', 'dot2')
            .attr('cx', d => x(d.Year))
            .attr('cy', d => y(d.Value))
            .attr('r', 3)
            .style('fill', colors[country2]);

        // Add legend
        const legend = svg.selectAll('.legend')
            .data([country1, country2])
            .enter().append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => `translate(0,${height + 40 + i * 20})`);

        legend.append('rect')
            .attr('x', 10)
            .attr('width', 18)
            .attr('height', 18)
            .style('fill', d => colors[d]);

        legend.append('text')
            .attr('x', 35)
            .attr('y', 9)
            .attr('dy', '.35em')
            .style('text-anchor', 'start')
            .text(d => countries[d]);
    }

    // Enhanced logging to check file paths
    console.log('Loading CSV files:', Object.values(files));

    // Load each CSV file individually and log any specific errors
    Promise.all([
        d3.csv(files['AUS_DOC']).catch(error => console.error('Error loading AUS_DOC:', error)),
        d3.csv(files['AUS_NUR']).catch(error => console.error('Error loading AUS_NUR:', error)),
        d3.csv(files['CAD_DOC']).catch(error => console.error('Error loading CAD_DOC:', error)),
        d3.csv(files['CAD_NUR']).catch(error => console.error('Error loading CAD_NUR:', error)),
        d3.csv(files['GBR_DOC']).catch(error => console.error('Error loading GBR_DOC:', error)),
        d3.csv(files['GBR_NUR']).catch(error => console.error('Error loading GBR_NUR:', error))
    ]).then(function (data) {
        window.ausDocData = data[0];
        window.ausNurData = data[1];
        window.cadDocData = data[2];
        window.cadNurData = data[3];
        window.gbrDocData = data[4];
        window.gbrNurData = data[5];

        console.log('Data loaded:', {
            ausDocData: window.ausDocData,
            ausNurData: window.ausNurData,
            cadDocData: window.cadDocData,
            cadNurData: window.cadNurData,
            gbrDocData: window.gbrDocData,
            gbrNurData: window.gbrNurData
        });

        // Populate initial options for both dropdowns
        countrySelect1.innerHTML = '<option value="">--Select Country--</option>';
        for (const [code, name] of Object.entries(countries)) {
            const option1 = document.createElement('option');
            option1.value = code;
            option1.textContent = name;
            countrySelect1.appendChild(option1);
        }
        updateCountrySelect2();

        countrySelect1.addEventListener('change', updateCountrySelect2);
        countrySelect2.addEventListener('change', updateChart);
        typeSelect.addEventListener('change', updateChart);

        // Initial chart update to reflect default selections
        updateChart();
    }).catch(function (error) {
        console.error('Error loading data:', error);
    });
});
