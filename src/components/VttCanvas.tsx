import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text as KonvaText, Group, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ZoomIn, ZoomOut, RotateCcw, Ruler, MousePointer, Move, Scale, Box, Heart, Shield, Swords, Crosshair, X } from 'lucide-react';

interface VttCanvasProps {
  is3dView?: boolean;
  onToggle3dView?: () => void;
}

export const VttCanvas: React.FC<VttCanvasProps> = ({
  is3dView = false,
  onToggle3dView,
}) => {
  const { view3dAngle } = useSettingsStore();
  const {
    boardConfig,
    tokens,
    selectedTokenId,
    activeTool,
    rulerMeasurement,
    selectToken,
    moveToken,
    setBoardConfig,
    setRulerMeasurement,
    calibrateScale,
  } = useGameStore();

  const stageRef = useRef<any>(null);
  const [stageScale, setStageScale] = useState<number>(1.0);
  const [stagePos, setStagePos] = useState<{ x: number; y: number }>({ x: 20, y: 20 });

  // Battlemap Image Loading
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (boardConfig.mapImageUrl) {
      const img = new Image();
      img.src = boardConfig.mapImageUrl;
      img.onload = () => setBgImage(img);
    } else {
      setBgImage(null);
    }
  }, [boardConfig.mapImageUrl]);

  // Board dimensions in pixels
  const ppi = boardConfig.pixelsPerInch;
  const boardWidthPx = boardConfig.widthFeet * 12 * ppi;
  const boardLengthPx = boardConfig.lengthFeet * 12 * ppi;

  // Ruler & Calibration local drawing state
  const [isDrawingRuler, setIsDrawingRuler] = useState<boolean>(false);
  const [rulerStartPx, setRulerStartPx] = useState<{ x: number; y: number } | null>(null);
  const [rulerEndPx, setRulerEndPx] = useState<{ x: number; y: number } | null>(null);

  const [calibStartPx, setCalibStartPx] = useState<{ x: number; y: number } | null>(null);
  const [calibEndPx, setCalibEndPx] = useState<{ x: number; y: number } | null>(null);
  const [showCalibModal, setShowCalibModal] = useState<boolean>(false);
  const [calibInputInches, setCalibInputInches] = useState<string>('36');

  // Handle stage zoom with wheel
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.3, Math.min(4.0, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setStageScale(clampedScale);
    setStagePos(newPos);
  };

  // Convert Stage pointer pixel position to real inch coordinates
  const getPointerInches = (): { xInches: number; yInches: number; xPx: number; yPx: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    const xPx = (pointer.x - stage.x()) / stage.scaleX();
    const yPx = (pointer.y - stage.y()) / stage.scaleY();

    const xInches = Math.max(0, Math.min(boardConfig.widthFeet * 12, xPx / ppi));
    const yInches = Math.max(0, Math.min(boardConfig.lengthFeet * 12, yPx / ppi));

    return { xInches, yInches, xPx, yPx };
  };

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // If clicked on stage background
    if (e.target === e.target.getStage() || e.target.name() === 'bg-rect') {
      selectToken(null);
    }

    const ptr = getPointerInches();
    if (!ptr) return;

    if (activeTool === 'ruler') {
      setIsDrawingRuler(true);
      setRulerStartPx({ x: ptr.xPx, y: ptr.yPx });
      setRulerEndPx({ x: ptr.xPx, y: ptr.yPx });
    } else if (activeTool === 'calibrate') {
      if (!calibStartPx) {
        setCalibStartPx({ x: ptr.xPx, y: ptr.yPx });
        setCalibEndPx({ x: ptr.xPx, y: ptr.yPx });
      } else {
        setCalibEndPx({ x: ptr.xPx, y: ptr.yPx });
        setShowCalibModal(true);
      }
    }
  };

  const handleStageMouseMove = () => {
    const ptr = getPointerInches();
    if (!ptr) return;

    if (activeTool === 'ruler' && isDrawingRuler && rulerStartPx) {
      setRulerEndPx({ x: ptr.xPx, y: ptr.yPx });

      const dxInches = (ptr.xPx - rulerStartPx.x) / ppi;
      const dyInches = (ptr.yPx - rulerStartPx.y) / ppi;
      const distInches = Math.sqrt(dxInches * dxInches + dyInches * dyInches);

      setRulerMeasurement({
        startInches: { x: rulerStartPx.x / ppi, y: rulerStartPx.y / ppi },
        endInches: { x: ptr.xInches, y: ptr.yInches },
        distanceInches: Math.round(distInches * 10) / 10,
      });
    } else if (activeTool === 'calibrate' && calibStartPx && !showCalibModal) {
      setCalibEndPx({ x: ptr.xPx, y: ptr.yPx });
    }
  };

  const handleStageMouseUp = () => {
    if (activeTool === 'ruler' && isDrawingRuler) {
      setIsDrawingRuler(false);
    }
  };

  const handleConfirmCalibration = () => {
    const inches = parseFloat(calibInputInches);
    if (calibStartPx && calibEndPx && !isNaN(inches) && inches > 0) {
      calibrateScale(calibStartPx, calibEndPx, inches);
    }
    setShowCalibModal(false);
    setCalibStartPx(null);
    setCalibEndPx(null);
  };

  // Image Upload Handler
  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBoardConfig({ mapImageUrl: url });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-stone-950 overflow-hidden select-none">

      {/* VTT Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-stone-900/90 p-1.5 rounded-lg border border-amber-900/40 backdrop-blur-md shadow-xl text-xs text-stone-200">
        <button
          onClick={() => useGameStore.getState().setActiveTool('select')}
          className={`p-2 rounded flex items-center gap-1 font-semibold transition-colors ${
            activeTool === 'select' ? 'bg-amber-800 text-amber-100' : 'hover:bg-stone-800 text-stone-400'
          }`}
          title="Select & Move Tokens"
        >
          <MousePointer className="w-4 h-4" /> Select
        </button>
        <button
          onClick={() => useGameStore.getState().setActiveTool('pan')}
          className={`p-2 rounded flex items-center gap-1 font-semibold transition-colors ${
            activeTool === 'pan' ? 'bg-amber-800 text-amber-100' : 'hover:bg-stone-800 text-stone-400'
          }`}
          title="Pan Battlemap Canvas"
        >
          <Move className="w-4 h-4" /> Pan
        </button>
        <button
          onClick={() => useGameStore.getState().setActiveTool('ruler')}
          className={`p-2 rounded flex items-center gap-1 font-semibold transition-colors ${
            activeTool === 'ruler' ? 'bg-amber-800 text-amber-100' : 'hover:bg-stone-800 text-stone-400'
          }`}
          title="Measure Real Inches"
        >
          <Ruler className="w-4 h-4" /> Measure
        </button>
        <button
          onClick={() => useGameStore.getState().setActiveTool('calibrate')}
          className={`p-2 rounded flex items-center gap-1 font-semibold transition-colors ${
            activeTool === 'calibrate' ? 'bg-amber-800 text-amber-100' : 'hover:bg-stone-800 text-stone-400'
          }`}
          title="Calibrate Pixels Per Inch Ratio"
        >
          <Scale className="w-4 h-4" /> Calibrate Ratio
        </button>

        <div className="h-4 w-px bg-stone-700 my-auto" />

        {/* Zoom Controls */}
        <button
          onClick={() => setStageScale((s) => Math.min(4.0, s * 1.2))}
          className="p-2 hover:bg-stone-800 rounded text-stone-400"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setStageScale((s) => Math.max(0.3, s / 1.2))}
          className="p-2 hover:bg-stone-800 rounded text-stone-400"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setStageScale(1.0);
            setStagePos({ x: 20, y: 20 });
          }}
          className="p-2 hover:bg-stone-800 rounded text-stone-400"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-stone-700 my-auto" />

        {/* Upload Custom Map */}
        <label className="cursor-pointer px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-amber-400 font-medium">
          Upload Map Image
          <input type="file" accept="image/*" onChange={handleMapUpload} className="hidden" />
        </label>

        <div className="h-4 w-px bg-stone-700 my-auto" />

        {/* 3D View Toggle */}
        {onToggle3dView && (
          <button
            onClick={onToggle3dView}
            className={`p-2 rounded flex items-center gap-1 font-semibold transition-colors ${
              is3dView ? 'bg-amber-800 text-amber-100' : 'hover:bg-stone-800 text-stone-400'
            }`}
            title="Toggle 3D Angle View"
          >
            <Box className="w-4 h-4" /> Vue 3D ({view3dAngle}°)
          </button>
        )}
      </div>

      {/* Scale & Measure Display Badge */}
      <div className="absolute bottom-4 left-4 z-20 bg-stone-900/90 px-3 py-1.5 rounded-lg border border-stone-800 backdrop-blur-md text-xs text-stone-300 font-mono flex items-center gap-3">
        <span>Table: <strong>{boardConfig.widthFeet}x{boardConfig.lengthFeet} ft</strong></span>
        <span>Scale: <strong>{boardConfig.pixelsPerInch} px/inch</strong></span>
        {rulerMeasurement && (
          <span className="text-amber-400 font-bold">
            Distance: {rulerMeasurement.distanceInches}" {rulerMeasurement.distanceInches <= 1.0 ? '(Base Contact!)' : ''}
          </span>
        )}
      </div>

      {/* Token Quick Stat Overlay Card for Selected Token */}
      {selectedTokenId && (() => {
        const token = tokens.find((t) => t.id === selectedTokenId);
        if (!token) return null;
        return (
          <div className="absolute top-16 right-4 z-20 bg-stone-900/95 border border-amber-900/60 p-3 rounded-xl backdrop-blur-md shadow-2xl text-xs text-stone-200 max-w-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: token.color || '#d97706' }} />
                <span>{token.name}</span>
              </div>
              <button
                onClick={() => selectToken(null)}
                className="p-1 text-stone-500 hover:text-stone-300 rounded"
                title="Désélectionner (fermer)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px] bg-stone-950 p-1.5 rounded border border-stone-800">
              <div>
                <span className="text-stone-500 block text-[9px]">PV</span>
                <span className="font-bold text-rose-400 flex items-center justify-center gap-0.5">
                  <Heart className="w-2.5 h-2.5 fill-rose-500" />
                  {token.currentHp ?? '-'}/{token.maxHp ?? '-'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px]">Armure</span>
                <span className="font-bold text-blue-400 flex items-center justify-center gap-0.5">
                  <Shield className="w-2.5 h-2.5 text-blue-400" />
                  {token.armor ?? token.stats?.Armour ?? '-'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px]">Combat</span>
                <span className="font-bold text-amber-300 flex items-center justify-center gap-0.5">
                  <Swords className="w-2.5 h-2.5 text-amber-400" />
                  +{token.fight ?? token.stats?.Fight ?? 0}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px]">Tir</span>
                <span className="font-bold text-emerald-400 flex items-center justify-center gap-0.5">
                  <Crosshair className="w-2.5 h-2.5 text-emerald-400" />
                  +{token.shoot ?? token.stats?.Shoot ?? 0}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-stone-400 flex justify-between">
              <span>Catégorie: <strong className="capitalize text-stone-300">{token.category}</strong></span>
              <span>Pos: ({token.x.toFixed(1)}", {token.y.toFixed(1)}")</span>
            </div>
          </div>
        );
      })()}

      {/* Konva Stage Container with 3D perspective wrapper */}
      <div
        className="w-full h-full transition-transform duration-500 origin-center"
        style={
          is3dView
            ? {
                perspective: '1200px',
                transformStyle: 'preserve-3d',
                transform: `rotateX(${view3dAngle}deg) scale(0.9) translateY(-20px)`,
              }
            : {}
        }
      >
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={activeTool === 'pan'}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
        >
        {/* Layer 1: Background & Grid */}
        <Layer>
          {/* Outer Table Boundary Rect */}
          <Rect
            name="bg-rect"
            x={0}
            y={0}
            width={boardWidthPx}
            height={boardLengthPx}
            fill="#1c1917"
            stroke="#b45309"
            strokeWidth={3}
            shadowColor="black"
            shadowBlur={20}
          />

          {/* Background Custom Battlemap Image */}
          {bgImage && (
            <KonvaImage
              image={bgImage}
              x={0}
              y={0}
              width={boardWidthPx}
              height={boardLengthPx}
            />
          )}

          {/* 1-Inch Grid Overlay */}
          {boardConfig.gridVisible && (
            <Group listening={false}>
              {Array.from({ length: Math.floor(boardConfig.widthFeet * 12) + 1 }).map((_, i) => (
                <Line
                  key={`vgrid-${i}`}
                  points={[i * ppi, 0, i * ppi, boardLengthPx]}
                  stroke="rgba(217, 119, 6, 0.15)"
                  strokeWidth={1}
                />
              ))}
              {Array.from({ length: Math.floor(boardConfig.lengthFeet * 12) + 1 }).map((_, i) => (
                <Line
                  key={`hgrid-${i}`}
                  points={[0, i * ppi, boardWidthPx, i * ppi]}
                  stroke="rgba(217, 119, 6, 0.15)"
                  strokeWidth={1}
                />
              ))}
            </Group>
          )}
        </Layer>

        {/* Layer 2: Tokens (Rangers, Enemies, Clues, Doors) */}
        <Layer>
          {tokens.map((token) => {
            const tokenPxX = token.x * ppi;
            const tokenPxY = token.y * ppi;
            const radiusPx = token.radiusInches * ppi;
            const isSelected = selectedTokenId === token.id;

            return (
              <Group
                key={token.id}
                x={tokenPxX}
                y={tokenPxY}
                draggable={activeTool === 'select'}
                onDragEnd={(e) => {
                  const newXInches = e.target.x() / ppi;
                  const newYInches = e.target.y() / ppi;
                  moveToken(token.id, newXInches, newYInches);
                }}
                onClick={() => {
                  if (selectedTokenId === token.id) {
                    selectToken(null);
                  } else {
                    selectToken(token.id);
                  }
                }}
                onTap={() => {
                  if (selectedTokenId === token.id) {
                    selectToken(null);
                  } else {
                    selectToken(token.id);
                  }
                }}
              >
                {/* Engagement Circle / Highlight Ring */}
                {isSelected && (
                  <Circle
                    radius={radiusPx + 6}
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dash={[4, 4]}
                  />
                )}

                {/* Main Token Base Circle */}
                <Circle
                  radius={radiusPx}
                  fill={token.color || '#d97706'}
                  stroke={token.status.isActivated ? '#44403c' : '#f59e0b'}
                  strokeWidth={token.status.isActivated ? 1.5 : 2.5}
                  shadowColor="black"
                  shadowBlur={6}
                  opacity={token.status.isActivated ? 0.75 : 1.0}
                />

                {/* Token Label text */}
                <KonvaText
                  text={token.name.substring(0, 3).toUpperCase()}
                  fontSize={Math.max(10, radiusPx * 0.9)}
                  fontStyle="bold"
                  fill="#ffffff"
                  align="center"
                  verticalAlign="middle"
                  x={-radiusPx}
                  y={-radiusPx / 2}
                  width={radiusPx * 2}
                />

                {/* HP Bar overlay if character with HP */}
                {token.maxHp && token.maxHp > 0 && (
                  <Group y={radiusPx + 3}>
                    <Rect
                      x={-radiusPx}
                      width={radiusPx * 2}
                      height={4}
                      fill="#44403c"
                      cornerRadius={2}
                    />
                    <Rect
                      x={-radiusPx}
                      width={(radiusPx * 2 * Math.max(0, token.currentHp || 0)) / token.maxHp}
                      height={4}
                      fill={(token.currentHp || 0) <= token.maxHp * 0.3 ? '#ef4444' : '#10b981'}
                      cornerRadius={2}
                    />
                  </Group>
                )}

                {/* Status indicator badges (Engaged / Poisoned / Wounded) */}
                {token.status.isEngaged && (
                  <Circle
                    x={radiusPx * 0.7}
                    y={-radiusPx * 0.7}
                    radius={4}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                )}
              </Group>
            );
          })}
        </Layer>

        {/* Layer 3: Dynamic Ruler & Scale Calibration Overlays */}
        <Layer listening={false}>
          {/* Dynamic Ruler */}
          {rulerStartPx && rulerEndPx && activeTool === 'ruler' && (
            <Group>
              <Line
                points={[rulerStartPx.x, rulerStartPx.y, rulerEndPx.x, rulerEndPx.y]}
                stroke="#f59e0b"
                strokeWidth={3}
                dash={[6, 4]}
              />
              <Circle x={rulerStartPx.x} y={rulerStartPx.y} radius={5} fill="#f59e0b" />
              <Circle x={rulerEndPx.x} y={rulerEndPx.y} radius={5} fill="#f59e0b" />

              {/* Distance Label text */}
              {rulerMeasurement && (
                <KonvaText
                  text={`${rulerMeasurement.distanceInches}"`}
                  x={(rulerStartPx.x + rulerEndPx.x) / 2 + 8}
                  y={(rulerStartPx.y + rulerEndPx.y) / 2 - 12}
                  fontSize={14}
                  fontStyle="bold"
                  fill="#f59e0b"
                />
              )}
            </Group>
          )}

          {/* Scale Calibration Line */}
          {calibStartPx && calibEndPx && activeTool === 'calibrate' && (
            <Group>
              <Line
                points={[calibStartPx.x, calibStartPx.y, calibEndPx.x, calibEndPx.y]}
                stroke="#3b82f6"
                strokeWidth={4}
              />
              <Circle x={calibStartPx.x} y={calibStartPx.y} radius={6} fill="#3b82f6" />
              <Circle x={calibEndPx.x} y={calibEndPx.y} radius={6} fill="#3b82f6" />
            </Group>
          )}
        </Layer>
      </Stage>
      </div>

      {/* Scale Calibration Modal */}
      {showCalibModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-blue-600/50 p-6 rounded-xl shadow-2xl max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <Scale className="w-5 h-5" /> Calibrate Table Scale
            </h3>
            <p className="text-xs text-stone-300">
              Enter the real-world distance (in inches or feet) between the two points you just traced on the map.
            </p>
            <div>
              <label className="text-xs text-stone-400 font-semibold block mb-1">Distance in Real Inches</label>
              <input
                type="number"
                value={calibInputInches}
                onChange={(e) => setCalibInputInches(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 font-bold outline-none focus:border-blue-500"
                placeholder="e.g. 36 for 3 feet"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCalibModal(false);
                  setCalibStartPx(null);
                  setCalibEndPx(null);
                }}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCalibration}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
              >
                Set Scale
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
