$(function () {
  var weeklyDataUrl = 'http://data.gtimg.cn/flashdata/hushen/latest/weekly/';
  var shareDataUrl = 'http://qt.gtimg.cn/q=';
  var upColor = '#ec0000';
  var downColor = '#00da3c';
  var upBorderColor = '#8A0000';
  var downBorderColor = '#008F28';

  var searchButton = $('#search-btn');
  var codeInput = $('#code-input');
  var dateRange = $('#date-range');
  var dataTable = $('#date-table');
  var computeButton = $('#compute-btn');
  var computeIncome = $('#compute-income');
  var helpIncome1 = $('#help-income-1');
  var helpIncome2 = $('#help-income-2');
  var helpIncome3 = $('#help-income-3');
  var KLineChart = echarts.init(document.getElementById('k-line-chart'));

  var dateRangeSelect = '';
  var sliderInput = 0;
  var sliderOutput = 0;
  var name = '';
  var price = 0;
  var weeklyData = [];

  getShareInfo('000016.SH');

  $('#slider-output').slider({
    orientation: 'vertical',
    range: 'min',
    min: 100,
    max: 110,
    step: 2,
    value: 102,
    slide: function ( event, ui ) {
      sliderOutput = ui.value;
      drawChart(weeklyData, name, price * sliderInput / 100, price * sliderOutput / 100);
    },
    change: function ( event, ui ) {
      sliderOutput = ui.value;
      drawChart(weeklyData, name, price * sliderInput / 100, price * sliderOutput / 100);
    }
  }).slider('pips', {
    rest: 'label'
  });

  $('#slider-input').slider({
    orientation: 'vertical',
    range: 'max',
    min: 70,
    max: 90,
    step: 5,
    value: 90,
    slide: function ( event, ui ) {
      sliderInput = ui.value;
      drawChart(weeklyData, name, price * sliderInput / 100, price * sliderOutput / 100);
    },
    change: function ( event, ui ) {
      sliderInput = ui.value;
      drawChart(weeklyData, name, price * sliderInput / 100, price * sliderOutput / 100);
    }
  }).slider('pips', {
    rest: 'label'
  });

  codeInput.autocomplete({
    source: function (request, response) {
      $.get({
        url: "http://www.vcup.cn/api/income/stock",
        type: 'get',
        dataType: 'jsonp',
        data: {
          keyword: codeInput.val()
        },
        success: function (data) {
          response($.map(data.data, 
            function (item) {
              return {
                label: item.stocknamecn,
                value: item.stocknamecn,
                code: item.stockname,
                maturityList: maturity_list,
                knockinList: knockin_list,
                knockoutList: knockout_list
              }
            })
          );
        }
      });
    },
    focus: function() {
      return false;
    },
    select: function (event, ui) {
      getShareInfo(ui.item.code); 
    }
  });

  searchButton.click(function () {
    searchText();
  });

  codeInput.keydown(function (event) { 
    if (event.keyCode === 13) {
      searchText();
    }
  });

  var searchText = function () {
    $.get({
      url: "http://www.vcup.cn/api/income/stock",
      type: 'get',
      dataType: 'jsonp',
      data: {
        keyword: codeInput.val()
      },
      success: function (data) {
        getShareInfo(data.data[0].stockname);
      }
    });
  }

  var dateArray = [
    { label: '3个月', value: '3' },
    { label: '6个月', value: '6' },
    { label: '9个月', value: '9' },
    { label: '1年', value: '12' }
  ];
  initDateRange(dateArray);

  $('.kl-button').click(function () {
    $('.kl-button').removeClass('kl-button_active');
    $(this).addClass('kl-button_active');
    dateRangeSelect = $(this).data('value');
  });

  var tableData = {
    head: ['6个月', '1年', '2年', '3年'],
    title: ['最高年化收益:', '实际收益:', '亏损:', '敲入(次):', '敲入(次):'],
    data: [
      ['26%', '26%', '26%', '26%'],
      ['10.8', '10.8', '10.8', '10.8'],
      ['0%', '0%', '0%', '0%'],
      ['0', '1', '3', '2'],
      ['0', '1', '3', '2']
    ]
  }
  initTable(tableData);

  function initDateRange (dateArray) {
    dateRange.empty();
    dateArray.forEach(function (item, index) {
      var html = index === 0
        ? '<div class="kl-button kl-button_active" data-value="' + item.value + '">' + item.label + '</div>'
        : '<div class="kl-button" data-value="' + item.value + '">' + item.label + '</div>'
      dateRange.append(html);
    });
    dateRangeSelect = dateArray[0].value;
  }

  function initTable (tableData) {
    dataTable.empty();
    var html = '<thead><tr><th></th>';
    tableData.head.forEach(function (item) {
      html += '<th>' + item + '</th>';
    });
    html += '</tr></thead><tbody>';
    for (var i = 0; i < tableData.title.length; i++) {
      html += '<tr><td>' + tableData.title[i] + '</td>';
      for (var j = 0; j < tableData.head.length; j++) {
        html += '<td>' + tableData.data[i][j] + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    dataTable.append(html);
  }

  function getShareInfo (code) {
    if (!code) {
      return;
    }
    var arr = code.split('.');
    var reqCode = arr[1].toLowerCase() + arr[0];
    $.getScript(shareDataUrl + reqCode, function (data) {
      var arr = window['v_' + reqCode].split('~');
      name = arr[1] + '(' + code + ')';
      price = parseFloat(arr[3]);
      getKLine(code, name, price * sliderInput / 100, price * sliderOutput / 100);
    }).fail(function (err) {
      console.log(err);
    });
  }

  function getKLine (code, name, input, output) {
    if (!code) {
      return;
    }
    var arr = code.split('.');
    var reqCode = arr[1].toLowerCase() + arr[0];
    $.getScript(weeklyDataUrl + reqCode + '.js', function () {
      weeklyData = formatData();
      drawChart(weeklyData, name, input, output);
    }).fail(function (err) {
      console.log(err);
    });
  }

  function drawChart(raw, name, input, output) {
    var data = deepClone(raw);
    data = splitData(data);
    var option = getOption(data, name, input, output);
    KLineChart.setOption(option, true);
  }

  function getOption (data, name, input, output) {
    return {
      title: {
        text: name,
        left: '5%'
      },
      grid: {
        left: '12%',
        right: '12%',
        top: '10%',
        bottom: '8%'
      },
      xAxis: {
        type: 'category',
        data: data.categoryData,
        scale: true,
        boundaryGap: false,
        axisLine: {
          onZero: false
        },
        splitLine: {
          show: false
        },
        splitNumber: 20,
        min: 'dataMin',
        max: 'dataMax'
      },
      yAxis: {
        scale: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function (params) {
          var html = params[0].name + '<br>' +
            params[0].seriesName + '<br>' +
            params[0].marker + '开盘价: ' + params[0].data[1] + '<br>' +
            params[0].marker + '收盘价: ' + params[0].data[2] + '<br>' +
            params[0].marker + '最低价: ' + params[0].data[3] + '<br>' +
            params[0].marker + '最高价: ' + params[0].data[4] + '<br>' +
            params[0].marker + '成交量: ' + params[0].data[5];
          if (params.length > 1) {
            for (var i = 1; i < params.length; i++) {
              html += '<br>' + params[i].marker + params[i].seriesName + ': ' + params[i].data;
            }
          }
          return html;
        }
      },
      series: [{
        name: '周K',
        type: 'candlestick',
        data: data.values,
        itemStyle: {
          normal: {
            color: upColor,
            color0: downColor,
            borderColor: upBorderColor,
            borderColor0: downBorderColor
          }
        },
        markLine: {
          data: [
            { name: '敲入', xAxis: 0, yAxis: input, symbol: 'circle'},
            { name: '敲出', xAxis: 0, yAxis: output, symbol: 'circle'},
          ]
        }
      }, {
        name: 'MA5',
        type: 'line',
        data: calculateMA(data, 5),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          normal: {
            opacity: 0.5
          }
        }
      }]
    };
  }

  function formatData () {
    var arrData = [];
    var arr = latest_weekly_data.split('\n');
    arr = arr.slice(2, arr.length - 1);
    arr.forEach(function (item) {
      var arrItem = item.split(' ');
      var date = '20' + arrItem[0].substring(0, 2) +
        '-' + arrItem[0].substring(2, 4) +
        '-' + arrItem[0].substring(4, 6);
      arrData.push([
        date,
        parseFloat(arrItem[1]),
        parseFloat(arrItem[2]),
        parseFloat(arrItem[4]),
        parseFloat(arrItem[3]),
        parseInt(arrItem[5])
      ]);
    });
    return arrData;
  }

  function splitData (rawData) {
    var categoryData = [];
    var values = [];
    var volumes = [];
    for (var i = 0; i < rawData.length; i++) {
      categoryData.push(rawData[i].splice(0, 1)[0]);
      values.push(rawData[i]);
      volumes.push([i, rawData[i][4], rawData[i][0] > rawData[i][1] ? 1 : -1]);
    }
    return {
      categoryData: categoryData,
      values: values,
      volumes: volumes
    };
  }

  function calculateMA (data, dayCount) {
    var result = [];
    for (var i = 0, len = data.values.length; i < len; i++) {
      if (i < dayCount) {
        result.push('-');
        continue;
      }
      var sum = 0;
      for (var j = 0; j < dayCount; j++) {
        sum += data.values[i - j][1];
      }
      result.push(+(sum / dayCount).toFixed(3));
    }
    return result;
  }

  function deepClone(obj) {
    if (typeof obj != 'object' || obj === null) {
      return obj;
    }
    var newObj = obj.constructor === Array ? [] : {};
    for (var key in obj) {
      newObj[key] = deepClone(obj[key]);
    }
    return newObj;
  }
});

// http://webstock.quote.hermes.hexun.com/a/kline?code=sse601398&start=20170909150000&number=-1000&type=5&callback=callback