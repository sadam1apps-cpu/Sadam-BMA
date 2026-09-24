/**
 * Google Sheets Database Integration Service
 * Self-healing columns & zero-login spreadsheet database for Business Management.
 */

import {
  Account,
  BusinessProfile,
  Customer,
  Employee,
  Expense,
  Product,
  Sale,
  StockMovement,
  Supplier,
} from '../types';

export interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'json' | 'date';
  description: string;
  sample: string;
  required: boolean;
}

export interface SheetSchema {
  sheetName: string;
  title: string;
  description: string;
  columns: ColumnDefinition[];
}

export const SHEETS_DATABASE_SCHEMAS: SheetSchema[] = [
  {
    sheetName: 'Products',
    title: 'Products & Inventory',
    description: 'Product catalog, pricing, cost, stock counts, and barcode tracking.',
    columns: [
      { name: 'id', type: 'string', description: 'Unique product ID / UUID', sample: 'prod_1', required: true },
      { name: 'name', type: 'string', description: 'Product title / description', sample: 'Premium Roast Coffee 500g', required: true },
      { name: 'sku', type: 'string', description: 'Stock Keeping Unit code', sample: 'BEV-COF-001', required: true },
      { name: 'category', type: 'string', description: 'Category grouping', sample: 'Beverages', required: true },
      { name: 'costPrice', type: 'number', description: 'Wholesale purchase unit cost', sample: '8.50', required: true },
      { name: 'sellingPrice', type: 'number', description: 'Retail price to customers', sample: '14.99', required: true },
      { name: 'stock', type: 'number', description: 'Current available quantity', sample: '42', required: true },
      { name: 'minStockAlert', type: 'number', description: 'Low stock reorder threshold', sample: '10', required: true },
      { name: 'unit', type: 'string', description: 'Unit of measure (pcs, kg, box, etc.)', sample: 'pcs', required: true },
      { name: 'barcode', type: 'string', description: 'UPC/EAN barcode for POS scanners', sample: '8901234567890', required: false },
      { name: 'updatedAt', type: 'date', description: 'Last modified timestamp (ISO)', sample: '2026-09-21T08:00:00.000Z', required: true },
    ],
  },
  {
    sheetName: 'Sales',
    title: 'Sales & Invoices',
    description: 'Completed customer invoices, line items, payments, and cashier attribution.',
    columns: [
      { name: 'id', type: 'string', description: 'Unique sale ID / UUID', sample: 'sale_1', required: true },
      { name: 'invoiceNumber', type: 'string', description: 'Receipt / Invoice identifier', sample: 'INV-2026-1001', required: true },
      { name: 'customerId', type: 'string', description: 'Linked customer ID or walk-in', sample: 'cust_walkin', required: true },
      { name: 'customerName', type: 'string', description: 'Customer name or Walk-in Customer', sample: 'Walk-in Customer', required: true },
      { name: 'customerPhone', type: 'string', description: 'Customer contact phone', sample: '+1 555-0199', required: false },
      { name: 'items', type: 'json', description: 'JSON array of invoice items', sample: '[{"productId":"prod_1","productName":"Coffee","quantity":2,"unitCost":8.5,"unitPrice":14.99,"subtotal":29.98}]', required: true },
      { name: 'subtotal', type: 'number', description: 'Items total before discounts and taxes', sample: '29.98', required: true },
      { name: 'discountAmount', type: 'number', description: 'Discount applied', sample: '0.00', required: true },
      { name: 'taxAmount', type: 'number', description: 'Sales tax collected', sample: '1.50', required: true },
      { name: 'total', type: 'number', description: 'Grand invoice total', sample: '31.48', required: true },
      { name: 'amountPaid', type: 'number', description: 'Amount received from customer', sample: '31.48', required: true },
      { name: 'balanceDue', type: 'number', description: 'Unpaid customer balance/credit', sample: '0.00', required: true },
      { name: 'paymentMethod', type: 'string', description: 'cash | bank_transfer | pos_card | credit', sample: 'cash', required: true },
      { name: 'paymentStatus', type: 'string', description: 'paid | partial | unpaid', sample: 'paid', required: true },
      { name: 'timestamp', type: 'date', description: 'Date and time of sale (ISO)', sample: '2026-09-21T09:15:00.000Z', required: true },
      { name: 'cashierName', type: 'string', description: 'Staff member who made the sale', sample: 'Sarah Jenkins', required: true },
      { name: 'notes', type: 'string', description: 'Invoice remarks or customer notes', sample: 'Paid in cash at Till 1', required: false },
    ],
  },
  {
    sheetName: 'Customers',
    title: 'Customer Directory & Debts',
    description: 'Customer contact info, credit limits, outstanding debts, and purchase history.',
    columns: [
      { name: 'id', type: 'string', description: 'Unique customer ID', sample: 'cust_1', required: true },
      { name: 'name', type: 'string', description: 'Full customer or business name', sample: 'Grand Metro Cafe', required: true },
      { name: 'phone', type: 'string', description: 'Phone number', sample: '+1 555-8821', required: true },
      { name: 'email', type: 'string', description: 'Email address', sample: 'orders@metrocafe.com', required: false },
      { name: 'address', type: 'string', description: 'Billing / delivery address', sample: '124 Commercial Way, Suite 4', required: false },
      { name: 'outstandingDebt', type: 'number', description: 'Current unpaid debt balance', sample: '350.00', required: true },
      { name: 'creditLimit', type: 'number', description: 'Maximum allowed credit', sample: '1000.00', required: true },
      { name: 'totalSpent', type: 'number', description: 'Lifetime purchase total', sample: '4820.50', required: true },
      { name: 'lastPurchaseDate', type: 'date', description: 'Date of most recent invoice', sample: '2026-09-18T14:30:00.000Z', required: false },
      { name: 'notes', type: 'string', description: 'Account remarks or credit notes', sample: 'Settles monthly on the 1st', required: false },
    ],
  },
  {
    sheetName: 'Suppliers',
    title: 'Vendors & Suppliers',
    description: 'Wholesale suppliers, contact persons, credit balances owed, and categories.',
    columns: [
      { name: 'id', type: 'string', description: 'Unique supplier ID', sample: 'supp_1', required: true },
      { name: 'companyName', type: 'string', description: 'Supplier / vendor company name', sample: 'Pacific Bean Importers Ltd', required: true },
      { name: 'contactPerson', type: 'string', description: 'Primary contact representative', sample: 'David Lin', required: true },
      { name: 'phone', type: 'string', description: 'Supplier phone', sample: '+1 555-4432', required: true },
      { name: 'email', type: 'string', description: 'Supplier email', sample: 'sales@pacificbean.com', required: false },
      { name: 'address', type: 'string', description: 'Warehouse / office address', sample: '88 Harbour Blvd, Docks', required: false },
      { name: 'category', type: 'string', description: 'Supply category', sample: 'Raw Beans & Packaging', required: true },
      { name: 'amountOwed', type: 'number', description: 'Payable balance owed to supplier', sample: '1200.00', required: true },
      { name: 'totalPurchased', type: 'number', description: 'Lifetime purchases from supplier', sample: '15400.00', required: true },
      { name: 'lastOrderDate', type: 'date', description: 'Date of last stock order', sample: '2026-09-15T11:00:00.000Z', required: false },
    ],
  },
  {
    sheetName: 'Expenses',
    title: 'Operating Expenses',
    description: 'Store operating overheads: rent, salaries, utilities, supplies, maintenance, etc.',
    columns: [
      { name: 'id', type: 'string', description: 'Unique expense ID', sample: 'exp_1', required: true },
      { name: 'title', type: 'string', description: 'Expense description / purpose', sample: 'Electricity & Internet Bill', required: true },
      { name: 'category', type: 'string', description: 'rent | salaries | transport | utilities | supplies | marketing | maintenance | other', sample: 'utilities', required: true },
      { name: 'amount', type: 'number', description: 'Expense amount paid', sample: '280.00', required: true },
      { name: 'accountId', type: 'string', description: 'Funding cash/bank account ID', sample: 'acc_cash_till', required: true },
      { name: 'paidTo', type: 'string', description: 'Recipient / vendor name', sample: 'City Power & Light Co', required: false },
      { name: 'timestamp', type: 'date', description: 'Date of payment (ISO)', sample: '2026-09-20T16:00:00.000Z', required: true },
      { name: 'recordedBy', type: 'string', description: 'Staff member who logged expense', sample: 'Marcus Bell', required: true },
      { name: 'notes', type: 'string', description: 'Receipt reference / check number', sample: 'Receipt #E-9912', required: false },
    ],
  },
  {
    sheetName: 'Accounts',
    title: 'Cash & Bank Accounts',
    description: 'Store physical cash tills, bank accounts, and mobile money ledgers.',
    columns: [
      { name: 'id', type: 'string', description: 'Unique account ID', sample: 'acc_cash_till', required: true },
      { name: 'name', type: 'string', description: 'Account display name', sample: 'Main Cash Register Till', required: true },
      { name: 'type', type: 'string', description: 'cash | bank | mobile_money', sample: 'cash', required: true },
      { name: 'accountNumber', type: 'string', description: 'Bank account number / IBAN', sample: 'TILL-01', required: false },
      { name: 'balance', type: 'number', description: 'Current available balance', sample: '1850.25', required: true },
      { name: 'currency', type: 'string', description: 'Currency symbol', sample: '$', required: true },
    ],
  },
  {
    sheetName: 'StockMovements',
    title: 'Inventory Audit & Stock Movements',
    description: 'Audit log of stock in, sales out, returns, and inventory adjustments.',
    columns: [
      { name: 'id', type: 'string', description: 'Unique movement ID', sample: 'mov_1', required: true },
      { name: 'productId', type: 'string', description: 'Associated product ID', sample: 'prod_1', required: true },
      { name: 'productName', type: 'string', description: 'Product title at time of event', sample: 'Premium Roast Coffee 500g', required: true },
      { name: 'type', type: 'string', description: 'sale | purchase | adjustment | return', sample: 'purchase', required: true },
      { name: 'quantity', type: 'number', description: 'Quantity changed (+ for in, - for out)', sample: '20', required: true },
      { name: 'previousStock', type: 'number', description: 'Stock level before movement', sample: '22', required: true },
      { name: 'newStock', type: 'number', description: 'Stock level after movement', sample: '42', required: true },
      { name: 'reason', type: 'string', description: 'Movement explanation or invoice #', sample: 'Supplier Restock PO-441', required: true },
      { name: 'timestamp', type: 'date', description: 'Movement timestamp (ISO)', sample: '2026-09-20T10:30:00.000Z', required: true },
      { name: 'performedBy', type: 'string', description: 'Staff member who executed change', sample: 'Alex Mercer', required: true },
    ],
  },
  {
    sheetName: 'Employees',
    title: 'Staff & Team Members',
    description: 'Staff directory, designations, attendance tracking, salaries, and commission.',
    columns: [
      { name: 'id', type: 'string', description: 'Unique employee ID', sample: 'emp_1', required: true },
      { name: 'name', type: 'string', description: 'Full staff name', sample: 'Sarah Jenkins', required: true },
      { name: 'role', type: 'string', description: 'owner | manager | cashier | inventory_clerk', sample: 'cashier', required: true },
      { name: 'phone', type: 'string', description: 'Contact phone', sample: '+1 555-9012', required: true },
      { name: 'email', type: 'string', description: 'Contact email', sample: 'sarah.j@store.com', required: true },
      { name: 'monthlySalary', type: 'number', description: 'Base monthly salary', sample: '2400.00', required: true },
      { name: 'commissionRate', type: 'number', description: 'Sales commission percentage', sample: '2.5', required: true },
      { name: 'attendanceStatus', type: 'string', description: 'present | absent | late | off', sample: 'present', required: true },
      { name: 'lastClockIn', type: 'date', description: 'Last clock-in timestamp (ISO)', sample: '2026-09-21T07:55:00.000Z', required: false },
      { name: 'joinedDate', type: 'date', description: 'Employment start date (ISO)', sample: '2025-03-01T00:00:00.000Z', required: true },
      { name: 'pin', type: 'string', description: 'Quick 4-digit terminal login PIN', sample: '1234', required: false },
      { name: 'password', type: 'string', description: 'Login password for email access', sample: 'apex123', required: false },
      { name: 'status', type: 'string', description: 'Account status (active | suspended)', sample: 'active', required: false },
      { name: 'customPermissions', type: 'json', description: 'JSON customized role permissions', sample: '{"canViewProfits":true,"canGiveDiscounts":true}', required: false },
      { name: 'lastLogin', type: 'date', description: 'Last login timestamp (ISO)', sample: '2026-09-23T08:00:00.000Z', required: false },
    ],
  },
  {
    sheetName: 'BusinessProfile',
    title: 'Business Configuration & Profile',
    description: 'Store name, contact info, physical address, tax rate, and receipt footer disclaimer.',
    columns: [
      { name: 'name', type: 'string', description: 'Business display brand', sample: 'Metro Mart & Retail', required: true },
      { name: 'businessName', type: 'string', description: 'Registered legal company name', sample: 'Metro Retail Group LLC', required: true },
      { name: 'ownerName', type: 'string', description: 'Proprietor / Director name', sample: 'Alex Mercer', required: true },
      { name: 'tagline', type: 'string', description: 'Store motto / tagline', sample: 'Quality Goods & Exceptional Service', required: true },
      { name: 'currency', type: 'string', description: 'Currency symbol ($, €, £, etc.)', sample: '$', required: true },
      { name: 'phone', type: 'string', description: 'Store hotline', sample: '+1 555-0100', required: true },
      { name: 'email', type: 'string', description: 'Store public email', sample: 'contact@metromart.com', required: true },
      { name: 'address', type: 'string', description: 'Store physical street address', sample: '450 Downtown Avenue, City Center', required: true },
      { name: 'taxRate', type: 'number', description: 'Sales tax rate percentage', sample: '5.0', required: true },
      { name: 'invoiceFooter', type: 'string', description: 'Printed bottom receipt message', sample: 'Thank you for shopping with us! Returns accepted within 14 days.', required: true },
    ],
  },
];

/**
 * Self-healing Google Apps Script template for the user to copy & paste
 * into Google Sheets > Extensions > Apps Script.
 */
export const SELF_HEALING_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * BUSINESS MANAGEMENT - PROFESSIONAL SELF-HEALING SPREADSHEET DATABASE
 * ==============================================================================
 * This script turns your Google Sheet into a professional, zero-login API database
 * for your Business Management Web App.
 *
 * FEATURES:
 * 1. Self-Healing Columns: Automatically detects headers in Row 1. If any column
 *    is missing, it appends it automatically without breaking!
 * 2. Column Order Agnostic: Works even if you re-order columns or insert your own
 *    custom notes columns in the sheet.
 * 3. Auto-Tab Creation: If a sheet tab was not manually created, it auto-creates it!
 * 4. Fast & Safe: Atomic batch updates and JSON serialization.
 *
 * HOW TO DEPLOY:
 * 1. In your Google Sheet, click 'Extensions' > 'Apps Script'.
 * 2. Replace everything in Code.gs with this entire code.
 * 3. Click 'Deploy' > 'New deployment'.
 * 4. Select type: 'Web app'.
 * 5. Description: 'Business Management DB'.
 * 6. Execute as: 'Me' (your email).
 * 7. Who has access: 'Anyone'. (Required for seamless access without login).
 * 8. Click 'Deploy', authorize permissions, and copy the Web App URL!
 * 9. Paste the Web App URL into your Business Management App settings.
 * ==============================================================================
 */

var SCHEMAS = {
  'Products': ['id', 'name', 'sku', 'category', 'costPrice', 'sellingPrice', 'stock', 'minStockAlert', 'unit', 'barcode', 'updatedAt'],
  'Sales': ['id', 'invoiceNumber', 'customerId', 'customerName', 'customerPhone', 'items', 'subtotal', 'discountAmount', 'taxAmount', 'total', 'amountPaid', 'balanceDue', 'paymentMethod', 'paymentStatus', 'timestamp', 'cashierName', 'notes'],
  'Customers': ['id', 'name', 'phone', 'email', 'address', 'outstandingDebt', 'creditLimit', 'totalSpent', 'lastPurchaseDate', 'notes'],
  'Suppliers': ['id', 'companyName', 'contactPerson', 'phone', 'email', 'address', 'category', 'amountOwed', 'totalPurchased', 'lastOrderDate'],
  'Expenses': ['id', 'title', 'category', 'amount', 'accountId', 'paidTo', 'timestamp', 'recordedBy', 'notes'],
  'Accounts': ['id', 'name', 'type', 'accountNumber', 'balance', 'currency'],
  'StockMovements': ['id', 'productId', 'productName', 'type', 'quantity', 'previousStock', 'newStock', 'reason', 'timestamp', 'performedBy'],
  'Employees': ['id', 'name', 'role', 'phone', 'email', 'monthlySalary', 'commissionRate', 'attendanceStatus', 'lastClockIn', 'joinedDate', 'pin', 'password', 'status', 'customPermissions', 'lastLogin'],
  'BusinessProfile': ['name', 'businessName', 'ownerName', 'tagline', 'currency', 'phone', 'email', 'address', 'taxRate', 'invoiceFooter']
};

/**
 * Handle HTTP GET Requests (Health check, fetch all data, fetch single sheet)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getAll';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === 'ping' || action === 'test') {
      return jsonResponse({
        status: 'success',
        message: 'Connected to Google Sheets Database successfully',
        spreadsheetTitle: ss.getName(),
        sheets: ss.getSheets().map(function(s) { return s.getName(); }),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getSchema') {
      return jsonResponse({
        status: 'success',
        schemas: SCHEMAS
      });
    }

    // Default: Return all records from all sheets
    var db = {};
    for (var sheetName in SCHEMAS) {
      db[lowerFirst(sheetName)] = readSheetData(ss, sheetName, SCHEMAS[sheetName]);
    }

    // Unpack profile if present as single object
    if (db.businessProfile && db.businessProfile.length > 0) {
      db.profile = db.businessProfile[0];
    }

    return jsonResponse({
      status: 'success',
      data: db,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Handle HTTP POST Requests (Sync all data, append/update records)
 * Includes LockService to prevent concurrency collisions & quota exhaustion.
 */
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getScriptLock();
  
  // Wait up to 20 seconds for any concurrent cashier write to complete safely
  var acquired = lock.tryLock(20000);
  if (!acquired) {
    return jsonResponse({
      status: 'error',
      message: 'Database busy with another staff sync. Please retry in a few seconds.'
    });
  }

  try {
    var contents = e.postData ? e.postData.contents : '';
    if (!contents) {
      return jsonResponse({ status: 'error', message: 'No request payload received.' });
    }

    var payload = JSON.parse(contents);
    var action = payload.action || 'syncAll';

    if (action === 'syncAll' && payload.data) {
      var d = payload.data;
      var collections = {
        'Products': d.products || [],
        'Sales': d.sales || [],
        'Customers': d.customers || [],
        'Suppliers': d.suppliers || [],
        'Expenses': d.expenses || [],
        'Accounts': d.accounts || [],
        'StockMovements': d.stockMovements || [],
        'Employees': d.employees || [],
        'BusinessProfile': d.profile ? [d.profile] : []
      };

      for (var sheetName in collections) {
        writeSheetData(ss, sheetName, SCHEMAS[sheetName], collections[sheetName]);
      }

      return jsonResponse({
        status: 'success',
        message: 'All sheets synchronized and self-healed successfully',
        syncedSheets: Object.keys(collections),
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Self-healing column & header resolver:
 * Ensures sheet exists, inspects Row 1, and appends any missing headers!
 */
function ensureSheetAndHeaders(ss, sheetName, expectedHeaders) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    // Self-healing: Automatically create tab if not yet present
    sheet = ss.insertSheet(sheetName);
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastCol === 0 || lastRow === 0) {
    // Empty sheet: write all expected headers
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    formatHeaderRow(sheet, expectedHeaders.length);
    return {
      sheet: sheet,
      headers: expectedHeaders,
      colMap: makeColMap(expectedHeaders)
    };
  }

  // Inspect existing headers
  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });

  var lowerCurrent = currentHeaders.map(function(h) { return h.toLowerCase(); });
  var missingHeaders = [];

  for (var i = 0; i < expectedHeaders.length; i++) {
    var exp = expectedHeaders[i];
    if (lowerCurrent.indexOf(exp.toLowerCase()) === -1) {
      missingHeaders.push(exp);
    }
  }

  // Self-healing: Append any missing columns to Row 1
  if (missingHeaders.length > 0) {
    var startCol = lastCol + 1;
    sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
    currentHeaders = currentHeaders.concat(missingHeaders);
    formatHeaderRow(sheet, currentHeaders.length);
  }

  return {
    sheet: sheet,
    headers: currentHeaders,
    colMap: makeColMap(currentHeaders)
  };
}

/**
 * Creates case-insensitive mapping: { 'name': 1, 'sku': 2 } (1-indexed)
 */
function makeColMap(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i].trim().toLowerCase();
    if (key) {
      map[key] = i; // 0-indexed column offset in row array
    }
  }
  return map;
}

/**
 * Read data from sheet with column-name resolution
 */
function readSheetData(ss, sheetName, expectedHeaders) {
  var resolved = ensureSheetAndHeaders(ss, sheetName, expectedHeaders);
  var sheet = resolved.sheet;
  var colMap = resolved.colMap;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow <= 1 || lastCol === 0) {
    return [];
  }

  var rawValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var records = [];

  for (var r = 0; r < rawValues.length; r++) {
    var row = rawValues[r];
    var isBlank = row.every(function(val) { return val === '' || val === null; });
    if (isBlank) continue;

    var record = {};
    for (var k = 0; k < expectedHeaders.length; k++) {
      var headerKey = expectedHeaders[k];
      var colIdx = colMap[headerKey.toLowerCase()];

      if (colIdx !== undefined && colIdx < row.length) {
        var cellVal = row[colIdx];

        // Parse JSON strings (e.g. items array or customPermissions object)
        if ((headerKey === 'items' || headerKey === 'customPermissions') && typeof cellVal === 'string' && (cellVal.indexOf('[') === 0 || cellVal.indexOf('{') === 0)) {
          try {
            record[headerKey] = JSON.parse(cellVal);
          } catch(e) {
            record[headerKey] = headerKey === 'items' ? [] : {};
          }
        } else if (cellVal instanceof Date) {
          record[headerKey] = cellVal.toISOString();
        } else {
          record[headerKey] = cellVal;
        }
      } else {
        record[headerKey] = '';
      }
    }
    records.push(record);
  }

  return records;
}

/**
 * Write/replace all data rows in a sheet with self-healing column mapping
 */
function writeSheetData(ss, sheetName, expectedHeaders, records) {
  var resolved = ensureSheetAndHeaders(ss, sheetName, expectedHeaders);
  var sheet = resolved.sheet;
  var colMap = resolved.colMap;
  var totalCols = sheet.getLastColumn();

  // Clear existing data rows (keep Row 1 headers)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, totalCols).clearContent();
  }

  if (!records || records.length === 0) {
    return;
  }

  var rowsToWrite = [];

  for (var i = 0; i < records.length; i++) {
    var rec = records[i];
    var row = new Array(totalCols);

    // Default all cells in row to empty string
    for (var c = 0; c < totalCols; c++) {
      row[c] = '';
    }

    // Populate values according to header column positions
    for (var key in rec) {
      var lowerKey = key.toLowerCase();
      var colIndex = colMap[lowerKey];
      if (colIndex !== undefined && colIndex < totalCols) {
        var val = rec[key];
        if (typeof val === 'object' && val !== null) {
          row[colIndex] = JSON.stringify(val);
        } else if (val === undefined || val === null) {
          row[colIndex] = '';
        } else {
          row[colIndex] = val;
        }
      }
    }

    rowsToWrite.push(row);
  }

  if (rowsToWrite.length > 0) {
    sheet.getRange(2, 1, rowsToWrite.length, totalCols).setValues(rowsToWrite);
  }
}

/**
 * Format headers nicely: Bold, dark slate background, white text, frozen Row 1
 */
function formatHeaderRow(sheet, numCols) {
  try {
    var headerRange = sheet.getRange(1, 1, 1, numCols);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0f172a');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } catch(e) {}
}

function lowerFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Extract Google Spreadsheet ID from various URL formats
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  // If user pasted a bare ID
  if (/^[a-zA-Z0-9-_]{25,60}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

/**
 * Fetch rows directly from a Google Sheet tab using the public Google Visualization API
 */
export async function fetchSheetViaGviz(spreadsheetId: string, sheetName: string): Promise<any[]> {
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      sheetName
    )}&_t=${Date.now()}`;
    const res = await fetch(gvizUrl, { mode: 'cors' });
    if (!res.ok) return [];
    const text = await res.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return [];
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    if (!parsed.table || !parsed.table.cols || !parsed.table.rows) return [];

    const cols: string[] = parsed.table.cols.map((c: any) => (c.label || c.id || '').trim());
    const rows = parsed.table.rows;

    const results: any[] = [];
    for (const r of rows) {
      if (!r.c) continue;
      const obj: any = {};
      let hasData = false;
      for (let i = 0; i < cols.length; i++) {
        const colKey = cols[i];
        if (!colKey) continue;
        const cell = r.c[i];
        let val = cell ? cell.v : '';
        if (val !== null && val !== undefined && val !== '') {
          hasData = true;
        }
        if (
          (colKey === 'items' || colKey === 'customPermissions') &&
          typeof val === 'string' &&
          (val.startsWith('{') || val.startsWith('['))
        ) {
          try {
            val = JSON.parse(val);
          } catch (e) {}
        }
        obj[colKey] = val;
      }
      if (hasData) {
        results.push(obj);
      }
    }
    return results;
  } catch (e) {
    return [];
  }
}

/**
 * Test Google Apps Script Web App connection or direct Google Spreadsheet
 */
export async function testSheetsConnection(scriptUrl: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetTitle?: string;
  sheets?: string[];
}> {
  if (!scriptUrl || !scriptUrl.trim()) {
    return { success: false, message: 'Google Apps Script or Spreadsheet URL is required.' };
  }

  const cleanUrl = scriptUrl.trim();

  // If user passed a direct Google Spreadsheet link
  const spreadsheetId = extractSpreadsheetId(cleanUrl);
  if (spreadsheetId && !cleanUrl.includes('script.google.com')) {
    try {
      recordApiCall('read');
      const products = await fetchSheetViaGviz(spreadsheetId, 'Products');
      const employees = await fetchSheetViaGviz(spreadsheetId, 'Employees');
      return {
        success: true,
        message: 'Connected directly to Google Spreadsheet. Ready to display data.',
        spreadsheetTitle: 'Live Google Spreadsheet',
        sheets: ['Products', 'Sales', 'Customers', 'Suppliers', 'Expenses', 'Employees', 'Accounts', 'StockMovements', 'BusinessProfile'],
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'Could not fetch from spreadsheet link. Ensure the sheet has "Anyone with the link can view" enabled, or use the Apps Script Web App URL.',
      };
    }
  }

  const testUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=test&_t=${Date.now()}`;

  try {
    const res = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    if (!res.ok) {
      return {
        success: false,
        message: `HTTP Error: ${res.status} ${res.statusText}`,
      };
    }

    const data = await res.json();
    if (data.status === 'success') {
      return {
        success: true,
        message: data.message || 'Connected to Google Sheets Database successfully',
        spreadsheetTitle: data.spreadsheetTitle,
        sheets: data.sheets,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Spreadsheet returned an error.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message:
        err.message ||
        'Failed to reach Google Apps Script URL. Check permissions (Who has access: Anyone) or CORS.',
    };
  }
}

const QUOTA_STORAGE_KEY = 'biz_mgr_sheets_quota_v1';

export interface ApiQuotaStats {
  date: string;
  totalCallsToday: number;
  readsToday: number;
  writesToday: number;
  dailySafeCeiling: number;
  lastCallTimestamp: string | null;
  quotaHealth: 'optimal' | 'moderate' | 'high';
}

export function recordApiCall(type: 'read' | 'write') {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    let stats: { date: string; reads: number; writes: number; lastCall: string } = {
      date: today,
      reads: 0,
      writes: 0,
      lastCall: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        stats = parsed;
      }
    }
    if (type === 'read') stats.reads += 1;
    if (type === 'write') stats.writes += 1;
    stats.lastCall = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    stats.date = today;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {}
}

export function getApiQuotaStats(): ApiQuotaStats {
  const today = new Date().toISOString().split('T')[0];
  let reads = 0;
  let writes = 0;
  let lastCall: string | null = null;
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        reads = parsed.reads || 0;
        writes = parsed.writes || 0;
        lastCall = parsed.lastCall || null;
      }
    }
  } catch (e) {}

  const total = reads + writes;
  // Google Apps Script limit is 20,000 to 50,000 calls/day. 1,500 is super-safe (<5%).
  const safeCeiling = 1500;
  let health: 'optimal' | 'moderate' | 'high' = 'optimal';
  if (total > 600) health = 'moderate';
  if (total > 1200) health = 'high';

  return {
    date: today,
    totalCallsToday: total,
    readsToday: reads,
    writesToday: writes,
    dailySafeCeiling: safeCeiling,
    lastCallTimestamp: lastCall,
    quotaHealth: health,
  };
}

/**
 * Fetch all collections from Google Sheets
 */
export async function fetchAllFromSheets(scriptUrl: string): Promise<{
  success: boolean;
  data?: {
    products?: Product[];
    sales?: Sale[];
    customers?: Customer[];
    suppliers?: Supplier[];
    expenses?: Expense[];
    accounts?: Account[];
    stockMovements?: StockMovement[];
    employees?: Employee[];
    profile?: BusinessProfile;
  };
  message?: string;
}> {
  if (!scriptUrl || !scriptUrl.trim()) {
    return { success: false, message: 'No Google Apps Script or Spreadsheet URL specified.' };
  }

  const cleanUrl = scriptUrl.trim();

  // If user provided direct Google Spreadsheet link, fetch directly via Google Visualization API
  const spreadsheetId = extractSpreadsheetId(cleanUrl);
  if (spreadsheetId && !cleanUrl.includes('script.google.com')) {
    try {
      recordApiCall('read');
      const [
        products,
        sales,
        customers,
        suppliers,
        expenses,
        accounts,
        stockMovements,
        employees,
        profileRows,
      ] = await Promise.all([
        fetchSheetViaGviz(spreadsheetId, 'Products'),
        fetchSheetViaGviz(spreadsheetId, 'Sales'),
        fetchSheetViaGviz(spreadsheetId, 'Customers'),
        fetchSheetViaGviz(spreadsheetId, 'Suppliers'),
        fetchSheetViaGviz(spreadsheetId, 'Expenses'),
        fetchSheetViaGviz(spreadsheetId, 'Accounts'),
        fetchSheetViaGviz(spreadsheetId, 'StockMovements'),
        fetchSheetViaGviz(spreadsheetId, 'Employees'),
        fetchSheetViaGviz(spreadsheetId, 'BusinessProfile'),
      ]);

      const profileObj = profileRows && profileRows.length > 0 ? (profileRows[0] as BusinessProfile) : undefined;

      return {
        success: true,
        data: {
          products: products as Product[],
          sales: sales as Sale[],
          customers: customers as Customer[],
          suppliers: suppliers as Supplier[],
          expenses: expenses as Expense[],
          accounts: accounts as Account[],
          stockMovements: stockMovements as StockMovement[],
          employees: employees as Employee[],
          profile: profileObj,
        },
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error fetching spreadsheet tabs directly.' };
    }
  }

  const getUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getAll&_t=${Date.now()}`;

  try {
    recordApiCall('read');
    const res = await fetch(getUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    if (!res.ok) {
      return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
    }

    const json = await res.json();
    if (json.status === 'success' && json.data) {
      return { success: true, data: json.data };
    } else {
      return { success: false, message: json.message || 'Error fetching spreadsheet data.' };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error fetching from Sheets.' };
  }
}

/**
 * Push all app collections to Google Sheets
 */
export async function pushAllToSheets(
  scriptUrl: string,
  data: {
    products: Product[];
    sales: Sale[];
    customers: Customer[];
    suppliers: Supplier[];
    expenses: Expense[];
    accounts: Account[];
    stockMovements: StockMovement[];
    employees: Employee[];
    profile: BusinessProfile;
  }
): Promise<{ success: boolean; message: string }> {
  if (!scriptUrl || !scriptUrl.trim()) {
    return { success: false, message: 'Google Apps Script Web App URL is required.' };
  }

  const cleanUrl = scriptUrl.trim();

  try {
    recordApiCall('write');
    // Send as text/plain to avoid preflight CORS check in Google Apps Script
    const res = await fetch(cleanUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncAll',
        data,
      }),
      redirect: 'follow',
    });

    if (!res.ok) {
      return { success: false, message: `HTTP ${res.status}: ${res.statusText}` };
    }

    const json = await res.json();
    if (json.status === 'success') {
      return {
        success: true,
        message: json.message || 'All records successfully synchronized to Google Sheets!',
      };
    } else {
      return { success: false, message: json.message || 'Spreadsheet returned error on save.' };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error pushing to Google Sheets. Verify Web App deployment.',
    };
  }
}
