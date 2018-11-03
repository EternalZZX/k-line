$(function () {
  var weeklyDataUrl = 'http://data.gtimg.cn/flashdata/hushen/latest/weekly/';
  var shareDataUrl = 'http://qt.gtimg.cn/q=';
  var upColor = '#ec0000';
  var downColor = '#00da3c';
  var upBorderColor = '#8A0000';
  var downBorderColor = '#008F28';

  var searchButton = $('#search-btn');
  var codeInput = $('#code-input');
  var KLineChart = echarts.init(document.getElementById('k-line-chart'));

  var weeklyData = [];
  var name = '';
  var price = 0;
  var sliderInput = 0;
  var sliderOutput = 0;

  $('#slider-range').slider({
    orientation: 'vertical',
    range: true,
    min: 80,
    max: 120,
    values: [90, 110],
    slide: function( event, ui ) {
      sliderInput = ui.values[0];
      sliderOutput = ui.values[1];
      drawChart(weeklyData, name, price * sliderInput / 100, price * sliderOutput / 100);
    }
  }).slider('pips', {
      rest: 'label',
      step: '5'
  });

  getShareInfo('399001');

  searchButton.click(function () {
    var code = codeInput.val();
    getShareInfo(code);
  });

  function getShareInfo (code) {
    if (!code || code.length !== 6) {
      return;
    }
    var reqCode = ['0', '1', '2', '3'].indexOf(code[0]) !== -1
      ? 'sz' + code : 'sh' + code;
    $.getScript(shareDataUrl + reqCode, function (data) {
      var arr = window['v_' + reqCode].split('~');
      name = arr[1];
      price = parseFloat(arr[3]);
      getKLine(code, name, price * sliderInput / 100, price * sliderOutput / 100);
    }).fail(function (err) {
      console.log(err);
    });
  }

  function getKLine (code, name, input, output) {
    if (!code || code.length !== 6) {
      return;
    }
    var reqCode = ['0', '1', '2', '3'].indexOf(code[0]) !== -1
      ? 'sz' + code : 'sh' + code;
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
        left: 0
      },
      legend: {
        data: ['周K', 'MA5', 'MA10', 'MA20', 'MA30'],
        left: 120,
        top: 2
      },
      grid: {
        left: '8%',
        right: '7%',
        top: '10%',
        bottom: '18%'
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
        }
      },
      dataZoom: [{
        type: 'inside',
        start: 0,
        end: 100
      }, {
        show: true,
        type: 'slider',
        y: '90%',
        start: 50,
        end: 100
      }],
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
      }, {
        name: 'MA10',
        type: 'line',
        data: calculateMA(data, 10),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          normal: {
            opacity: 0.5
          }
        }
      }, {
        name: 'MA20',
        type: 'line',
        data: calculateMA(data, 20),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          normal: {
            opacity: 0.5
          }
        }
      }, {
        name: 'MA30',
        type: 'line',
        data: calculateMA(data, 30),
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