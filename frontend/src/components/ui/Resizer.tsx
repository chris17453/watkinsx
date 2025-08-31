import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

const ResizerBar = styled.div<{ orientation: 'horizontal' | 'vertical', isDragging: boolean }>`
  background-color: var(--border-color);
  cursor: ${props => props.orientation === 'horizontal' ? 'col-resize' : 'row-resize'};
  transition: background-color 0.2s ease;
  position: relative;
  z-index: 10;
  
  ${props => props.orientation === 'horizontal' ? `
    width: 4px;
    min-width: 4px;
    &:hover {
      background-color: var(--primary-color);
      width: 6px;
      min-width: 6px;
    }
  ` : `
    height: 4px;
    min-height: 4px;
    &:hover {
      background-color: var(--primary-color);
      height: 6px;
      min-height: 6px;
    }
  `}
  
  ${props => props.isDragging && `
    background-color: var(--primary-color) !important;
    ${props.orientation === 'horizontal' ? 'width: 6px !important; min-width: 6px !important;' : 'height: 6px !important; min-height: 6px !important;'}
  `}

  &::before {
    content: '';
    position: absolute;
    ${props => props.orientation === 'horizontal' ? `
      top: 0;
      bottom: 0;
      left: -2px;
      right: -2px;
    ` : `
      left: 0;
      right: 0;
      top: -2px;
      bottom: -2px;
    `}
  }
`;

interface ResizerProps {
  orientation: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

const Resizer: React.FC<ResizerProps> = ({ orientation, onResize, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos(orientation === 'horizontal' ? e.clientX : e.clientY);
  }, [orientation]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentPos = orientation === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - startPos;
    
    onResize(delta);
    setStartPos(currentPos);
  }, [isDragging, startPos, orientation, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, orientation]);

  return (
    <ResizerBar
      orientation={orientation}
      isDragging={isDragging}
      onMouseDown={handleMouseDown}
      className={className}
    />
  );
};

export default Resizer;