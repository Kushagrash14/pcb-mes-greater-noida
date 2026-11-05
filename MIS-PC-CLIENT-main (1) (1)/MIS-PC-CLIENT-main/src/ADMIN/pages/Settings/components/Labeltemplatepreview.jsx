import { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Typography } from 'antd';

const { Text } = Typography;

// Mirrors the backend's formatTemplateDate/resolveTextValue in
// utils/zplTemplate.js — kept in sync manually since this only drives
// the on-screen preview, not what actually gets printed (the backend
// is the source of truth for the real ZPL).
const formatTemplateDate = (format = 'DD/MM/YY') => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const shortYear = year.slice(-2);

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsLong = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const replacements = {
    DD: day, MMMM: monthsLong[date.getMonth()], MMM: monthsShort[date.getMonth()],
    MM: month, YYYY: year, YY: shortYear,
  };

  return format.replace(/YYYY|MMMM|MMM|MM|DD|YY/g, (token) => replacements[token]);
};

const resolveTextValue = (element, sampleData) => {
  if (element.source === 'manual') return element.text ?? '';
  if (element.source === 'date') return formatTemplateDate(element.dateFormat || 'DD/MM/YY');
  return sampleData[element.field] ?? '';
};

/**
 * Read-only render of a label_templates row against a data object —
 * same positioning/scaling logic as the Label Template Editor's canvas,
 * without drag/select. Use to preview real data before printing.
 *
 * @param {{ template: object, sampleData: Record<string,string>, maxWidth?: number }} props
 */
export default function LabelTemplatePreview({ template, sampleData, maxWidth = 500 }) {
  const elements = useMemo(() => {
    if (!template?.elements) return [];
    return typeof template.elements === 'string' ? JSON.parse(template.elements) : template.elements;
  }, [template]);

  if (!template) return null;

  const scale = Math.min(maxWidth / template.width, 1);
  const canvasWidth = template.width * scale;
  const canvasHeight = template.height * scale;

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <Text type="secondary">
          Preview — {template.name} ({template.width} × {template.height} dots, {template.dpi} DPI)
        </Text>
      </div>
      <div
        style={{
          overflow: 'auto',
          padding: 12,
          background: '#f5f5f5',
          border: '1px solid #ddd',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: canvasWidth,
            height: canvasHeight,
            background: '#fff',
            border: '1px solid #999',
          }}
        >
          {elements.map((element) => {
            if (!element || !element.type) return null;

            if (element.type === 'text') {
              const value = resolveTextValue(element, sampleData);
              return (
                <div
                  key={element.id}
                  style={{
                    position: 'absolute',
                    left: element.x * scale,
                    top: element.y * scale,
                    fontSize: element.fontSize * scale,
                    lineHeight: `${element.fontSize * scale}px`,
                    fontWeight: element.bold ? 700 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {value || <span style={{ color: '#bbb' }}>(empty)</span>}
                </div>
              );
            }

            if (element.type === 'qr') {
              const value = sampleData[element.field] ?? '';
              return (
                <div
                  key={element.id}
                  style={{
                    position: 'absolute',
                    left: element.x * scale,
                    top: element.y * scale,
                    width: element.size * scale,
                    height: element.size * scale,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <QRCodeCanvas value={String(value || 'PREVIEW')} size={element.size * scale} level="M" includeMargin={false} />
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}