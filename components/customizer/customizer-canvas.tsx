'use client';

import { useRef, useEffect } from 'react';
import { templates } from '@/data/customizationTemplates';
import { products } from '@/data/products';
import { deviceModels } from '@/data/devices';
import { useCustomizerStore } from '@/store/customizer';

interface CustomizerCanvasProps {
  productId: string;
  initialImage?: string | null;
  selectedColor?: string;
  selectedDeviceId?: string;
  selectedSize?: string;
}

/**
 * fabric.js canvas wrapper. Dynamically imported (SSR disabled).
 * Uses requestAnimationFrame throttling for redraws.
 */
export function CustomizerCanvas({
  productId,
  initialImage,
  selectedColor,
  selectedDeviceId,
  selectedSize,
}: CustomizerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<unknown>(null);

  const { splitStyle, splitOrientation, splitPanels, splitGridCols, splitGridRows, printStyle } =
    useCustomizerStore();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeFabricCanvas: any = null;

    const initCanvas = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadFabric = () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Promise<any>((resolve) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((window as any).fabric) return resolve((window as any).fabric);
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          script.onload = () => resolve((window as any).fabric);
          document.body.appendChild(script);
        });

      const fabric = await loadFabric();

      if (!containerRef.current) return;

      // Clear any existing children to prevent duplicates during strict mode
      containerRef.current.innerHTML = '';

      const canvasEl = document.createElement('canvas');
      canvasEl.className = 'max-w-full max-h-full';
      containerRef.current.appendChild(canvasEl);

      const product = products.find((p) => p.id === productId);
      const category = product ? product.categorySlug : 'tees';

      let template = Object.values(templates)[0];
      if (category === 'tees') template = templates['eclipse-tee'];
      else if (category === 'hoodies') template = templates['orbit-hoodie'];
      else if (category === 'skins') template = templates['phantom-skin'];
      else if (category === 'posters') template = templates['monolith-poster'];
      else if (category === 'split-posters') template = templates['prism-split'];
      else if (category === 'stationery') template = templates['chronicle-diary'];

      if (!template) {
        console.error('No customization template found');
        return;
      }

      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
      const canvas = new (fabric as any).Canvas(canvasEl, {
        width: 600,
        height: 700,
        backgroundColor: selectedColor || '#1A1A1E',
        selection: true,
        preserveObjectStacking: true,
      });
      activeFabricCanvas = canvas;
      fabricRef.current = canvas;

      let paX = 600 * template.printArea.x;
      let paY = 700 * template.printArea.y;
      let paW = 600 * template.printArea.width;
      let paH = 700 * template.printArea.height;
      let borderRadius = 0;

      const deviceShape =
        category === 'skins' && selectedDeviceId
          ? deviceModels.find((d) => d.id === selectedDeviceId)
          : null;

      if (deviceShape) {
        const maxH = 450;
        const maxW = 450;

        if (deviceShape.type === 'mobile') {
          paH = maxH;
          paW = paH * deviceShape.aspectRatio;
        } else {
          paW = maxW;
          paH = paW / deviceShape.aspectRatio;
        }

        paX = (600 - paW) / 2;
        paY = (700 - paH) / 2;
        borderRadius = paW * deviceShape.borderRadius;
      }

      const loadUserImage = (userImgUrl: string, clipPath: any, onRender: () => void) => {
        (fabric as any).Image.fromURL(userImgUrl, (userImg: any) => {
          const scaleX = paW / userImg.width;
          const scaleY = paH / userImg.height;
          const userScale = Math.max(scaleX, scaleY);

          userImg.set({
            left: paX + paW / 2,
            top: paY + paH / 2,
            originX: 'center',
            originY: 'center',
            scaleX: userScale,
            scaleY: userScale,
            clipPath: clipPath,
            globalCompositeOperation: template.blendMode || 'source-over',
            cornerColor: '#3B5EFF',
            borderColor: '#3B5EFF',
            cornerSize: 12,
            transparentCorners: false,
          });

          // Apply print style filters
          const filters = (fabric as any).Image.filters;
          if (filters && printStyle && printStyle !== 'standard') {
            if (printStyle === 'vintage') {
              if (filters.Sepia) userImg.filters.push(new filters.Sepia());
              if (filters.Brightness)
                userImg.filters.push(new filters.Brightness({ brightness: -0.05 }));
              if (filters.Contrast) userImg.filters.push(new filters.Contrast({ contrast: 0.1 }));
            } else if (printStyle === 'metallic') {
              if (filters.Saturation)
                userImg.filters.push(new filters.Saturation({ saturation: -1 }));
              if (filters.Brightness)
                userImg.filters.push(new filters.Brightness({ brightness: 0.2 }));
              if (filters.Contrast) userImg.filters.push(new filters.Contrast({ contrast: 0.2 }));
            } else if (printStyle === 'embroidered') {
              if (filters.Saturation)
                userImg.filters.push(new filters.Saturation({ saturation: -0.3 }));
              if (filters.Contrast) userImg.filters.push(new filters.Contrast({ contrast: 0.4 }));
            }
            userImg.applyFilters();
          }

          if (template.printArea.rotation) {
            userImg.rotate(template.printArea.rotation);
          }

          canvas.add(userImg);
          canvas.setActiveObject(userImg);
          onRender();
        });
      };

      if (category === 'skins' && deviceShape) {
        // --- PROCEDURAL DEVICE RENDERING ---

        // 1. Phone Body Shadow (Bottom layer)
        const shadowRect = new (fabric as any).Rect({
          left: paX,
          top: paY,
          width: paW,
          height: paH,
          rx: borderRadius,
          ry: borderRadius,
          fill: '#111',
          shadow: new (fabric as any).Shadow({
            color: 'rgba(0,0,0,0.5)',
            blur: 25,
            offsetX: 0,
            offsetY: 10,
          }),
          selectable: false,
          evented: false,
        });
        canvas.add(shadowRect);

        // 2. Phone Body Frame (Inner border effect)
        const frameRect = new (fabric as any).Rect({
          left: paX - 2,
          top: paY - 2,
          width: paW + 4,
          height: paH + 4,
          rx: borderRadius + 2,
          ry: borderRadius + 2,
          fill: '#333',
          selectable: false,
          evented: false,
        });
        canvas.add(frameRect);

        // 3. User Image Clip Path
        const clipPath = new (fabric as any).Rect({
          left: paX,
          top: paY,
          width: paW,
          height: paH,
          rx: borderRadius,
          ry: borderRadius,
          absolutePositioned: true,
        });

        // 4. Camera module overlays (shape-aware) + logo (laptop)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const overlays: any[] = [];

        // 4a. Camera module + individual lenses
        if (deviceShape.cameraModule) {
          const mod = deviceShape.cameraModule;

          // Compute module bounding box in absolute canvas coordinates
          let mX: number, mY: number, mW: number, mH: number;
          if (mod.shape === 'circle') {
            // For circles: x/y = center, w = radius (fraction of device WIDTH)
            const cx = paX + paW * mod.x;
            const cy = paY + paH * mod.y;
            const r = paW * mod.w;
            mX = cx - r;
            mY = cy - r;
            mW = r * 2;
            mH = r * 2;
          } else {
            mX = paX + paW * mod.x;
            mY = paY + paH * mod.y;
            mW = paW * mod.w;
            mH = paH * mod.h;
          }

          // Draw the module background shape
          if (mod.shape === 'circle') {
            const moduleBody = new (fabric as any).Circle({
              left: mX,
              top: mY,
              radius: mW / 2,
              fill: '#0C0C0E',
              stroke: '#2E2E34',
              strokeWidth: 2,
              selectable: false,
              evented: false,
            });
            overlays.push(moduleBody);
          } else {
            // Compute corner radius based on shape
            let rx = 0;
            let ry = 0;
            if (mod.shape === 'pill-vertical') {
              rx = mW / 2;
              ry = mW / 2;
            } else if (mod.shape === 'pill-horizontal') {
              rx = mH / 2;
              ry = mH / 2;
            } else if (mod.shape === 'rect-rounded') {
              rx = mW * 0.15;
              ry = mW * 0.15;
            } else if (mod.shape === 'strip-vertical') {
              // Very subtle strip — render with minimal rounding and near-transparent fill
              rx = mW * 0.3;
              ry = mW * 0.3;
            }

            const stripFill = mod.shape === 'strip-vertical' ? 'rgba(14,14,16,0.6)' : '#0C0C0E';
            const moduleBody = new (fabric as any).Rect({
              left: mX,
              top: mY,
              width: mW,
              height: mH,
              rx,
              ry,
              fill: stripFill,
              stroke: '#2E2E34',
              strokeWidth: mod.shape === 'strip-vertical' ? 0 : 2,
              selectable: false,
              evented: false,
            });
            overlays.push(moduleBody);
          }

          // Draw individual lenses
          for (const lens of mod.lenses ?? []) {
            const lCx = mX + mW * lens.cx;
            const lCy = mY + mH * lens.cy;
            const lR = mW * lens.r;

            // Outer bezel ring
            const lensRing = new (fabric as any).Circle({
              left: lCx - lR,
              top: lCy - lR,
              radius: lR,
              fill: '#181820',
              stroke: '#3C3C46',
              strokeWidth: 1.5,
              selectable: false,
              evented: false,
            });

            // Inner glass element
            const innerR = lR * 0.62;
            const lensGlass = new (fabric as any).Circle({
              left: lCx - innerR,
              top: lCy - innerR,
              radius: innerR,
              fill: new (fabric as any).Gradient({
                type: 'radial',
                coords: {
                  x1: innerR * 0.4,
                  y1: innerR * 0.4,
                  x2: innerR,
                  y2: innerR,
                  r1: 0,
                  r2: innerR,
                },
                colorStops: [
                  { offset: 0, color: 'rgba(50,60,90,0.9)' },
                  { offset: 0.6, color: 'rgba(8,10,18,0.95)' },
                  { offset: 1, color: 'rgba(4,5,10,1)' },
                ],
              }),
              selectable: false,
              evented: false,
            });

            overlays.push(lensRing);
            overlays.push(lensGlass);
          }

          // Draw LED flash if specified
          if (mod.flash) {
            const fCx = mX + mW * mod.flash.cx;
            const fCy = mY + mH * mod.flash.cy;
            const fR = mW * mod.flash.r;
            const flashDot = new (fabric as any).Circle({
              left: fCx - fR,
              top: fCy - fR,
              radius: fR,
              fill: '#FFF5D6',
              stroke: '#9A8B60',
              strokeWidth: 1,
              selectable: false,
              evented: false,
            });
            overlays.push(flashDot);
          }
        }

        // 4b. Logo cutout (laptops — Apple logo, Dell logo, etc.)
        if (deviceShape.logoCutout) {
          const lc = deviceShape.logoCutout;
          const lcCx = paX + paW * lc.cx;
          const lcCy = paY + paH * lc.cy;
          const lcR = paW * lc.r;
          const logo = new (fabric as any).Circle({
            left: lcCx - lcR,
            top: lcCy - lcR,
            radius: lcR,
            fill: '#E5E5E5',
            shadow: new (fabric as any).Shadow({
              color: 'rgba(0,0,0,0.3)',
              blur: 4,
              offsetX: 0,
              offsetY: 2,
            }),
            selectable: false,
            evented: false,
          });
          overlays.push(logo);
        }

        // 5. Glass Reflection
        const reflection = new (fabric as any).Rect({
          left: paX,
          top: paY,
          width: paW,
          height: paH,
          rx: borderRadius,
          ry: borderRadius,
          fill: new (fabric as any).Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: paW, y2: paH },
            colorStops: [
              { offset: 0, color: 'rgba(255,255,255,0.1)' },
              { offset: 0.5, color: 'rgba(255,255,255,0)' },
              { offset: 1, color: 'rgba(0,0,0,0.2)' },
            ],
          }),
          selectable: false,
          evented: false,
        });
        overlays.push(reflection);

        const onRender = () => {
          overlays.forEach((o) => canvas.add(o));
          canvas.renderAll();
        };

        if (initialImage) {
          loadUserImage(initialImage, clipPath, onRender);
        } else {
          const placeholder = new (fabric as any).Rect({
            left: paX,
            top: paY,
            width: paW,
            height: paH,
            rx: borderRadius,
            ry: borderRadius,
            fill: '#1A1A1E',
            stroke: 'rgba(59, 94, 255, 0.5)',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });
          canvas.add(placeholder);
          onRender();
        }
      } else if (category === 'posters' || category === 'split-posters') {
        // --- PROCEDURAL POSTER RENDERING ---
        let maxH = 500;
        let maxW = 350; // 5:7 portrait ratio

        if (selectedSize === 'A2') {
          maxH = 400;
          maxW = 400 * (5 / 7);
        } else if (selectedSize === 'A3') {
          maxH = 300;
          maxW = 300 * (5 / 7);
        }

        if (category === 'split-posters') {
          const isV = splitOrientation === 'vertical';
          if (splitStyle === 'classic') {
            maxW = isV ? 300 : 500;
            maxH = isV ? 500 : 300;
          } else if (splitStyle === 'stepped') {
            maxW = 500;
            maxH = 300;
          } else if (splitStyle === 'grid') {
            maxW = 400;
            maxH = 400;
          }
        }

        paH = maxH;
        paW = maxW;
        paX = (600 - paW) / 2;
        paY = (700 - paH) / 2;
        borderRadius = 0;

        // Shadow
        const shadowRect = new (fabric as any).Rect({
          left: paX - 20,
          top: paY - 20,
          width: paW + 40,
          height: paH + 40,
          fill: '#111',
          shadow: new (fabric as any).Shadow({
            color: 'rgba(0,0,0,0.6)',
            blur: 30,
            offsetX: 0,
            offsetY: 15,
          }),
          selectable: false,
          evented: false,
        });
        canvas.add(shadowRect);

        // Frame
        const frameRect = new (fabric as any).Rect({
          left: paX - 20,
          top: paY - 20,
          width: paW + 40,
          height: paH + 40,
          fill: '#1A1A1A',
          selectable: false,
          evented: false,
        });
        canvas.add(frameRect);

        // Mat board
        const matRect = new (fabric as any).Rect({
          left: paX - 2,
          top: paY - 2,
          width: paW + 4,
          height: paH + 4,
          fill: '#F5F5F5',
          selectable: false,
          evented: false,
        });
        canvas.add(matRect);

        const innerShadow = new (fabric as any).Rect({
          left: paX,
          top: paY,
          width: paW,
          height: paH,
          fill: 'transparent',
          stroke: 'rgba(0,0,0,0.1)',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });

        const clipPath = new (fabric as any).Rect({
          left: paX,
          top: paY,
          width: paW,
          height: paH,
          absolutePositioned: true,
        });

        const glassReflection = new (fabric as any).Rect({
          left: paX - 20,
          top: paY - 20,
          width: paW + 40,
          height: paH + 40,
          fill: new (fabric as any).Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: paW + 40, y2: paH + 40 },
            colorStops: [
              { offset: 0, color: 'rgba(255,255,255,0.08)' },
              { offset: 0.5, color: 'rgba(255,255,255,0)' },
              { offset: 1, color: 'rgba(0,0,0,0.15)' },
            ],
          }),
          selectable: false,
          evented: false,
        });

        const onRender = () => {
          canvas.add(innerShadow);
          if (category === 'split-posters') {
            // Draw gaps depending on split configuration
            const gapSize = 10;

            if (splitStyle === 'classic') {
              const isV = splitOrientation === 'vertical';
              for (let i = 1; i < splitPanels; i++) {
                if (isV) {
                  // Vertical gaps
                  const step = paW / splitPanels;
                  const gap = new (fabric as any).Rect({
                    left: paX + step * i - gapSize / 2,
                    top: paY - 20,
                    width: gapSize,
                    height: paH + 40,
                    fill: '#1A1A1A',
                    selectable: false,
                    evented: false,
                  });
                  canvas.add(gap);
                } else {
                  // Horizontal gaps
                  const step = paH / splitPanels;
                  const gap = new (fabric as any).Rect({
                    left: paX - 20,
                    top: paY + step * i - gapSize / 2,
                    width: paW + 40,
                    height: gapSize,
                    fill: '#1A1A1A',
                    selectable: false,
                    evented: false,
                  });
                  canvas.add(gap);
                }
              }
            } else if (splitStyle === 'stepped') {
              const step = paW / splitPanels;
              const pCount = splitPanels === 5 ? 5 : 3;
              const heights = pCount === 3 ? [0.8, 1, 0.8] : [0.6, 0.8, 1, 0.8, 0.6];

              // Gaps
              for (let i = 1; i < splitPanels; i++) {
                const gap = new (fabric as any).Rect({
                  left: paX + step * i - gapSize / 2,
                  top: paY - 20,
                  width: gapSize,
                  height: paH + 40,
                  fill: '#1A1A1A',
                  selectable: false,
                  evented: false,
                });
                canvas.add(gap);
              }
              // Stepped cutouts (top and bottom)
              for (let i = 0; i < splitPanels; i++) {
                const hScale = heights[i] ?? 1;
                const removedH = (paH - paH * hScale) / 2;
                if (removedH > 0) {
                  const topBlock = new (fabric as any).Rect({
                    left: paX + step * i,
                    top: paY - 20,
                    width: step,
                    height: removedH + 20,
                    fill: '#1A1A1A',
                    selectable: false,
                    evented: false,
                  });
                  const bottomBlock = new (fabric as any).Rect({
                    left: paX + step * i,
                    top: paY + paH - removedH,
                    width: step,
                    height: removedH + 20,
                    fill: '#1A1A1A',
                    selectable: false,
                    evented: false,
                  });
                  canvas.add(topBlock);
                  canvas.add(bottomBlock);
                }
              }
            } else if (splitStyle === 'grid') {
              const stepX = paW / splitGridCols;
              const stepY = paH / splitGridRows;
              for (let i = 1; i < splitGridCols; i++) {
                const gap = new (fabric as any).Rect({
                  left: paX + stepX * i - gapSize / 2,
                  top: paY - 20,
                  width: gapSize,
                  height: paH + 40,
                  fill: '#1A1A1A',
                  selectable: false,
                  evented: false,
                });
                canvas.add(gap);
              }
              for (let i = 1; i < splitGridRows; i++) {
                const gap = new (fabric as any).Rect({
                  left: paX - 20,
                  top: paY + stepY * i - gapSize / 2,
                  width: paW + 40,
                  height: gapSize,
                  fill: '#1A1A1A',
                  selectable: false,
                  evented: false,
                });
                canvas.add(gap);
              }
            }
          }
          canvas.add(glassReflection);
          canvas.renderAll();
        };

        if (initialImage) {
          loadUserImage(initialImage, clipPath, onRender);
        } else {
          const placeholder = new (fabric as any).Rect({
            left: paX,
            top: paY,
            width: paW,
            height: paH,
            fill: '#1A1A1E',
            stroke: 'rgba(59, 94, 255, 0.5)',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });
          canvas.add(placeholder);
          onRender();
        }
      } else {
        // --- NORMAL MOCKUP RENDERING (Apparel, Posters, etc) ---

        // Scale the print area to simulate apparel sizing
        // (An XL shirt makes the standard print area look smaller, an S makes it look larger)
        if (['S', 'M', 'L', 'XL'].includes(selectedSize || '')) {
          const center_x = paX + paW / 2;
          const center_y = paY + paH / 2;

          let sizeModifier = 1.0;
          if (selectedSize === 'S') sizeModifier = 1.15;
          else if (selectedSize === 'L') sizeModifier = 0.9;
          else if (selectedSize === 'XL') sizeModifier = 0.8;

          paW = paW * sizeModifier;
          paH = paH * sizeModifier;
          paX = center_x - paW / 2;
          paY = center_y - paH / 2;
        }

        (fabric as any).Image.fromURL(template.mockupImage, (img: any) => {
          img.set({ originX: 'left', originY: 'top', selectable: false, evented: false });
          const scale = Math.min(600 / img.width, 700 / img.height);
          img.scale(scale);
          const scaledW = img.width * scale;
          const scaledH = img.height * scale;
          img.set({ left: (600 - scaledW) / 2, top: (700 - scaledH) / 2 });
          canvas.add(img);
          canvas.sendToBack(img);

          const clipPath = new (fabric as any).Rect({
            left: paX,
            top: paY,
            width: paW,
            height: paH,
            rx: borderRadius,
            ry: borderRadius,
            absolutePositioned: true,
          });

          if (template.printArea.rotation) {
            clipPath.rotate(template.printArea.rotation);
          }

          const onRender = () => {
            const printZone = new (fabric as any).Rect({
              left: paX,
              top: paY,
              width: paW,
              height: paH,
              rx: borderRadius,
              ry: borderRadius,
              fill: 'transparent',
              stroke: 'rgba(59, 94, 255, 0.5)',
              strokeWidth: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            });
            if (template.printArea.rotation) printZone.rotate(template.printArea.rotation);
            canvas.add(printZone);
            canvas.renderAll();
          };

          if (initialImage) {
            loadUserImage(initialImage, clipPath, onRender);
          } else {
            onRender();
          }
        });
      }
      /* eslint-enable */
    };

    void initCanvas();

    const currentContainer = containerRef.current;
    return () => {
      if (activeFabricCanvas) {
        (activeFabricCanvas as { dispose: () => void }).dispose();
      }
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [
    productId,
    initialImage,
    selectedColor,
    selectedDeviceId,
    selectedSize,
    splitStyle,
    splitOrientation,
    splitPanels,
    splitGridCols,
    splitGridRows,
    printStyle,
  ]);

  return (
    <div
      ref={containerRef}
      className="bg-graphite border border-smoke rounded-lg p-0 flex items-center justify-center overflow-hidden w-full h-[60vh] lg:h-[700px]"
    ></div>
  );
}
