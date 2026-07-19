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

const widgetMap = Object.fromEntries(WIDGET_DEFINITIONS.map((w) => [w.id, w]));

function SortableWidgetToggle({ id, visible, onToggle }) {
  const widget = widgetMap[id];
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

  if (!widget) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget-toggle${isDragging ? ' widget-toggle--dragging' : ''}`}
    >
      <button
        type="button"
        className="widget-toggle__drag"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${widget.title}`}
        title="Drag to reorder"
      >
        ⠿
      </button>
      <label className="widget-toggle__content">
        <input
          type="checkbox"
          checked={visible[id] ?? false}
          onChange={() => onToggle(id)}
        />
        <span className="widget-toggle__info">
          <span className="widget-toggle__name">{widget.title}</span>
          <span className="widget-toggle__desc">{widget.description}</span>
        </span>
      </label>
    </div>
  );
}

export function DashboardCustomizer({ order, visible, onToggle, onReorder, onClose, onReset }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const widgetOrder = order.filter((id) => widgetMap[id]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgetOrder.indexOf(active.id);
    const newIndex = widgetOrder.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...widgetOrder];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id);

    onReorder(newOrder);
  };

  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Customize Dashboard</h2>
        <p>Choose which widgets to display. Drag below to reorder.</p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
            <div className="customizer-list">
              {widgetOrder.map((id) => (
                <SortableWidgetToggle
                  key={id}
                  id={id}
                  visible={visible}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="customizer-actions">
          <button type="button" className="btn btn--primary" onClick={onReset}>
            Reset to default
          </button>
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
