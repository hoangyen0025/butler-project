import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WIDGET_DEFINITIONS } from '../hooks/useDashboardLayout';
import { CollapseButton } from './CollapsibleList';
import { EmptyWidgetsState } from './StateViews';
import './DraggableDashboard.css';

const titleMap = Object.fromEntries(WIDGET_DEFINITIONS.map((w) => [w.id, w.title]));

function SortableDashboardWidget({ id, title, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget${collapsed ? ' widget--collapsed' : ''}${
        isDragging ? ' widget--dragging' : ''
      }`}
    >
      <div className="widget__header">
        <button
          type="button"
          className="widget__drag-handle"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${title}`}
          title="Drag to reorder"
        >
          ⠿
        </button>
        <h3 className="widget__title">{title}</h3>
        <CollapseButton
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />
      </div>
      {!collapsed && <div className="widget__body">{children}</div>}
    </div>
  );
}

export function DraggableDashboard({ widgetIds, renderWidget, onReorder, onCustomize }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgetIds.indexOf(active.id);
    const newIndex = widgetIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...widgetIds];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id);

    onReorder(newOrder);
  };

  if (widgetIds.length === 0) {
    return <EmptyWidgetsState onCustomize={onCustomize} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgetIds} strategy={verticalListSortingStrategy}>
        <div className="dashboard">
          {widgetIds.map((id) => (
            <SortableDashboardWidget key={id} id={id} title={titleMap[id]}>
              {renderWidget(id)}
            </SortableDashboardWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
