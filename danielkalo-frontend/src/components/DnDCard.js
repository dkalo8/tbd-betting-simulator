import React, { useEffect, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import "./DnDCard.css";

const ItemType = "CARD";

const DndCard = ({ index, moveCard, children }) => {
  const ref = useRef(null);

  // Keep existing number styling
  const numberClass = index + 1 < 10 
    ? "dndNumber dndNumberOneDigit" 
    : "dndNumber dndNumberTwoDigit";

  const [, drop] = useDrop({
    accept: ItemType,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemType,
    item: { index },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  // Avoid dragging preview bug
  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className="dndCard mb-3"
      style={{ width: "100%", opacity: isDragging ? 0.5 : 1, position: "relative" }}
    >
      <div className={numberClass}>{index + 1}</div>
      {children}
    </div>
  );
};

export default DndCard;