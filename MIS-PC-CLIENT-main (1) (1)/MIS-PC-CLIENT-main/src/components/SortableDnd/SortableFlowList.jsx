import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tag, Button } from "antd";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

const SCAN_MODE_COLOR = { SINGLE: "default", GROUP_CREATE: "purple", GROUP_SCAN: "geekblue" };

const SortableRow = ({ item, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    background: "#fff",
    border: "1px solid #F1F5F9",
    borderRadius: 10,
    marginBottom: 8,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <span {...attributes} {...listeners} style={{ cursor: "grab", color: "#94A3B8", display: "flex" }}>
        <GripVertical size={16} />
      </span>
      <span style={{ fontWeight: 600, color: "#0F172A", width: 28 }}>{item.sequenceNo}</span>
      <span style={{ flex: 1 }}>{item.stageName}</span>
      <Tag color={SCAN_MODE_COLOR[item.scanMode] || "default"}>{item.scanMode}</Tag>
      {item.isExternalDependency && (
        <Tag color="volcano">
          {item.externalSource || "External"}{item.externalMachineType ? ` [${item.externalMachineType}]` : ""}
        </Tag>
      )}
      {item.machineCode && <Tag color="blue">{item.machineCode}</Tag>}
      <Button size="small" type="text" icon={<Pencil size={14} />} onClick={() => onEdit(item)} />
      <Button size="small" type="text" danger icon={<Trash2 size={14} />} onClick={() => onDelete(item)} />
    </div>
  );
};

// items: stages for ONE product, already sorted by sequenceNo.
// onReorder(productId, orderedIds) fires after a successful drag.
const SortableFlowList = ({ productId, lineId, items, onEdit, onDelete, onReorder }) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    onReorder(productId, lineId, reordered.map((i) => i.id)); // parent handles optimistic update + API call
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default SortableFlowList;