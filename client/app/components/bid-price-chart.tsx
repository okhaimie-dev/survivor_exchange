'use client';

import { useMemo } from 'react';
import { formatUSDCompact } from '../lib/utils/formatters';

type BidPriceChartProps = {
    width?: number;
    height?: number;
    className?: string;
};

export default function BidPriceChart({ width = 200, height = 80, className = '' }: BidPriceChartProps) {
    const dataPoints = useMemo(() => {
        const points = 10;
        const baseValue = 500;
        const variation = 200;
        
        return Array.from({ length: points }, (_, i) => {
            const progress = i / (points - 1);
            const value = baseValue + (progress * variation) + (Math.sin(progress * Math.PI * 2) * 30);
            return {
                x: i,
                y: value,
            };
        });
    }, []);

    const maxY = Math.max(...dataPoints.map(p => p.y));
    const minY = Math.min(...dataPoints.map(p => p.y));
    const rangeY = maxY - minY || 1;

    const axisLabelWidth = width > 300 ? 60 : 55;
    const axisLabelHeight = 15;
    const rightPadding = width > 300 ? 70 : 8;
    const padding = { top: 8, right: rightPadding, bottom: axisLabelHeight + 4, left: axisLabelWidth + 8 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const numYLabels = width > 300 ? 4 : 3;
    const yLabels = useMemo(() => {
        return Array.from({ length: numYLabels }, (_, i) => {
            const value = minY + (rangeY * (numYLabels - 1 - i) / (numYLabels - 1));
            return value;
        });
    }, [minY, rangeY, numYLabels]);

    const xLabels = useMemo(() => {
        const indices = [0, Math.floor(dataPoints.length / 2), dataPoints.length - 1];
        return indices.map(i => i);
    }, [dataPoints.length]);

    const points = dataPoints.map((point, index) => {
        const x = padding.left + (index / (dataPoints.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((point.y - minY) / rangeY) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    const areaPath = `M ${padding.left},${padding.top + chartHeight} L ${points.split(' ').join(' L ')} L ${padding.left + chartWidth},${padding.top + chartHeight} Z`;

    const latestValue = dataPoints[dataPoints.length - 1].y;
    const startingValue = dataPoints[0].y;
    const latestX = padding.left + chartWidth;
    const latestY = padding.top + chartHeight - ((latestValue - minY) / rangeY) * chartHeight;
    
    const changePercent = ((latestValue - startingValue) / startingValue) * 100;
    const isPositive = changePercent >= 0;

    return (
        <div className={className}>
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible"
            >
                <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(50,255,52)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(50,255,52)" stopOpacity="0.05" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                {yLabels.map((label, index) => {
                    const y = padding.top + (chartHeight * (numYLabels - 1 - index) / (numYLabels - 1));
                    return (
                        <line
                            key={`grid-${index}`}
                            x1={padding.left}
                            y1={y}
                            x2={padding.left + chartWidth}
                            y2={y}
                            stroke="rgb(186,255,188)"
                            strokeWidth="0.5"
                            strokeOpacity="0.15"
                        />
                    );
                })}
                
                <path
                    d={areaPath}
                    fill="url(#chartGradient)"
                    className="transition-opacity duration-200"
                />
                
                <polyline
                    points={points}
                    fill="none"
                    stroke="rgb(50,255,52)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    className="transition-all duration-200"
                />
                
                {dataPoints.map((_, index) => {
                    const x = padding.left + (index / (dataPoints.length - 1)) * chartWidth;
                    const y = padding.top + chartHeight - ((dataPoints[index].y - minY) / rangeY) * chartHeight;
                    return (
                        <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="2.5"
                            fill="rgb(50,255,52)"
                            className="transition-all duration-200"
                        />
                    );
                })}
                
                {yLabels.map((label, index) => {
                    const y = padding.top + (chartHeight * (numYLabels - 1 - index) / (numYLabels - 1));
                    return (
                        <text
                            key={`y-label-${index}`}
                            x={padding.left - 12}
                            y={y + 4}
                            textAnchor="end"
                            className="text-[9px] font-orbitron fill-[rgb(186,255,188)]/60"
                            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                        >
                            {formatUSDCompact(label)}
                        </text>
                    );
                })}
                
                {xLabels.map((index) => {
                    const x = padding.left + (index / (dataPoints.length - 1)) * chartWidth;
                    const label = index === 0 ? 'Start' : index === dataPoints.length - 1 ? 'Now' : '';
                    return (
                        <text
                            key={`x-label-${index}`}
                            x={x}
                            y={height - 4}
                            textAnchor="middle"
                            className="text-[9px] font-orbitron fill-[rgb(186,255,188)]/60"
                            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                        >
                            {label}
                        </text>
                    );
                })}
                
                {(() => {
                    const labelText = formatUSDCompact(latestValue);
                    const labelWidth = labelText.length * 5.5;
                    const horizontalPadding = 12;
                    const verticalPadding = 6;
                    const labelX = Math.min(latestX - labelWidth / 2, width - labelWidth / 2 - horizontalPadding);
                    const labelY = latestY < chartHeight / 2 ? latestY - 12 : latestY + 20;
                    
                    return (
                        <g>
                            <rect
                                x={labelX - labelWidth / 2 - horizontalPadding}
                                y={labelY - 10 - verticalPadding / 2}
                                width={labelWidth + (horizontalPadding * 2)}
                                height={14 + verticalPadding}
                                rx={5}
                                fill="rgba(0,0,0,0.8)"
                                stroke="rgb(50,255,52)"
                                strokeWidth="0.5"
                                strokeOpacity="0.6"
                            />
                            <text
                                x={labelX}
                                y={labelY}
                                textAnchor="middle"
                                className="text-[10px] font-orbitron fill-[rgb(50,255,52)] font-semibold"
                                style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                            >
                                {labelText}
                            </text>
                        </g>
                    );
                })()}
                
                {(() => {
                    const statsOffset = width > 300 ? 12 : 24;
                    const statsX = padding.left + chartWidth + statsOffset;
                    const statsStartY = padding.top + (width > 300 ? 4 : 2);
                    const labelSpacing = width > 300 ? 14 : 12;
                    const sectionSpacing = width > 300 ? 24 : 20;
                    
                    return (
                        <g>
                            <text
                                x={statsX}
                                y={statsStartY}
                                textAnchor="start"
                                className="text-[8px] font-orbitron fill-[rgb(186,255,188)]/50 uppercase tracking-wider"
                                style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                            >
                                Change
                            </text>
                            <text
                                x={statsX}
                                y={statsStartY + labelSpacing}
                                textAnchor="start"
                                className="text-[11px] font-orbitron font-semibold"
                                fill={isPositive ? "rgb(50,255,52)" : "rgb(255,100,100)"}
                                style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                            >
                                {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
                            </text>
                            
                            <text
                                x={statsX}
                                y={statsStartY + sectionSpacing + labelSpacing}
                                textAnchor="start"
                                className="text-[8px] font-orbitron fill-[rgb(186,255,188)]/50 uppercase tracking-wider"
                                style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                            >
                                Start
                            </text>
                            <text
                                x={statsX}
                                y={statsStartY + sectionSpacing + (labelSpacing * 2)}
                                textAnchor="start"
                                className="text-[10px] font-orbitron fill-[rgb(186,255,188)]/70"
                                style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                            >
                                {formatUSDCompact(startingValue)}
                            </text>
                        </g>
                    );
                })()}
            </svg>
        </div>
    );
}

