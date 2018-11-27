var dailyDataUrl = 'http://webstock.quote.hermes.hexun.com/a/kline';
var weeklyDataUrl = 'http://data.gtimg.cn/flashdata/hushen/latest/weekly/';
var shareDataUrl = 'http://qt.gtimg.cn/q=';

var upColor = '#ec0000';
var downColor = '#00da3c';
var upBorderColor = '#8A0000';
var downBorderColor = '#008F28';

var toast = new Toast('#toast');
var searchButton = $('#search-btn');
var codeInput = $('#code-input');
var dateRange = $('#date-range');
var dataTable = $('#date-table');
var computeButton = $('#compute-btn');
var computeIncome = $('#compute-income');
var pdfButton = $('#pdf-btn');
var helpIncome1 = $('#help-income-1');
var helpIncome2 = $('#help-income-2');
var helpIncome3 = $('#help-income-3');
var helpIncome4 = $('#help-income-4');
var helpOutput = $('.kl-help-no1');
var helpInput = $('.kl-help-no2');
var KLineChart = echarts.init(document.getElementById('k-line-chart'));

var dateRangeSelect = '';
var sliderInput = 0;
var sliderOutput = 0;
var outputRate = 0;
var stockname = '';
var name = '';
var price = 0;
var weeklyData = [];

searchText('000016.SH');

codeInput.autocomplete({
  minLength: 2,
  source: function (request, response) {
    $.get({
      url: "http://www.vcup.cn/api/income/stock",
      type: 'get',
      dataType: 'jsonp',
      data: {
        keyword: request.term
      },
      success: function (data) {
        response($.map(data.data, 
          function (item) {
            return {
              label: item.stocknamecn,
              value: item.stocknamecn,
              code: item.stockname,
              maturityList: item.maturity_list,
              knockinList: item.knockin_list,
              knockoutList: item.knockout_list
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
    initSlider({
      maturityList: ui.item.maturityList,
      knockinList: ui.item.knockinList,
      knockoutList: ui.item.knockoutList
    });
    getShareInfo(ui.item.code); 
  }
});

searchButton.click(function () {
  var text = codeInput.val();
  if (!text) {
    toast.show('请输入要搜索的股票信息');
  } else {
    searchText(text);
  }
});

codeInput.keydown(function (event) { 
  if (event.keyCode === 13) {
    var text = codeInput.val();
    if (!text) {
      toast.show('请输入要搜索的股票信息');
    } else {
      searchText(text);
    }
  }
});

computeButton.click(function () {
  getIncome();
});

pdfButton.click(function () {
  exportPdf();
});

function getIncome () {
  $.get({
    url: "http://www.vcup.cn/api/income/output",
    type: 'get',
    dataType: 'jsonp',
    data: {
      stockname: stockname,
      knockinprice: sliderInput,
      knockoutprice: sliderOutput,
      maturity: dateRangeSelect
    },
    success: function (data) {
      outputRate = data.data[0].output;
      var rate = (outputRate * 100).toFixed(2) + '%';
      var exampleRate = (outputRate * 500 / 12).toFixed(2) + '%';
      computeIncome.html(rate);
      helpIncome1.html(rate);
      helpIncome2.html('例：第五个月敲出，收益 = ' + rate + ' * 5 / 12 = ' + exampleRate);
      helpIncome3.html(rate);
      helpIncome4.html(rate);
      helpOutput.html(sliderOutput + '%');
      helpInput.html(sliderInput + '%');
    }
  });
  getTableData(stockname);
}

function initSlider (option) {
  var knockoutList = option.knockoutList.split(',');
  var outputMin = parseInt(knockoutList[0]);
  var outputMax = parseInt(knockoutList[knockoutList.length - 1]);
  var outputStep = (outputMax - outputMin) / (knockoutList.length - 1);
  sliderOutput = parseInt(knockoutList[1]);
  $('#slider-output').slider({
    orientation: 'vertical',
    range: 'min',
    min: outputMin,
    max: outputMax,
    step: outputStep,
    value: sliderOutput,
    slide: function (event, ui) {
      sliderOutput = ui.value;
      updateMarkLine();
    },
    change: function (event, ui) {
      sliderOutput = ui.value;
      updateMarkLine();
    }
  }).slider('pips', {
    rest: 'label'
  });

  var knockinList = option.knockinList.split(',');
  var inputMin = parseInt(knockinList[0]);
  var inputMax = parseInt(knockinList[knockinList.length - 1]);
  var inputStep = (inputMax - inputMin) / (knockinList.length - 1);
  sliderInput = parseInt(knockinList[knockinList.length - 1]);
  $('#slider-input').slider({
    orientation: 'vertical',
    range: 'max',
    min: inputMin,
    max: inputMax,
    step: inputStep,
    value: sliderInput,
    slide: function (event, ui) {
      sliderInput = ui.value;
      updateMarkLine();
    },
    change: function (event, ui) {
      sliderInput = ui.value;
      updateMarkLine();
    }
  }).slider('pips', {
    rest: 'label'
  });

  var dateArray = [];
  var maturityList = option.maturityList.split(',');
  maturityList.forEach(function (item) {
    dateArray.push({
      label: parseInt(item) % 12 === 0
        ? (parseInt(item) / 12) + '年'
        : item + '个月',
      value: item
    })
  });
  initDateRange(dateArray);
}

function updateMarkLine () {
  KLineChart.setOption({
    series: [{
      markLine: {
        data: [
          { name: '敲入', xAxis: 0, yAxis: price * sliderInput / 100, symbol: 'circle'},
          { name: '敲出', xAxis: 0, yAxis: price * sliderOutput / 100, symbol: 'circle'}
        ]
      }
    }]
  });
}

function searchText (text) {
  $.get({
    url: "http://www.vcup.cn/api/income/stock",
    type: 'get',
    dataType: 'jsonp',
    data: {
      keyword: text
    },
    success: function (data) {
      if (!data.data.length) {
        toast.show('您搜索的股票不在可选择的范围中');
      }
      initSlider({
        maturityList: data.data[0].maturity_list,
        knockinList: data.data[0].knockin_list,
        knockoutList: data.data[0].knockout_list
      });
      getShareInfo(data.data[0].stockname);
    }
  });
}

function initDateRange (dateArray) {
  dateRange.empty();
  dateArray.forEach(function (item, index) {
    var html = index === 0
      ? '<div class="kl-button kl-button_active" data-value="' + item.value + '">' + item.label + '</div>'
      : '<div class="kl-button" data-value="' + item.value + '">' + item.label + '</div>'
    dateRange.append(html);
  });
  dateRangeSelect = dateArray[0].value;
  $('.kl-button').click(function () {
    $('.kl-button').removeClass('kl-button_active');
    $(this).addClass('kl-button_active');
    dateRangeSelect = $(this).data('value');
  });
}

function initTable (tableData) {
  dataTable.empty();
  var html = '<thead><tr><th width="32%"></th>';
  tableData.head.forEach(function (item) {
    html += '<th width="17%">' + item + '</th>';
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
  stockname = code;
  var arr = code.split('.');
  var reqCode = arr[1].toLowerCase() + arr[0];
  $.getScript(shareDataUrl + reqCode, function (data) {
    var arr = window['v_' + reqCode].split('~');
    name = arr[1] + ' (' + code + ')';
    price = parseFloat(arr[3]);
    getKLine(code, name, price * sliderInput / 100, price * sliderOutput / 100);
    getIncome();
  }).fail(function (err) {
    console.log(err);
  });
}

function getTableData (code) {
  var arr = code.split('.');
  var reqCode = (arr[1].toLowerCase() === 'sz' ? 'szse' : 'sse') + arr[0];
  var date = new Date();
  var start = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate() + '000000';
  var url = dailyDataUrl + '?code=' + reqCode + '&start=' + start + '&number=-1000&type=5&callback=callback'
  $.getScript(url);
}

var _name;
var _input;
var _output;

function getKLine (code, name, input, output) {
  // if (!code) {
  //   return;
  // }
  // var arr = code.split('.');
  // var reqCode = arr[1].toLowerCase() + arr[0];
  // $.getScript(weeklyDataUrl + reqCode + '.js', function () {
  //   weeklyData = formatData();
  //   drawChart(weeklyData, name, input, output);
  // }).fail(function (err) {
  //   console.log(err);
  // });

  if (!code) {
    return;
  }
  _name = name;
  _input = input;
  _output = output;
  var arr = code.split('.');
  var reqCode = (arr[1].toLowerCase() === 'sz' ? 'szse' : 'sse') + arr[0];
  var date = new Date();
  var start = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate() + '000000';
  var url = dailyDataUrl + '?code=' + reqCode + '&start=' + start + '&number=-1000&type=5&callback=klinecallback'
  $.getScript(url);
}

function klinecallback (res) {
  var list = res.Data[0];
  var dict = {};
  list.forEach(function (item, index) {
    dict[item[0]] = index;
  });
  var nowDate = number2date(list[list.length - 1][0]);
  var startDate = getStartDate(nowDate, 36, dict);
  var index = dict[date2number(startDate)];
  weeklyData = [];
  for (var i = index; i < list.length; i ++) {
    var date = number2date(list[i][0]);
    weeklyData.push([
      date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
      list[i][2] / 100,
      list[i][3] / 100,
      list[i][5] / 100,
      list[i][4] / 100,
      list[i][6] / 100
    ]);
  }
  drawChart(weeklyData, _name, _input, _output);
}

function drawChart (raw, name, input, output) {
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
      max: function (value) {
        return parseInt(value.max * 1.15);
      },
      min: function (value) {
        return parseInt(value.min * 0.65);
      }
    },
    dataZoom: [{
      type: 'inside',
      start: 0,
      end: 100
    }],
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
      name: 'K线图',
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

function isKnockout (months, maturity, buyprice, knockout, data) {
  var maturity_real = 0;
  var subData = data.slice(36 - months, 36 - months + maturity);
  for (var i = 0; i < subData.length; i++) {
    if (subData[i] >= buyprice * knockout / 100) {
      if (maturity_real == 0) {
        maturity_real = i + 1;
      }
    }
  }
  return maturity_real;
}

function isKnockin (buyprice, knockin, data) {
  is_knockin = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i] < buyprice * knockin / 100) {
      is_knockin = 1;
      return is_knockin;
    }
  }
  return is_knockin;
}

function computeResult (months, maturity, buyprice, saleprice, knockin, knockout, output, data, everydata) {
  var maturity_real = isKnockout(months, maturity, buyprice, knockout, data);
  var is_knockin_val = isKnockin(buyprice, knockin, everydata);
  var output_real;
  var loss;
  if (maturity_real == 0 && is_knockin_val == 0) {
    output_real = maturity / 12 * output;
    loss = 0;
  }
  if (maturity_real == 0 && is_knockin_val == 1) {
    output_real = 0;
    loss = (saleprice - buyprice) / buyprice >= 0 ? 0 : (saleprice - buyprice) / buyprice;
  }
  if (maturity_real >= 1) {
    output_real = maturity_real / 12 * output;
    loss = 0;
  }
  if (maturity > months) {
    return {
      output: 'N/A',
      outputReal: 'N/A',
      loss: 'N/A',
      isKnockin: 'N/A',
      isKnockout: 'N/A'
    };
  }
  return {
    output: (output * 100).toFixed(2).toString() + '%',
    outputReal: (output_real * 100).toFixed(2).toString() + '%',
    loss: (loss * 100).toFixed(2).toString() + '%',
    isKnockin: is_knockin_val == 0 ? '否' : '是',
    isKnockout: maturity_real == 0 ? '否' : '是'
  };
}

function number2date (num) {
  var str = num.toString();
  return new Date(str.substring(0, 4) + '-' + str.substring(4, 6) + '-' + str.substring(6, 8));
}

function date2number (date) {
  return date.getFullYear() * 10000000000 + (date.getMonth() + 1) * 100000000 + date.getDate() * 1000000;
}

function getStartDate (now, month, dict) {
  var start = new Date(now);
  start.setMonth(start.getMonth() - month);
  var count = 0;
  while (count < 30) {
    if (dict[date2number(start)] === void 0) {
      start.setDate(start.getDate() - 1);
      count ++;
    } else {
      break;
    }
  }
  return start;
}

function getEndDate (start, maturity, dict) {
  var end = new Date(start);
  end.setMonth(end.getMonth() + maturity);
  var count = 0;
  while (count < 30) {
    if (dict[date2number(end)] === void 0) {
      end.setDate(end.getDate() + 1);
      count ++;
    } else {
      break;
    }
  }
  return end;
}

function getPriceList (dict, nowDate) {
  var data = [];
  var startDate = getStartDate(nowDate, 36, dict);
  for (var i = 1; i <= 36; i ++) {
    var endDate = getEndDate(startDate, i, dict);
    data.push(dict[date2number(endDate)]);
  }
  return data;
}

function getEveryData (list, start, end) {
  var startNumber = date2number(start);
  var endNumber = date2number(end);
  var startIndex = 0;
  var data = [];
  for (startIndex = 0; startIndex < list.length; startIndex++) {
    if (list[startIndex][0] >= startNumber) {
      break;
    }
  }
  for (; startIndex < list.length; startIndex++) {
    if (list[startIndex][0] > endNumber) {
      break;
    }
    data.push(list[startIndex][3]);
  }
  return data;
}

function callback (res) {
  var list = res.Data[0];
  var dict = {};
  list.forEach(function (item) {
    dict[item[0]] = item[3];
  });
  var nowDate = number2date(list[list.length - 1][0]);
  var priceData = getPriceList(dict, nowDate);
  var maturity = parseInt(dateRangeSelect);
  var months = [6, 12, 24, 36];
  var results = [];
  months.forEach(function (month) {
    var startDate = getStartDate(nowDate, month, dict);
    var endDate = getEndDate(startDate, maturity, dict);
    var everyData = getEveryData(list, startDate, endDate);
    var result = computeResult(month, maturity, dict[date2number(startDate)], dict[date2number(endDate)], sliderInput, sliderOutput, outputRate, priceData, everyData);
    results.push(result);
  });
  var tableData = {
    head: ['6个月', '1年', '2年', '3年'],
    title: ['最高年化收益率:', '实际收益率:', '亏损:', '曾敲入:', '曾敲出:'],
    data: [[], [], [], [], []]
  };
  for (var i = 0; i < results.length; i ++) {
    tableData.data[0].push(results[i].output);
    tableData.data[1].push(results[i].outputReal);
    tableData.data[2].push(results[i].loss);
    tableData.data[3].push(results[i].isKnockin);
    tableData.data[4].push(results[i].isKnockout);
  }
  initTable(tableData);
}

function exportPdf () {
  $('html, body').scrollTop(0);
  html2canvas(document.getElementById('pdf-export'), {
    taintTest: true,
    useCORS: true, 
    background: '#fff',
    onrendered: function (canvas) {
      var contentWidth = canvas.width;
      var contentHeight = canvas.height;
      var pageHeight = contentWidth / 592.28 * 841.89;
      var leftHeight = contentHeight;
      var position = 0;
      var imgWidth = 595.28;
      var imgHeight = 592.28 / contentWidth * contentHeight;
      var pageData = canvas.toDataURL('image/png', 1.0);
      var pdf = new jsPDF('', 'pt', 'a4');
      if (leftHeight < pageHeight) {
	      pdf.addImage(pageData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
	      while (leftHeight > 0) {
          pdf.addImage(pageData, 'PNG', 0, position, imgWidth, imgHeight);
          leftHeight -= pageHeight;
          position -= 841.89;
          if (leftHeight > 0) {
            pdf.addPage();
          }
	      }
      }
      pdf.save('收益.pdf');
    }
  });
}