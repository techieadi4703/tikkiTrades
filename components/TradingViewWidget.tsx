'use client';

import React, { memo, useMemo } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import {cn} from "@/lib/utils";
import { useTheme } from "next-themes";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
    const { resolvedTheme } = useTheme();

    const dynamicConfig = useMemo(() => {
        const isLight = resolvedTheme === 'light';
        return {
            ...config,
            colorTheme: isLight ? 'light' : 'dark',
            backgroundColor: isLight ? '#ffffff' : (config.backgroundColor || '#141414'),
            gridColor: isLight ? '#f3f4f6' : (config.gridColor || '#141414'),
        };
    }, [config, resolvedTheme]);

    const containerRef = useTradingViewWidget(scriptUrl, dynamicConfig, height);

    return (
        <div className="w-full">
            {title && <h3 className="font-semibold text-2xl text-foreground mb-5">{title}</h3>}
            <div className={cn('tradingview-widget-container', className)} ref={containerRef}>
                <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }} />
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);