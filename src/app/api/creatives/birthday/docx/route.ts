import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
} from 'docx';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      referralGroupName = 'Apex Referral Chapter',
      month = 'October',
      year = new Date().getFullYear().toString(),
      members = [],
    } = body;

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { error: 'At least one member birthday record is required for document generation.' },
        { status: 400 }
      );
    }

    // Build Word Document
    const tableRows = [
      // Header Row
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            shading: { fill: '0F172A', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '#', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            shading: { fill: '0F172A', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: 'Member Name', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1400, type: WidthType.DXA },
            shading: { fill: '0F172A', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Birthday Date', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1600, type: WidthType.DXA },
            shading: { fill: '0F172A', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: 'Mobile Number', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            shading: { fill: '0F172A', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: 'Company & Category', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2600, type: WidthType.DXA },
            shading: { fill: '0F172A', type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: 'Celebration Wish', bold: true, color: 'FFFFFF', size: 20 })],
              }),
            ],
          }),
        ],
      }),
    ];

    // Data Rows
    members.forEach((m: any, idx: number) => {
      const isEven = idx % 2 === 0;
      const bg = isEven ? 'FFFFFF' : 'F8FAFC';

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 600, type: WidthType.DXA },
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${idx + 1}`, size: 18 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 2200, type: WidthType.DXA },
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: m.name || m.memberName || 'Member', bold: true, color: '0F172A', size: 19 }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 1400, type: WidthType.DXA },
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${m.birthDay || m.date || '—'} ${month}`,
                      bold: true,
                      color: 'B45309',
                      size: 19,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 1600, type: WidthType.DXA },
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: m.phone || m.mobileNumber || '—', color: '334155', size: 18 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 2200, type: WidthType.DXA },
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: m.company || '—', bold: true, color: '1E293B', size: 18 }),
                    new TextRun({ text: m.businessCategory ? `\n${m.businessCategory}` : '', italics: true, color: '64748B', size: 16 }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 2600, type: WidthType.DXA },
              shading: { fill: bg, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: m.birthdayWish || m.wish || 'Wishing you great success, good health and happiness on your birthday!',
                      color: '475569',
                      size: 17,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: `${referralGroupName.toUpperCase()}`,
                  bold: true,
                  size: 32,
                  color: '0F172A',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 280 },
              children: [
                new TextRun({
                  text: `OFFICIAL MONTHLY BIRTHDAY ROSTER — ${month.toUpperCase()} ${year}`,
                  bold: true,
                  color: 'B45309',
                  size: 22,
                }),
              ],
            }),

            // Summary description
            new Paragraph({
              spacing: { after: 360 },
              children: [
                new TextRun({
                  text: `We proudly honor our chapter members celebrating their birthdays during the month of `,
                  size: 20,
                  color: '334155',
                }),
                new TextRun({
                  text: `${month} ${year}. `,
                  bold: true,
                  size: 20,
                  color: '0F172A',
                }),
                new TextRun({
                  text: `Please reach out to congratulate them, strengthen cross-referrals, and celebrate their accomplishments!`,
                  italics: true,
                  size: 20,
                  color: '64748B',
                }),
              ],
            }),

            // Table
            new Table({
              width: { size: 10600, type: WidthType.DXA },
              rows: tableRows,
            }),

            // Footer note
            new Paragraph({
              spacing: { before: 400 },
              children: [
                new TextRun({
                  text: `Total Birthday Celebrants: `,
                  bold: true,
                  size: 19,
                  color: '0F172A',
                }),
                new TextRun({
                  text: `${members.length} members  •  `,
                  color: '2563EB',
                  bold: true,
                  size: 19,
                }),
                new TextRun({
                  text: `Generated via Referral Group Creative Generator Portal on ${new Date().toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}`,
                  size: 17,
                  color: '94A3B8',
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const safeGroup = referralGroupName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Birthday_Roster_${month}_${safeGroup}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Failed to generate Word document:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate Word document' }, { status: 500 });
  }
}
