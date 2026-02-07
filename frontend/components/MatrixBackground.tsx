"use client";

import { useEffect, useRef } from 'react';

interface FallingThread {
  x: number;
  y: number;
  speed: number;
  length: number;
  chars: string[];
  opacity: number;
  isScrambler: boolean;
}

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const maxThreads = 25;
    const scramblerCount = 5;
    const threads: FallingThread[] = [];
    const hackChars = '0123456789ABCDEF<>/\\|[]{}$#@'.split('');
    
    let frameCount = 0;

    // ============================================
    // PRE-RENDER GLOWING CHARACTERS (SPRITE CACHE)
    // ============================================
    const spriteCanvas = document.createElement('canvas');
    const spriteCtx = spriteCanvas.getContext('2d')!;
    
    const charWidth = fontSize * 2;
    const charHeight = fontSize * 2;
    spriteCanvas.width = charWidth * hackChars.length;
    spriteCanvas.height = charHeight * 4; // 4 rows: 3 fade levels + scrambler
    
    spriteCtx.font = `${fontSize}px 'Courier New', monospace`;
    spriteCtx.textAlign = 'center';
    spriteCtx.textBaseline = 'middle';
    
    // Pre-render normal threads (3 fade levels)
    for (let fadeLevel = 0; fadeLevel < 3; fadeLevel++) {
      const opacity = 1 - (fadeLevel / 3);
      const blur = 25;
      
      hackChars.forEach((char, idx) => {
        const x = idx * charWidth + charWidth / 2;
        const y = fadeLevel * charHeight + charHeight / 2;
        
        spriteCtx.globalAlpha = opacity;
        spriteCtx.shadowBlur = blur;
        spriteCtx.shadowColor = '#FF8A6B';
        spriteCtx.fillStyle = '#DD4114';
        spriteCtx.fillText(char, x, y);
      });
    }
    
    // Pre-render scrambler threads (extra bright)
    hackChars.forEach((char, idx) => {
      const x = idx * charWidth + charWidth / 2;
      const y = 3 * charHeight + charHeight / 2;
      
      spriteCtx.globalAlpha = 1;
      spriteCtx.shadowBlur = 50;
      spriteCtx.shadowColor = '#FF8A6B';
      spriteCtx.fillStyle = '#DD4114';
      spriteCtx.fillText(char, x, y);
    });
    
    spriteCtx.globalAlpha = 1;
    spriteCtx.shadowBlur = 0;

    // Initialize threads with column system
    const normalThreadCount = maxThreads - scramblerCount; // 20 normal threads
    const columnSpacing = canvas.width / (normalThreadCount + 1); // Divide screen into lanes
    
    for (let i = 0; i < maxThreads; i++) {
      const isScrambler = i < scramblerCount;
      
      // Assign X position based on thread type
      let xPosition: number;
      if (isScrambler) {
        // Scramblers spawn randomly anywhere
        xPosition = Math.random() * canvas.width;
      } else {
        // Normal threads get fixed columns (lanes)
        const columnIndex = i - scramblerCount; // 0-19 for normal threads
        xPosition = columnSpacing * (columnIndex + 1); // Evenly spaced lanes
      }
      
      threads.push({
        x: xPosition,
        y: Math.random() * -canvas.height,
        speed: isScrambler ? 3 + Math.random() * 2 : 2 + Math.random() * 2,
        length: isScrambler ? 15 + Math.floor(Math.random() * 5) : 10 + Math.floor(Math.random() * 10),
        chars: Array.from({ length: 20 }, () => hackChars[Math.floor(Math.random() * hackChars.length)]),
        opacity: 0.6 + Math.random() * 0.4,
        isScrambler
      });
    }

    // Animation loop using requestAnimationFrame with 24fps limiting
    let animationId: number;
    let lastFrameTime = 0;
    const fps = 24;
    const frameInterval = 1000 / fps; // ~41.67ms per frame
    
    function animate(currentTime: number) {
      // Calculate time since last frame
      const deltaTime = currentTime - lastFrameTime;
      
      // Only render if enough time has passed (24fps throttle)
      if (deltaTime >= frameInterval) {
        lastFrameTime = currentTime - (deltaTime % frameInterval);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        frameCount++;
        
        threads.forEach(thread => {
          // Update scrambler chars every 3 frames (throttled)
          if (thread.isScrambler && frameCount % 3 === 0) {
            thread.chars = thread.chars.map(() => 
              hackChars[Math.floor(Math.random() * hackChars.length)]
            );
          }

          // Draw using pre-rendered sprites
          for (let i = 0; i < thread.length; i++) {
            const char = thread.chars[i % thread.chars.length];
            
            // Add spring oscillation for snappier feel
            const springOffset = Math.sin((thread.y + i * fontSize) * 0.05) * 2;
            const charY = thread.y - (i * fontSize) + springOffset;
            
            if (charY > 0 && charY < canvas.height) {
              const charIndex = hackChars.indexOf(char);
              if (charIndex === -1) continue;
              
              // Determine sprite row
              let spriteRow: number;
              if (thread.isScrambler) {
                spriteRow = 3;
              } else {
                spriteRow = Math.min(2, Math.floor(i / (thread.length / 3)));
              }
              
              // Copy pre-rendered sprite
              const srcX = charIndex * charWidth;
              const srcY = spriteRow * charHeight;
              
              ctx.globalAlpha = thread.opacity;
              ctx.drawImage(
                spriteCanvas,
                srcX, srcY, charWidth, charHeight,
                thread.x - charWidth / 2, charY - charHeight / 2, charWidth, charHeight
              );
            }
          }

          thread.y += thread.speed;

          // Respawn logic when thread goes off bottom of screen
          if (thread.y - (thread.length * fontSize) > canvas.height) {
            thread.y = -thread.length * fontSize; // Move back to top
            
            // Only scramblers get new random X position
            // Normal threads stay in their fixed lane
            if (thread.isScrambler) {
              thread.x = Math.random() * canvas.width;
            }
            // Normal threads keep their X position (stay in lane)
          }
        });
        
        ctx.globalAlpha = 1;
      }
      
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
