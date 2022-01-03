var margin = {top: 80, right: 0, bottom: 100, left: 80},
    width = 1000,
    height = 720;

function svg()  {
    return  d3.select("svg");
}

var tooltip=  d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);


function clearSvg() {
    svg().remove();
    d3.select("#tooltip").style("opacity", 0); //    hide_tooltip();
    return d3.select("#stage")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
}

function show_tooltip(label_fun) {
    return function(e,i) {
        d3.select(this).attr("fill", "red");
        d3.select("#tooltip")
            .style("left", (e.pageX + 10) + "px")
            .style("top", (e.pageY - 15) + "px")
            .style("opacity", 1)
            .text(label_fun(i));
    };
}

function hide_tooltip() {
    return function(d,i) {
        d3.select(this).transition().attr("fill", "black");
        d3.select("#tooltip").style("opacity", 0);
    };
}

function add_labels(svg, scale) {
   svg.append('g')
        .attr('transform', `translate(${margin.left}, ${height})`)
        .call(d3.axisBottom(scale))
        .selectAll("text")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start");
}

function create_show_bar_y(svg, data) {
    var yScale = d3.scaleLinear()
        .range([0, height])
        .domain([0, data.max * 1.2]);
    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));
    return yScale;
}

function create_show_bar_x(svg, data, domain) {
    const xScale = d3.scaleBand()
          .range([0, width])
          .domain(domain)
          .padding(0.2)

    add_labels(svg, xScale);
    return xScale;
}

function barchart(data, id_fun) {
    var svg = clearSvg();
    var yScale = create_show_bar_y(svg, data);
    var xScale = create_show_bar_x(svg, data, data.counter.map(id_fun));

    var chart = svg.selectAll()
        .data(data.counter)
        .enter()
        .append('rect')
        .attr("id", "barchart_bar")
        .attr('transform', `translate(${margin.left}, 0)`)
        .attr('x', (s) => xScale(id_fun(s)))
        .attr('y', height)
        .attr('height', 0)
        .attr('width', xScale.bandwidth())
        .on("mouseover", show_tooltip(id_fun))
        .on("mouseout", hide_tooltip())

    chart.transition()
        .attr('height', (s) => yScale(s.edits))
        .attr('y', (s) => height - yScale(s.edits))
        .duration(1000)
        .ease(d3.easeBounceOut);

    return chart;
}


function graphTouches(data) {
    console.log(data);
    barchart(data, (s) => s.author);
}

function graphEdits(data) {
    console.log(data);
    let id_fun = (s) => s.file;
    let chart = barchart(data, id_fun);

    chart.on("click", (s) => {
        showComplexity(id_fun(s.srcElement.__data__));
    });
}


function line_chart(data) {
    console.log(data);
    var svg = clearSvg();

    var parseTime = (d) => { return d3.isoParse(d.ts);};

    var x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return parseTime(d); }))
      .range([ 0, width ]);
    svg.append("g")
        .attr('transform', `translate(${margin.left}, ${height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return Math.max(d.complexity, d.lines); })])
      .range([ height, 0 ]);

    svg.append("g")
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y));

    svg.append("path")
        .datum(data)
        .attr('transform', `translate(${margin.left}, 0)`)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
              .x(function(d) { return x(parseTime(d)); })
              .y(function(d) { return y(d.complexity) })
             )
    svg.append("path")
        .datum(data)
        .attr('transform', `translate(${margin.left}, 0)`)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
              .x(function(d) { return x(parseTime(d)); })
              .y(function(d) { return y(d.lines) })
             )
}


function showComplexity(filename) {
    console.log(filename);
    let cfg = getConfig();
    cfg.filename = filename;
    setConfig(cfg);
    loadJson('/complexity', line_chart);
}


function showTouches() {
    loadJson("/touches", graphTouches);
}

function showEdits() {
    loadJson("/edits", graphEdits);
}

function showCorrelation() {
    loadJson("/correlate", graphCorrelation);
}

function graphCorrelation(data) {
    //    console.log(data);
    var diameter = height,
        radius = diameter / 2,
        innerRadius = radius - 120;

    d3.select("svg").remove();
    var svg = d3.select("#stage").append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");

    let nodes = d3.hierarchy(data, d => d.children).sum(function(d) { return d.size; });
    var cluster = d3.cluster().size([360, innerRadius]);

    cluster(nodes);

    var node = svg.selectAll(".node")
    node
        .data(nodes.leaves())
        .enter().append("text")
        .attr("class", "node")
        .attr("dy", "0.31em")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("id", (d) => {return d.data.name.replaceAll("/", "-").replaceAll(".", "-")})
        .text(function(d) { return d.data.name; });

    // // adds the circle to the node
    // node.append("circle")
    //     .attr("r", d => d.data.value)
    //     .style("stroke", d => d.data.type)
    //     .style("fill", d => d.data.type);

    // // adds the text to the node
    // node.append("text")
    //     .attr("dy", ".35em")
    //     .attr("x", d => d.children ? (d.data.value + 5) * -1 : d.data.value + 5)
    //     .attr("y", d => d.children && d.depth !== 0 ? -(d.data.value + 5) : d)
    //     .style("text-anchor", d => d.children ? "end" : "start")
    //     .attr("id", (d) => {return "lbl-"+d.data.name.replaceAll("/", "-")})
    //     .text(d => d.data.name);

    var line = d3.radialLine()
        .curve(d3.curveBundle.beta(0.85))
        .radius(function (d) {
            return d.y; })
        .angle(function (d) { return d.x / 180 * Math.PI; });


    let link = svg.selectAll(".link");
    link.data(links(nodes.leaves()))
        .enter()
        .append("path")
        .each(function(d) {
            d.source = d[0], d.target = d[d.length - 1];
        })
        .attr("class", "link")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "black")
//        .attr("opacity", )
        .attr("stroke-width", 4)
        .on("mouseover", (d, i) => {
            console.log(this);
            console.log(d);
            console.log(i);
            src_lbl = "#" + i.source.data.name.replaceAll("/", "-").replaceAll(".", "-");
            target_lbl = "#" + i.target.data.name.replaceAll("/", "-").replaceAll(".", "-");
            d3.select(src_lbl).attr("stroke", "red");
            d3.select(target_lbl).attr("stroke", "red");
        })
        .on("mouseout", () => {
            d3.selectAll(".node").attr("stroke", "#333");
        })


}

function links(nodes) {
    var map = {},
        lines = [];

    // Compute a map from name to node.
    nodes.forEach(function (d) {
        map[d.data.name] = d;
    });

    // For each import, construct a link from the source to target node.
    nodes.forEach(function (d) {
        if (d.data.links) d.data.links.forEach(function (i) {
            let target = i[0];
            let cnt = i[1];

            let a = map[d.data.name];
            let b = map[target];
            if (a && b) {
                let path = a.path(b);
                //lines.push({count: cnt, path: path });
                for(let i = 0; i < cnt; i++) {
                    lines.push(path);
                }
            } else {
                console.log("Why is " + target + " or " + d.data.name +  " not in the map???");
            }
        });
    });
    return lines;
}


function loadJson(url, fn) {
    d3.json(url, {
        method: 'POST',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: rawCfg()
    }).then(fn);
}

function rawCfg() {
    var p = d3.select("#project");
    return d3.select("#project #cfg").property("value");
}

function setConfig(cfg) {
    let p = d3.select("#project");
    p.selectAll("#cfg").remove();
    p.append("input")
        .attr("id", "cfg")
        .attr("type", "hidden")
        .attr("value", JSON.stringify(cfg));
}

function getConfig() {
    return JSON.parse(rawCfg());
}

function showConfig() {
    var p = d3.select("#project");
    let project = getConfig();
    let dd = p.append("p")
        .text(project.name + "@" + project["folder"])
        .append("select")
        .attr("id", "subdirs");
    project.dirs.forEach(x=> dd.append("option").text(x));

    // handle on click event
    d3.select('#project #subdirs')
        .on('change', function() {
            var folder = d3.select(this).property('value');
            d3.select("#project p").remove();
            loadJson("/drilldown/"+ folder, function(cfg) { setConfig(cfg); showConfig();});
        });

}

function showProjects() {
    d3.json("/project").then(
        function(project) {
            console.log(project);
            setConfig(project);
            showConfig();
        });
}


function start() {
    d3.json("/project").then(
        function(project) {
            console.log(project);
            setConfig(project);
            showConfig();
            showEdits();
        });
}
