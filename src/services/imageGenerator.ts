import { CardThemeId } from '../types/shayari';

export interface CardRenderOptions {
  title?: string;
  content: string;
  author: string;
  themeId: CardThemeId;
  fontSize: number; // e.g. 36
  alignment: 'center' | 'left';
  showWatermark: boolean;
  watermarkText?: string;
}

export class ImageGeneratorService {
  /**
   * Render high-resolution quote card on an off-screen HTML5 Canvas
   * and return either a Data URL or Blob for immediate download
   */
  static async generateQuoteImage(options: CardRenderOptions): Promise<{ dataUrl: string; blob: Blob }> {
    // Wait for Devanagari fonts to finish loading
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch {
      // ignore font loading fallback
    }

    const width = 1080;
    const height = 1350; // 4:5 portrait ratio, perfect for mobile gallery & status

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // 1. Draw Background Gradient according to theme
    this.drawBackground(ctx, width, height, options.themeId);

    // 2. Draw Decorative Borders & Traditional Nepali Motifs
    this.drawOrnamentalBorders(ctx, width, height, options.themeId);

    // 3. Draw Quotation Marks
    this.drawQuoteMark(ctx, width, height, options.themeId);

    // 4. Draw Shayari / Poem Content
    this.drawShayariText(ctx, width, height, options);

    // 5. Draw Author Signature
    this.drawAuthor(ctx, width, height, options);

    // 6. Draw Watermark & App Branding
    if (options.showWatermark) {
      this.drawWatermark(ctx, width, height, options);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ dataUrl, blob });
      }, 'image/png');
    });
  }

  /**
   * Helper to trigger download to phone gallery / downloads
   */
  static downloadBlob(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 1500);
    } catch (e) {
      console.error('Download blob error, using reader fallback', e);
      const reader = new FileReader();
      reader.onloadend = () => {
        const link = document.createElement('a');
        link.href = reader.result as string;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      reader.readAsDataURL(blob);
    }
  }

  /**
   * One-click direct download for any Shayari item
   */
  static async quickDownloadQuoteCard(item: { title?: string; content: string; author: string }): Promise<void> {
    const { blob } = await this.generateQuoteImage({
      title: item.title,
      content: item.content,
      author: item.author || 'नेपाली साहित्य',
      themeId: 'rhododendron',
      fontSize: 36,
      alignment: 'center',
      showWatermark: true,
      watermarkText: 'मनका शब्द • Man Ka Shabda'
    });
    const cleanName = (item.title || item.author || 'shayari').replace(/\s+/g, '_').toLowerCase();
    const filename = `manka_shabda_${cleanName}_${Date.now()}.png`;
    this.downloadBlob(blob, filename);
  }

  /**
   * Share image directly via Web Share API if supported on Android
   */
  static async shareImage(blob: Blob, title: string, text: string): Promise<boolean> {
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'quote.png', { type: 'image/png' })] })) {
      try {
        const file = new File([blob], `${title.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
        await navigator.share({
          title: title,
          text: text,
          files: [file]
        });
        return true;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Share error', err);
        }
        return false;
      }
    }
    return false;
  }

  private static drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    themeId: CardThemeId
  ) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);

    switch (themeId) {
      case 'rhododendron': // Nepali Crimson Red
        gradient.addColorStop(0, '#500724');
        gradient.addColorStop(0.5, '#881337');
        gradient.addColorStop(1, '#4c0519');
        break;
      case 'royal-gold':
        gradient.addColorStop(0, '#261204');
        gradient.addColorStop(0.5, '#451a03');
        gradient.addColorStop(1, '#1c0a02');
        break;
      case 'himalayan-night':
        gradient.addColorStop(0, '#090d16');
        gradient.addColorStop(0.5, '#171c35');
        gradient.addColorStop(1, '#0b0f19');
        break;
      case 'vintage-parchment':
        gradient.addColorStop(0, '#fef3c7');
        gradient.addColorStop(0.5, '#fde68a');
        gradient.addColorStop(1, '#fef3c7');
        break;
      case 'emerald-forest':
        gradient.addColorStop(0, '#022c22');
        gradient.addColorStop(0.5, '#064e3b');
        gradient.addColorStop(1, '#022c22');
        break;
      case 'minimal-dark':
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#171717');
        gradient.addColorStop(1, '#0a0a0a');
        break;
      case 'sunset-marigold':
        gradient.addColorStop(0, '#431407');
        gradient.addColorStop(0.5, '#7c2d12');
        gradient.addColorStop(1, '#451a03');
        break;
      default:
        gradient.addColorStop(0, '#7f1d1d');
        gradient.addColorStop(1, '#991b1b');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle radial light in center for depth
    const radial = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  private static drawOrnamentalBorders(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    themeId: CardThemeId
  ) {
    const isParchment = themeId === 'vintage-parchment';
    const borderColor = isParchment ? 'rgba(120, 53, 15, 0.4)' : 'rgba(251, 191, 36, 0.35)';
    const accentColor = isParchment ? 'rgba(120, 53, 15, 0.7)' : 'rgba(251, 191, 36, 0.8)';

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = borderColor;

    // Outer margin box
    const margin = 50;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    // Inner thin margin box
    const innerMargin = 65;
    ctx.lineWidth = 1;
    ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

    // 4 Corner Traditional Accents
    const cornerSize = 40;
    const corners = [
      { x: innerMargin, y: innerMargin, dx: 1, dy: 1 },
      { x: width - innerMargin, y: innerMargin, dx: -1, dy: 1 },
      { x: innerMargin, y: height - innerMargin, dx: 1, dy: -1 },
      { x: width - innerMargin, y: height - innerMargin, dx: -1, dy: -1 }
    ];

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.dy * cornerSize);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx * cornerSize, c.y);
      ctx.stroke();

      // Mini corner diamond
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(c.x + c.dx * 12, c.y + c.dy * 12, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private static drawQuoteMark(
    ctx: CanvasRenderingContext2D,
    width: number,
    _height: number,
    themeId: CardThemeId
  ) {
    const isParchment = themeId === 'vintage-parchment';
    ctx.save();
    ctx.fillStyle = isParchment ? 'rgba(120, 53, 15, 0.18)' : 'rgba(255, 255, 255, 0.15)';
    ctx.font = 'bold 160px "Rozha One", serif';
    ctx.textAlign = 'center';
    ctx.fillText('“', width / 2, 230);
    ctx.restore();
  }

  private static drawShayariText(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: CardRenderOptions
  ) {
    const isParchment = options.themeId === 'vintage-parchment';
    const textColor = isParchment ? '#291404' : '#ffffff';

    ctx.save();
    ctx.fillStyle = textColor;
    ctx.font = `500 ${options.fontSize}px "Mukta", "Yantramanav", sans-serif`;
    ctx.textAlign = options.alignment;

    const maxLineWidth = width - 240;
    const lines = options.content.split('\n');
    const wrappedLines: string[] = [];

    // Line wrapping helper
    lines.forEach(rawLine => {
      if (rawLine.trim() === '') {
        wrappedLines.push('');
        return;
      }
      const words = rawLine.split(' ');
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && currentLine !== '') {
          wrappedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    });

    // Calculate vertical centering
    const lineHeight = options.fontSize * 1.55;
    const totalBlockHeight = wrappedLines.length * lineHeight;
    let startY = (height - totalBlockHeight) / 2 - 20;

    // Minimum top constraint
    if (startY < 260) startY = 260;

    const startX = options.alignment === 'center' ? width / 2 : 120;

    wrappedLines.forEach((line, idx) => {
      ctx.fillText(line, startX, startY + idx * lineHeight);
    });

    ctx.restore();
  }

  private static drawAuthor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: CardRenderOptions
  ) {
    const isParchment = options.themeId === 'vintage-parchment';
    const authorColor = isParchment ? '#78350f' : '#fef08a';

    ctx.save();
    ctx.fillStyle = authorColor;
    ctx.font = '600 32px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';

    const authorText = options.author ? `— ${options.author}` : '';
    ctx.fillText(authorText, width / 2, height - 190);

    // Decorative underline beneath author
    ctx.strokeStyle = isParchment ? 'rgba(120, 53, 15, 0.4)' : 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 80, height - 165);
    ctx.lineTo(width / 2 + 80, height - 165);
    ctx.stroke();

    ctx.restore();
  }

  private static drawWatermark(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: CardRenderOptions
  ) {
    const isParchment = options.themeId === 'vintage-parchment';
    const wmColor = isParchment ? 'rgba(120, 53, 15, 0.55)' : 'rgba(255, 255, 255, 0.5)';

    ctx.save();
    ctx.fillStyle = wmColor;
    ctx.font = '500 22px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';

    const watermark = options.watermarkText || 'मनका शब्द • Man Ka Shabda';
    ctx.fillText(watermark, width / 2, height - 110);
    ctx.restore();
  }
}
