'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, LayoutGrid, Unlock, Check } from 'lucide-react';
import { toast } from 'sonner';
import TradingViewWidget from '@/components/TradingViewWidget';
import WelcomeBanner from '@/components/WelcomeBanner';
import { saveDashboardWidgetOrder } from '@/lib/actions/preferences.actions';
import {
  HEATMAP_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  MARKET_OVERVIEW_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
} from '@/lib/constants';

interface WidgetItem {
  id: string;
  title: string;
  scriptTag: string;
  config: any;
  height: number;
  colSpan: string;
}

const ALL_WIDGETS: Record<string, WidgetItem> = {
  'market-overview': {
    id: 'market-overview',
    title: 'Market Overview',
    scriptTag: 'market-overview.js',
    config: MARKET_OVERVIEW_WIDGET_CONFIG,
    height: 600,
    colSpan: 'md:col-span-1 xl:col-span-1',
  },
  'heatmap': {
    id: 'heatmap',
    title: 'Stock Heatmap',
    scriptTag: 'stock-heatmap.js',
    config: HEATMAP_WIDGET_CONFIG,
    height: 600,
    colSpan: 'md:col-span-1 xl:col-span-2',
  },
  'top-stories': {
    id: 'top-stories',
    title: 'Top Stories',
    scriptTag: 'timeline.js',
    config: TOP_STORIES_WIDGET_CONFIG,
    height: 600,
    colSpan: 'md:col-span-1 xl:col-span-1',
  },
  'market-data': {
    id: 'market-data',
    title: 'Market Data',
    scriptTag: 'market-quotes.js',
    config: MARKET_DATA_WIDGET_CONFIG,
    height: 600,
    colSpan: 'md:col-span-1 xl:col-span-2',
  },
};

const DEFAULT_ORDER = ['market-overview', 'heatmap', 'top-stories', 'market-data'];

function SortableWidget({ widget, isEditing }: { widget: WidgetItem; isEditing: boolean }) {
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${widget.colSpan} ${isDragging ? 'scale-[1.02]' : ''} transition-transform`}
    >
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-grab active:cursor-grabbing shadow-lg"
        >
          <GripVertical className="w-3 h-3" />
          Drag to reorder
        </div>
      )}
      <div className={`${isEditing ? 'ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-background rounded-xl' : ''} transition-all`}>
        <TradingViewWidget
          title={widget.title}
          scriptUrl={`${scriptUrl}${widget.scriptTag}`}
          config={widget.config}
          className={widget.id === 'market-overview' ? 'custom-chart' : ''}
          height={widget.height}
        />
      </div>
    </div>
  );
}

export default function CustomizableDashboard({
  userName,
  savedOrder,
}: {
  userName: string;
  savedOrder?: string[];
}) {
  const [widgetOrder, setWidgetOrder] = useState<string[]>(
    savedOrder && savedOrder.length === 4 ? savedOrder : DEFAULT_ORDER
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const widgets = widgetOrder.map((id) => ALL_WIDGETS[id]).filter(Boolean);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.findIndex((i) => i === active.id);
        const newIndex = items.findIndex((i) => i === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveDashboardWidgetOrder(widgetOrder);
    setIsSaving(false);
    if (success) {
      toast.success('Dashboard layout saved!');
      setIsEditing(false);
    } else {
      toast.error('Failed to save layout');
    }
  };

  // Split into rows
  const firstRow = widgets.slice(0, 2);
  const secondRow = widgets.slice(2, 4);

  return (
    <div className="flex min-h-screen home-wrapper">
      <WelcomeBanner userName={userName} />

      {/* Edit Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-end mb-4 w-full gap-2"
      >
        {isEditing && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-md"
          >
            <Check className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Layout'}
          </motion.button>
        )}
        <button
          onClick={() => {
            if (isEditing) {
              setIsEditing(false); // Cancel without saving
            } else {
              setIsEditing(true);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            isEditing
              ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
              : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <LayoutGrid className="w-4 h-4" /> Customize
            </>
          )}
        </button>
      </motion.div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          <section className="grid w-full gap-8 home-section">
            {firstRow.map((widget) => (
              <SortableWidget key={widget.id} widget={widget} isEditing={isEditing} />
            ))}
          </section>
          <section className="grid w-full gap-8 home-section">
            {secondRow.map((widget) => (
              <SortableWidget key={widget.id} widget={widget} isEditing={isEditing} />
            ))}
          </section>
        </SortableContext>
      </DndContext>
    </div>
  );
}
