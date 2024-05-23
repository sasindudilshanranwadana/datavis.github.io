document.addEventListener('DOMContentLoaded', function () {
    const countryISO = window.localStorage.getItem('selectedCountryISO');
    const countryName = window.localStorage.getItem('selectedCountryName');
    const countrySelect = document.getElementById('countrySelect');
    const yearSelect = document.getElementById('yearSelect');
    const countryNameElem = document.getElementById('countryName');

    if (!countryISO || !countryName) {
        alert("No country selected.");
        return;
    }

    countryNameElem.textContent = countryName;

    // List of countries
    const countries = [
        { name: 'Australia', iso: 'AUS' },
        { name: 'Austria', iso: 'AUT' },
        { name: 'Belgium', iso: 'BEL' },
        { name: 'Canada', iso: 'CAN' },
        { name: 'Czechia', iso: 'CZE' },
        { name: 'Denmark', iso: 'DNK' },
        { name: 'Finland', iso: 'FIN' },
        { name: 'France', iso: 'FRA' },
        { name: 'Germany', iso: 'DEU' },
        { name: 'Hungary', iso: 'HUN' },
        { name: 'Ireland', iso: 'IRL' },
        { name: 'Netherlands', iso: 'NLD' },
        { name: 'New Zealand', iso: 'NZL' },
        { name: 'Norway', iso: 'NOR' },
        { name: 'Poland', iso: 'POL' },
        { name: 'Slovak Republic', iso: 'SVK' },
        { name: 'Sweden', iso: 'SWE' },
        { name: 'Switzerland', iso: 'CHE' },
        { name: 'Turkey', iso: 'TUR' },
        { name: 'United Kingdom', iso: 'GBR' },
        { name: 'United States', iso: 'USA' },
        { name: 'Chile', iso: 'CHL' },
        { name: 'Estonia', iso: 'EST' },
        { name: 'Israel', iso: 'ISR' },
        { name: 'Slovenia', iso: 'SVN' },
        { name: 'Italy', iso: 'ITA' },
        { name: 'Greece', iso: 'GRC' },
        { name: 'Lithuania', iso: 'LTU' },
        { name: 'Latvia', iso: 'LVA' },
        { name: 'Portugal', iso: 'PRT' },
        { name: 'Colombia', iso: 'COL' }
    ];

    // Populate country dropdown
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.iso;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });

    // Set the selected country
    countrySelect.value = countryISO;

    countrySelect.addEventListener('change', function () {
        const selectedCountryISO = this.value;
        const selectedCountryName = countries.find(country => country.iso === selectedCountryISO).name;

        // Update local storage
        window.localStorage.setItem('selectedCountryISO', selectedCountryISO);
        window.localStorage.setItem('selectedCountryName', selectedCountryName);

        // Update the page title and reload data
        countryNameElem.textContent = selectedCountryName;
        loadData(selectedCountryISO);
    });

    loadData(countryISO);

    function loadData(countryISO) {
        // Clear previous year options
        yearSelect.innerHTML = '';

        // Load data files
        const docFile = 'HEALTH_All Docs.csv';
        const nurFile = 'HEALTH_All Nurses.csv';

        Promise.all([d3.csv(docFile), d3.csv(nurFile)]).then(dataArrays => {
            const [docData, nurData] = dataArrays;

            console.log('Doctor Data:', docData);
            console.log('Nurse Data:', nurData);

            // Filter data for the selected country
            const filteredDocData = docData.filter(d => d.COU === countryISO);
            const filteredNurData = nurData.filter(d => d.COU === countryISO);

            console.log(`Filtered Doctor Data for ${countryISO}:`, filteredDocData);
            console.log(`Filtered Nurse Data for ${countryISO}:`, filteredNurData);

            // Extract years from both datasets and merge them into a unique set
            const docYears = filteredDocData.map(d => +d.Year);
            const nurYears = filteredNurData.map(d => +d.Year);
            const years = Array.from(new Set([...docYears, ...nurYears]));
            years.sort((a, b) => a - b);

            console.log('Years:', years);

            // Populate year dropdown
            if (years.length > 0) {
                years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelect.appendChild(option);
                });

                yearSelect.addEventListener('change', function () {
                    const selectedYear = +this.value;
                    const docValues = filteredDocData.filter(d => +d.Year === selectedYear).map(d => +d.Value);
                    const nurValues = filteredNurData.filter(d => +d.Year === selectedYear).map(d => +d.Value);

                    console.log('Selected Year:', selectedYear);
                    console.log('Doctor Values:', docValues);
                    console.log('Nurse Values:', nurValues);

                    // Update the bar chart
                    updateBarChart(docValues, nurValues);
                });

                // Initial plot
                yearSelect.dispatchEvent(new Event('change'));
            } else {
                console.log(`No data available for ${countryISO}`);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No data available';
                yearSelect.appendChild(option);
            }
        }).catch(error => {
            console.error('Error loading the data files:', error);
        });
    }

    function updateBarChart(docValues, nurValues) {
        const svg = d3.select('#line-chart').html('').append('svg').attr('width', 960).attr('height', 500);
        const margin = { top: 20, right: 30, bottom: 50, left: 80 }; // Adjusted margins
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
        if (docValues.length > 0) {
            g.append("text")
                .attr("x", x('Doctors') + x.bandwidth() / 4)
                .attr("y", y(docValues[0]) - 5)
                .attr("text-anchor", "middle")
                .style("fill", "blue")
                .text(docValues[0]);
        }

        if (nurValues.length > 0) {
            g.append("text")
                .attr("x", x('Nurses') + 3 * x.bandwidth() / 4)
                .attr("y", y(nurValues[0]) - 5)
                .attr("text-anchor", "middle")
                .style("fill", "green")
                .text(nurValues[0]);
        }

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

