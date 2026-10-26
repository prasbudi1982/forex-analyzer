'use client';
import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

interface Props {
  data: any[];
  levels?: { resistance: number[]; support: number[] } | null;
  patterns?: any[] | null;
  indicators?: any;
  // fvgs dihapus dari Props
}

export default function CandleChart({ data, levels, patterns, indicators }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  const priceLinesRef = useRef<any[]>([]);
  const activeSeriesRef = useRef<ISeriesApi<any>[]>([]); 

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, { 
      width: chartRef.current.clientWidth, height: 450, 
      layout: { background: { color: 'transparent' }, textColor: '#d1d4dc', fontSize: 11 },
      grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
      crosshair: { mode: 0 },
      handleScroll: { pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      timeScale: { rightOffset: 5, barSpacing: 6, fixLeftEdge: true },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 }, entireTextOnly: true },
    });
    
    chartApiRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      priceFormat: { type: 'price', precision: 5, minMove: 0.00001 }
    });
    candleSeriesRef.current = candlestickSeries;

    const handleResize = () => chart.applyOptions({ width: chartRef.current?.clientWidth });
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, []);

  useEffect(() => {
    if (candleSeriesRef.current && data.length > 0) {
      candleSeriesRef.current.setData(data);
    }
  }, [data]);

  // ... (fungsi calculateEMA, calculateRSI, calculateMACD, calculateBB tetap sama) ...
  const calculateEMA = (candleData: any[], period = 20) => {
    const k = 2 / (period + 1); let ema = candleData[0].close; const result = [];
    for (let i = 0; i < candleData.length; i++) {
      if (i === 0) { ema = candleData[i].close; } else { ema = (candleData[i].close - ema) * k + ema; }
      result.push({ time: candleData[i].time, value: ema });
    }
    return result;
  };
  const calculateRSI = (candleData: any[], period = 14) => {
    const result = []; let avgGain = 0, avgLoss = 0;
    for (let i = 0; i < candleData.length; i++) {
      if (i === 0) { result.push({ time: candleData[i].time }); continue; }
      const change = candleData[i].close - candleData[i - 1].close;
      const gain = Math.max(change, 0), loss = Math.max(-change, 0);
      if (i < period) { avgGain += gain; avgLoss += loss; result.push({ time: candleData[i].time }); } 
      else if (i === period) {
        avgGain = (avgGain + gain) / period; avgLoss = (avgLoss + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss; result.push({ time: candleData[i].time, value: 100 - (100 / (1 + rs)) });
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period; avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss; result.push({ time: candleData[i].time, value: 100 - (100 / (1 + rs)) });
      }
    }
    return result;
  };
  const calculateMACD = (candleData: any[], fast = 12, slow = 26, signal = 9) => {
    const emaFast = calculateEMA(candleData, fast).map(d => d.value || 0);
    const emaSlow = calculateEMA(candleData, slow).map(d => d.value || 0);
    const macdLine = [];
    for (let i = 0; i < candleData.length; i++) {
      if (i < slow - 1) { macdLine.push({ time: candleData[i].time }); } else { macdLine.push({ time: candleData[i].time, value: emaFast[i] - emaSlow[i] }); }
    }
    const signalLine = []; let emaSignal = 0; const k = 2 / (signal + 1); let startIdx = slow - 1;
    for (let i = 0; i < candleData.length; i++) {
      if (i < startIdx + signal - 1) { signalLine.push({ time: candleData[i].time }); } 
      else if (i === startIdx + signal - 1) {
        let sum = 0; for (let j = startIdx; j <= i; j++) sum += macdLine[j].value || 0;
        emaSignal = sum / signal; signalLine.push({ time: candleData[i].time, value: emaSignal });
      } else {
        emaSignal = ((macdLine[i].value || 0) - emaSignal) * k + emaSignal; signalLine.push({ time: candleData[i].time, value: emaSignal });
      }
    }
    return { macd: macdLine, signal: signalLine };
  };
  const calculateBB = (candleData: any[], period = 20, multiplier = 2) => {
    const upper = [], middle = [], lower = [];
    for (let i = 0; i < candleData.length; i++) {
      if (i < period - 1) { upper.push({ time: candleData[i].time }); middle.push({ time: candleData[i].time }); lower.push({ time: candleData[i].time }); continue; }
      let sum = 0; for (let j = 0; j < period; j++) sum += candleData[i - j].close;
      const sma = sum / period;
      let varianceSum = 0; for (let j = 0; j < period; j++) varianceSum += Math.pow(candleData[i - j].close - sma, 2);
      const stdDev = Math.sqrt(varianceSum / period);
      upper.push({ time: candleData[i].time, value: sma + (multiplier * stdDev) }); middle.push({ time: candleData[i].time, value: sma }); lower.push({ time: candleData[i].time, value: sma - (multiplier * stdDev) });
    }
    return { upper, middle, lower };
  };

  useEffect(() => {
    const chart = chartApiRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries || data.length === 0) return;

    try {
      priceLinesRef.current.forEach(line => { try { candleSeries.removePriceLine(line); } catch (e) {} });
      priceLinesRef.current = [];
      activeSeriesRef.current.forEach(series => { try { chart.removeSeries(series); } catch (e) {} });
      activeSeriesRef.current = [];
      candleSeries.setMarkers([]);
    } catch (e) {}

    if (levels) {
      levels.resistance.slice(-2).forEach((price) => { const line = candleSeries.createPriceLine({ price, color: '#ef5350', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'R' }); priceLinesRef.current.push(line); });
      levels.support.slice(-2).forEach((price) => { const line = candleSeries.createPriceLine({ price, color: '#26a69a', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'S' }); priceLinesRef.current.push(line); });
    }
    if (patterns && patterns.length > 0) {
      const markers = patterns.map((p) => {
        const candle = data[p.i];
        if (!candle) return null;
        return { time: candle.time, position: p.dir === 'bull' ? 'belowBar' : 'aboveBar', color: p.dir === 'bull' ? '#26a69a' : '#ef5350', shape: p.dir === 'bull' ? 'arrowUp' : 'arrowDown', text: p.pattern.replace('_', ' ').toUpperCase() };
      }).filter(Boolean);
      candleSeries.setMarkers(markers as any);
    }
    if (indicators) {
      if (indicators.EMA) { const emaData = calculateEMA(data, 20); const emaSeries = chart.addLineSeries({ color: '#2962FF', lineWidth: 1.5, title: 'EMA 20', priceFormat: { type: 'price', precision: 5, minMove: 0.00001 } }); emaSeries.setData(emaData as any); activeSeriesRef.current.push(emaSeries); }
      if (indicators.RSI) { const rsiData = calculateRSI(data, 14); const rsiSeries = chart.addLineSeries({ color: '#E91E63', lineWidth: 1.5, priceScaleId: 'rsi', title: 'RSI 14' }); chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } }); rsiSeries.setData(rsiData as any); rsiSeries.createPriceLine({ price: 70, color: '#ef5350', lineWidth: 1, lineStyle: 1, axisLabelVisible: false }); rsiSeries.createPriceLine({ price: 30, color: '#26a69a', lineWidth: 1, lineStyle: 1, axisLabelVisible: false }); activeSeriesRef.current.push(rsiSeries); }
      if (indicators.MACD) { const { macd, signal } = calculateMACD(data); const macdSeries = chart.addLineSeries({ color: '#2962FF', lineWidth: 1.5, priceScaleId: 'macd', title: 'MACD' }); chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } }); macdSeries.setData(macd as any); const signalSeries = chart.addLineSeries({ color: '#FF9800', lineWidth: 1.5, priceScaleId: 'macd', title: 'Signal' }); signalSeries.setData(signal as any); activeSeriesRef.current.push(macdSeries, signalSeries); }
      if (indicators.BB) { const { upper, middle, lower } = calculateBB(data, 20, 2); const upperSeries = chart.addLineSeries({ color: '#4CAF50', lineWidth: 1, title: 'BB Upper', priceFormat: { type: 'price', precision: 5, minMove: 0.00001 } }); const lowerSeries = chart.addLineSeries({ color: '#4CAF50', lineWidth: 1, title: 'BB Lower', priceFormat: { type: 'price', precision: 5, minMove: 0.00001 } }); const middleSeries = chart.addLineSeries({ color: '#FF9800', lineWidth: 1, lineStyle: 2, title: 'BB Mid', priceFormat: { type: 'price', precision: 5, minMove: 0.00001 } }); upperSeries.setData(upper as any); lowerSeries.setData(lower as any); middleSeries.setData(middle as any); activeSeriesRef.current.push(upperSeries, lowerSeries, middleSeries); }
    }
  }, [patterns, levels, indicators, data]);

  return <div ref={chartRef} style={{ width: '100%' }} />;
}
