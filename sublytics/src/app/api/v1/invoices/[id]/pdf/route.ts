import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/v1/auth.helper';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * @swagger
 * /api/v1/invoices/{id}/pdf:
 *   get:
 *     summary: Download invoice as PDF
 *     description: Generate and download an invoice as a PDF file
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The invoice ID
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 401,
            type: 'Unauthorized',
            message: auth.error,
          },
        },
        { status: 401 }
      );
    }

    const { id } = params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'Invalid invoice ID format',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch invoice with customer details and line items
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers!invoices_customer_id_fkey(id, name, email, company, address, city, country, phone),
        items:invoice_items(
          id,
          product_id,
          description,
          quantity,
          unit_price,
          total,
          product:products(name, sku)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 404,
              type: 'NotFound',
              message: 'Invoice not found',
            },
          },
          { status: 404 }
        );
      }

      console.error('Invoice fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to fetch invoice',
          },
        },
        { status: 500 }
      );
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Company header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sublytics Inc.', 14, 30);
    doc.text('123 Business Ave', 14, 35);
    doc.text('San Francisco, CA 94103', 14, 40);
    doc.text('support@sublytics.io', 14, 45);

    // Invoice details (right side)
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice #:', pageWidth - 70, 30);
    doc.text('Issue Date:', pageWidth - 70, 35);
    doc.text('Due Date:', pageWidth - 70, 40);
    doc.text('Status:', pageWidth - 70, 45);

    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, pageWidth - 40, 30);
    doc.text(new Date(invoice.issue_date).toLocaleDateString(), pageWidth - 40, 35);
    doc.text(new Date(invoice.due_date).toLocaleDateString(), pageWidth - 40, 40);
    doc.text(invoice.status.toUpperCase(), pageWidth - 40, 45);

    // Customer details
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer.name, 14, 65);
    if (invoice.customer.company) {
      doc.text(invoice.customer.company, 14, 70);
    }
    if (invoice.customer.address) {
      doc.text(invoice.customer.address, 14, 75);
    }
    if (invoice.customer.city || invoice.customer.country) {
      doc.text(
        `${invoice.customer.city || ''}${invoice.customer.city && invoice.customer.country ? ', ' : ''}${invoice.customer.country || ''}`,
        14,
        80
      );
    }
    if (invoice.customer.email) {
      doc.text(invoice.customer.email, 14, 85);
    }

    // Line items table
    const tableData = invoice.items.map((item: any) => [
      item.description,
      item.product?.sku || '-',
      item.quantity.toString(),
      `${invoice.currency} ${parseFloat(item.unit_price).toFixed(2)}`,
      `${invoice.currency} ${parseFloat(item.total).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Description', 'SKU', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
      },
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || 95;

    // Totals section
    const totalsX = pageWidth - 70;
    let currentY = finalY + 10;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, currentY);
    doc.text(`${invoice.currency} ${parseFloat(invoice.subtotal).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });

    if (parseFloat(invoice.discount_amount) > 0) {
      currentY += 6;
      doc.text(`Discount (${invoice.discount_percent}%):`, totalsX, currentY);
      doc.text(`-${invoice.currency} ${parseFloat(invoice.discount_amount).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });
    }

    currentY += 6;
    doc.text(`Tax (${invoice.tax_percent}%):`, totalsX, currentY);
    doc.text(`${invoice.currency} ${parseFloat(invoice.tax_amount).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });

    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', totalsX, currentY);
    doc.text(`${invoice.currency} ${parseFloat(invoice.total).toFixed(2)}`, pageWidth - 14, currentY, { align: 'right' });

    if (invoice.paid_at) {
      currentY += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 128, 0);
      doc.text('PAID', totalsX, currentY);
      doc.text(new Date(invoice.paid_at).toLocaleDateString(), pageWidth - 14, currentY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    // Notes
    if (invoice.notes) {
      currentY += 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Notes:', 14, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.notes, 14, currentY + 5, { maxWidth: pageWidth - 28 });
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
    doc.text('For questions, contact support@sublytics.io', pageWidth / 2, footerY + 5, { align: 'center' });

    // Generate PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          type: 'ServerError',
          message: 'An unexpected error occurred while generating PDF',
        },
      },
      { status: 500 }
    );
  }
}
