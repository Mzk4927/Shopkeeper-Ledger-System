import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString('en-PK');
};

const getItemsRowsHtml = (items) => {
  if (!items.length) {
    return '<tr><td colspan="4">No items added</td></tr>';
  }

  return items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>Rs. ${formatCurrency(item.price)}</td>
        <td>Rs. ${formatCurrency(item.total)}</td>
      </tr>`
    )
    .join('');
};

export const generateCustomerSlipPdf = async (customer) => {
  try {
    const items = Array.isArray(customer.items) ? customer.items : [];
    const itemsTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
            h1 { margin: 0 0 4px 0; }
            .muted { color: #666; margin: 0 0 12px 0; }
            .box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f5f7; }
            .footer { margin-top: 18px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Khata Slip</h1>
          <p class="muted">Physical record for customer credit</p>

          <div class="box">
            <p><strong>Customer:</strong> ${customer.name}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            <p><strong>Loan Date:</strong> ${customer.loan_date || '-'}</p>
            <p><strong>Due Date:</strong> ${customer.due_date || '-'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${getItemsRowsHtml(items)}
            </tbody>
          </table>

          <div class="box" style="margin-top: 14px;">
            <p><strong>Items Total:</strong> Rs. ${formatCurrency(itemsTotal)}</p>
            <p><strong>Pending Balance:</strong> Rs. ${formatCurrency(customer.total_balance)}</p>
          </div>

          <p class="footer">Generated on ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    const file = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('PDF Ready', `Slip saved at: ${file.uri}`);
      return file.uri;
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${customer.name} - Khata Slip`,
      UTI: 'com.adobe.pdf',
    });

    return file.uri;
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'PDF slip generate karne me masla aya.');
    return null;
  }
};
