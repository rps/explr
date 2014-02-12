var filterChart = (function(){
'use strict'
/* 
 * Initial setup
 */

// Access variable
var innerCharts = {};

// Add data to crossfilter
var ndx = crossfilter(data),
    all = ndx.groupAll();

// Formatting helpers
var parseDate = d3.time.format('%Y-%m-%dT%X'),
    percentage = d3.format('.2p'),
    roundPercentage = function(d) { return percentage(d3.round(d, 3)); };

// Format the data
data.forEach(function(d){
  d.date = parseDate.parse(d.originalTime);
  d.localDate = parseDate.parse(d.localTime);
  d.hour = d.date.getHours();
  d.localHour = d.localDate.getHours();
  d.count = 1;
});

// Count of all records
d3.selectAll('.total-count')
      .text((ndx.size()));

// Count of selected records
dc.dataCount('.dc-data-count')
  .dimension(ndx)
  .group(all);

// Helper function
var calcTotal = function(chart) {
  var dataVar = chart.data(),
      totalVar = 0;
  for(var item in dataVar){
    totalVar += dataVar[item].value;
  }
  return totalVar;
};  

/* 
 * Chart variables
 */

// Dimensions
var hourDim = ndx.dimension(function(d){ return d.localHour; }),
    trafficDim = ndx.dimension(function(d) { return d.trafficSource; }),
    cityDim = ndx.dimension(function(d){ return d.city; }),
    convDim = ndx.dimension(function(d) { return d.convSteps; });

// Counts of bookings
var hourlyTotal = hourDim.group().reduceSum(function(d) { return d.count; }),
    trafficTotal = trafficDim.group().reduceSum(function(d) { return d.count; }),
    cityTotal = cityDim.group().reduceSum(function(d) { return d.count; });

// Count of party size 
var partyTotal = convDim.group().reduceSum(function(d) { return d.count; });

// Margins
var marginSetting = {top: 20, right: 10, bottom: 40, left: 40};

/* 
 * Local hourly reservations
 */

// Demand chart
innerCharts.hourlyChart = dc.lineChart('#line');

innerCharts.hourlyChart
  .width(350)
  .height(200)
  .margins(marginSetting)
  .dimension(hourDim)
  .group(hourlyTotal)
  .x(d3.scale.linear().domain([0,24]))
  .yAxisLabel('Visitors') 
  .elasticY(true);
  
innerCharts.hourlyChart.yAxis().tickFormat(d3.format('s'));

/* 
 * Reservations from referrers
 */

// Coloration
var colorScale = d3.scale.ordinal().range(['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6']);

// Referrer chart
innerCharts.sourceChart = dc.pieChart('#pie');

// Sizing variables
var totalPie = 0;

innerCharts.sourceChart
  .width(350)
  .height(200)
  .dimension(trafficDim)
  .group(trafficTotal)
  .colors(colorScale)
  .innerRadius(30)
  .slicesCap(5)
  .on('preRender', function(chart){
    totalPie = calcTotal(chart);
  })
  .on('preRedraw', function(chart){
    totalPie = calcTotal(chart);
  })
  .title(function (p) {
    return percentage(p.value/totalPie);
  })
  .renderLabel(false)
  .legend(dc.legend().gap(3));

/* 
 * Reservations per restaurant
 */

// Restaurant chart
innerCharts.cityChart = dc.rowChart('#row');

// Sizing variables
var currentMaxRow = 0,
    ratio,
    chartMax = cityTotal.top(1)[0].value;

innerCharts.cityChart
  .width(350)
  .height(500)
  .dimension(cityDim)
  .group(cityTotal)
  .on('postRedraw', function(chart){
    currentMaxRow = cityTotal.top(1)[0].value;
    ratio = currentMaxRow/chartMax;
    if(ratio < .25 || ratio > 1){
      innerCharts.cityChart.elasticX(true);
      chartMax = currentMaxRow;
      dc.redrawAll();
    } else {
      innerCharts.cityChart.elasticX(false);
      chartMax = currentMaxRow;
    }
  })
  .xAxis().ticks(4);

/* 
 * Distribution of party size
 */

// Party size chart
innerCharts.convChart = dc.barChart('#bar');

innerCharts.convChart
  .width(350)
  .height(200)
  .margins(marginSetting)
  .dimension(convDim)
  .group(partyTotal)  
  .renderHorizontalGridLines(true)
  .x(d3.scale.ordinal().domain([1,2,3,4,5,6,7]))
  .xUnits(dc.units.ordinal)
  .elasticY(true)
  .yAxisLabel('Visitors') 
  .yAxis().tickFormat(d3.format('s'));

innerCharts.convChart.xAxis().ticks(14);

// Render all charts
dc.renderAll();

// Public reset function
return function(chartName){
  innerCharts[chartName].filterAll();
};

})();
