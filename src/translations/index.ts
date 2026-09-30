export type Language = 'en' | 'pt';

export interface TranslationDictionary {
  [key: string]: any;

  // Navigation
  overview: string;
  sales: string;
  inventory: string;
  customers: string;
  suppliers: string;
  expenses: string;
  staff: string;
  cash_bank: string;
  reports: string;
  settings: string;

  // Header
  quickSale: string;
  cloudDatabase: string;
  syncing: string;
  syncError: string;
  connected: string;
  unlinked: string;
  live: string;
  lockScreen: string;
  signOut: string;
  alerts: string;

  // Settings
  settingsTitleDb: string;
  settingsTitleStore: string;
  settingsSubtitleDb: string;
  settingsSubtitleStore: string;
  tabCloudDatabase: string;
  tabStoreProfile: string;
  tabCurrencyTax: string;
  tabLanguage: string;

  // Store Profile Form
  storeContactInfo: string;
  businessName: string;
  ownerName: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;

  // Currency & Tax
  currencyTerms: string;
  currencySymbol: string;
  salesTax: string;
  invoiceFooter: string;

  // Language Section
  languageSettings: string;
  languageSubtitle: string;
  english: string;
  englishDesc: string;
  portuguese: string;
  portugueseDesc: string;

  // Actions & Common
  saveChanges: string;
  saved: string;
  cancel: string;
  close: string;
  delete: string;
  edit: string;
  search: string;
  filter: string;
  export: string;
  actions: string;
  confirm: string;
  status: string;
  date: string;
  category: string;
  description: string;
  amount: string;
  loading: string;
  viewAll: string;
  back: string;
  all: string;
  active: string;
  suspended: string;
  total: string;
  success: string;
  error: string;

  // Cloud Database Panel
  cloudDbTitle: string;
  cloudDbSubtitle: string;
  pullData: string;
  pushAll: string;
  testConnection: string;
  testing: string;
  syncPolicy: string;
  syncPolicyDesc: string;
  smartBatch: string;
  smartBatchDesc: string;
  interval15m: string;
  interval15mDesc: string;
  manualPush: string;
  manualPushDesc: string;
  callsToday: string;
  inQueue: string;
  lastSynced: string;

  // Sales & Invoice Modal
  walkInCustomer: string;
  enterClient: string;
  saveInSystem: string;
  customerAccount: string;
  clientNamePlaceholder: string;
  phoneOptional: string;
  paymentMethod: string;
  cash: string;
  bankTransfer: string;
  mobileMoney: string;
  credit: string;
  posCard: string;
  completeSale: string;
  newSaleTitle: string;
  itemsInCart: string;
  emptyCartPrompt: string;
  unitPrice: string;
  lineTotal: string;
  subtotal: string;
  discount: string;
  tax: string;
  grandTotal: string;
  amountPaid: string;
  balanceDue: string;
  changeDue: string;
  browseCatalog: string;
  searchProductPlaceholder: string;
  barcodePrompt: string;
  inStock: string;
  outOfStock: string;
  scanBarcode: string;
  addCustomItem: string;

  // Receipt & Print
  receiptTitle: string;
  printReceipt: string;
  savePdf: string;
  generatingPdf: string;
  invoiceNo: string;
  dateTime: string;
  customer: string;
  issuedBy: string;
  item: string;
  qty: string;
  price: string;
  fullPaymentReceived: string;
  paidInFull: string;
  notes: string;
  thankYouBusiness: string;
  goodsPurchasedCondition: string;
  phoneLabel: string;
  emailLabel: string;
  pdfDownloadSuccess: string;
  pdfGenerating: string;

  // Login & Authentication
  terminalAccess: string;
  lockedSessionFor: string;
  secureStaffAuth: string;
  protectedBadge: string;
  quickPin: string;
  password: string;
  enterPinPrompt: string;
  staffIdentifier: string;
  clear: string;
  signIn: string;
  switchStaff: string;
  forgotPin: string;
  securityLockout: string;
  accessGranted: string;
  connectingToDatabase: string;
  syncingStaffCredentials: string;
  noStaffConfigured: string;
  initializeOwner: string;
  createOwner: string;
  unlockTerminal: string;
  enterPasswordPlaceholder: string;

  // Staff View
  staffHeaderTitle: string;
  teamMembers: string;
  clockedIn: string;
  addStaffAccount: string;
  readOnlyMode: string;
  staffLogins: string;
  attendance: string;
  monthlyPayroll: string;
  editStaff: string;
  newStaffAccount: string;
  fullName: string;
  role: string;
  roleOwner: string;
  roleManager: string;
  roleCashier: string;
  roleClerk: string;
  commissionRate: string;
  pinCode: string;
  accountStatus: string;
  permissionsMatrix: string;
  saveStaff: string;
  confidentialSuperior: string;
  protectedSuperior: string;
  myAccessibleTeam: string;
  allStaffOrganization: string;
  superiorNoAccess: string;
  privateSuperiorContact: string;
  executivePayrollRestricted: string;
  superiorRestrictedDesc: string;

  // Inventory / Products
  inventoryTitle: string;
  addNewProduct: string;
  editProduct: string;
  productName: string;
  sku: string;
  barcode: string;
  costPrice: string;
  sellingPrice: string;
  stockQty: string;
  minStockAlert: string;
  unitOfMeasure: string;
  margin: string;
  quickRestock: string;
  saveProduct: string;
  lowStockCount: string;
  totalProductsCount: string;
  inventoryValuation: string;

  // Customers & Debt
  customersTitle: string;
  addNewCustomer: string;
  editCustomer: string;
  customerName: string;
  creditLimit: string;
  outstandingDebt: string;
  totalSpent: string;
  collectDebt: string;
  saveCustomer: string;
  totalReceivables: string;

  // Suppliers & Payables
  suppliersTitle: string;
  addNewSupplier: string;
  editSupplier: string;
  supplierName: string;
  contactPerson: string;
  outstandingBalance: string;
  paySupplier: string;
  saveSupplier: string;
  totalPayables: string;

  // Expenses
  expensesTitle: string;
  recordExpense: string;
  expenseDescription: string;
  paidTo: string;
  paidFromAccount: string;
  saveExpense: string;
  totalExpensesMonth: string;

  // Finance / Cash & Bank
  cashBankTitle: string;
  totalAvailableFunds: string;
  addAccount: string;
  transferFunds: string;
  accountLabel: string;
  accountType: string;
  cashRegister: string;
  bankAccount: string;
  bankDetails: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  nibIban: string;
  swiftBic: string;
  initialBalance: string;
  saveAccount: string;
  sourceAccount: string;
  destAccount: string;
  transferAmount: string;
  executeTransfer: string;

  // Reports
  reportsTitle: string;
  grossRevenue: string;
  costOfGoodsSold: string;
  grossProfit: string;
  operatingExpenses: string;
  netProfit: string;
  salesVolume: string;
  profitMargin: string;

  // Quotations & Purchase Orders
  quotations: string;
  quotation: string;
  newQuotation: string;
  purchaseOrders: string;
  purchaseOrder: string;
  newPO: string;
  createPO: string;
  convertToSale: string;
  receiveGoods: string;
  saveAsQuotation: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Navigation
    overview: 'Overview',
    sales: 'Sales',
    inventory: 'Stock',
    customers: 'Customers',
    suppliers: 'Suppliers',
    expenses: 'Expenses',
    staff: 'Staff',
    cash_bank: 'Cash & Bank',
    reports: 'Reports',
    settings: 'Settings',

    // Header
    quickSale: '+ Sale',
    cloudDatabase: 'Cloud Database',
    syncing: 'Syncing...',
    syncError: 'Sync Error',
    connected: 'Connected',
    unlinked: 'Unlinked',
    live: 'Live',
    lockScreen: 'Lock Terminal',
    signOut: 'Sign Out',
    alerts: 'Alerts',

    // Settings
    settingsTitleDb: 'Settings & Cloud Database',
    settingsTitleStore: 'Store Settings & Profile',
    settingsSubtitleDb: 'Cloud database synchronization, store profile, currency, and language setup',
    settingsSubtitleStore: 'Manage store contact details, tax rate, receipt currency, and display language',
    tabCloudDatabase: 'Cloud Database',
    tabStoreProfile: 'Store Profile',
    tabCurrencyTax: 'Currency & Tax',
    tabLanguage: 'Language',

    // Store Profile Form
    storeContactInfo: 'Store & Contact Information',
    businessName: 'Business Name *',
    ownerName: 'Owner / Director Name',
    storePhone: 'Store Phone',
    storeEmail: 'Store Email',
    storeAddress: 'Physical Store Address (Printed on Invoices)',

    // Currency & Tax
    currencyTerms: 'Currency & Invoicing Terms',
    currencySymbol: 'Currency Symbol',
    salesTax: 'Default Sales Tax (%)',
    invoiceFooter: 'Receipt Footer Disclaimer',

    // Language Section
    languageSettings: 'System Display Language',
    languageSubtitle: 'Choose your preferred language for the interface, receipts, and menus.',
    english: 'English (US / International)',
    englishDesc: 'Default global interface and business terminology',
    portuguese: 'Português (Moçambique / Brasil / Portugal)',
    portugueseDesc: 'Interface completa em português com terminologia comercial',

    // Actions & Common
    saveChanges: 'Save Changes',
    saved: 'Saved!',
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search...',
    filter: 'Filter',
    export: 'Export',
    actions: 'Actions',
    confirm: 'Confirm',
    status: 'Status',
    date: 'Date',
    category: 'Category',
    description: 'Description',
    amount: 'Amount',
    loading: 'Loading...',
    viewAll: 'View All',
    back: 'Back',
    all: 'All',
    active: 'Active',
    suspended: 'Suspended',
    total: 'Total',
    success: 'Success',
    error: 'Error',

    // Cloud Database Panel
    cloudDbTitle: 'Cloud Database',
    cloudDbSubtitle: 'Real-time cloud database synchronization and backup',
    pullData: 'Pull from Cloud',
    pushAll: 'Push All to Cloud',
    testConnection: 'Test Link',
    testing: 'Testing...',
    syncPolicy: 'Sync Policy & Daily Quota',
    syncPolicyDesc: 'Automated background persistence rules with rate limit protection',
    smartBatch: 'Smart Auto-Batch',
    smartBatchDesc: 'Pushes queued mutations automatically every 60s',
    interval15m: '15-Min Interval',
    interval15mDesc: 'Aggregates requests into 15m bulk snapshots',
    manualPush: 'Manual Push',
    manualPushDesc: 'Syncs exclusively upon operator action',
    callsToday: 'Calls Today',
    inQueue: 'In Queue',
    lastSynced: 'Last synced',

    // Sales & Invoice Modal
    walkInCustomer: 'Walk-in Customer (Standard Retail)',
    enterClient: '+ One-time or New Client...',
    saveInSystem: 'Save Client to System',
    customerAccount: 'Customer Account',
    clientNamePlaceholder: 'Client Name (e.g. Maria Silva)',
    phoneOptional: 'Phone (Optional)',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    bankTransfer: 'Bank Transfer',
    mobileMoney: 'Mobile Money (M-Pesa / E-Mola)',
    credit: 'Store Credit / On Account',
    posCard: 'POS Card',
    completeSale: 'Complete Sale & Issue Receipt',
    newSaleTitle: 'New Sale & Invoice',
    itemsInCart: 'Items in Cart',
    emptyCartPrompt: 'Scan barcode or select products to add items to this sale',
    unitPrice: 'Unit Price',
    lineTotal: 'Line Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Sales Tax',
    grandTotal: 'Grand Total',
    amountPaid: 'Amount Tendered / Paid',
    balanceDue: 'Balance Due',
    changeDue: 'Change Due',
    browseCatalog: 'Browse Catalog',
    searchProductPlaceholder: 'Search product name, SKU, or barcode...',
    barcodePrompt: 'Scan or type barcode & Enter...',
    inStock: 'in stock',
    outOfStock: 'Out of Stock',
    scanBarcode: 'Scan Barcode',
    addCustomItem: '+ Custom Item',

    // Receipt & Print
    receiptTitle: 'Official Sales Receipt / Invoice',
    printReceipt: 'Print Receipt',
    savePdf: 'Save PDF',
    generatingPdf: 'Generating PDF...',
    invoiceNo: 'Invoice No',
    dateTime: 'Date & Time',
    customer: 'Customer',
    issuedBy: 'Issued By (Cashier)',
    item: 'Item',
    qty: 'Qty',
    price: 'Price',
    fullPaymentReceived: 'Full Payment Received',
    paidInFull: 'PAID IN FULL',
    notes: 'Notes',
    thankYouBusiness: 'Thank you for your business!',
    goodsPurchasedCondition: 'Goods inspected and received in good order. Please retain receipt for returns.',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    pdfDownloadSuccess: 'PDF downloaded successfully!',
    pdfGenerating: 'Rendering vector receipt...',

    // Login & Authentication
    terminalAccess: 'Terminal Access',
    lockedSessionFor: 'Locked session for',
    secureStaffAuth: 'Secure staff authentication',
    protectedBadge: 'Protected',
    quickPin: 'Quick PIN',
    password: 'Password',
    enterPinPrompt: 'Enter 4-digit PIN to authenticate',
    staffIdentifier: 'Staff Work Email or Username',
    clear: 'Clear',
    signIn: 'Sign In',
    switchStaff: 'Switch Staff Account',
    forgotPin: 'Forgot PIN or account?',
    securityLockout: 'Security lockout active: Retry in',
    accessGranted: 'Access Granted',
    connectingToDatabase: 'Connecting to Database',
    syncingStaffCredentials: 'Synchronizing secure staff credentials and terminal profiles...',
    noStaffConfigured: 'No staff accounts configured',
    initializeOwner: 'Initialize your store owner account to get started with full privileges.',
    createOwner: 'Create Owner',
    unlockTerminal: 'Unlock Terminal',
    enterPasswordPlaceholder: 'Enter account password',

    // Staff View
    staffHeaderTitle: 'Staff, Logins & Roles',
    teamMembers: 'team members',
    clockedIn: 'clocked in',
    addStaffAccount: 'Add Staff Member',
    readOnlyMode: 'Read-Only Mode',
    staffLogins: 'Staff Logins',
    attendance: 'Attendance',
    monthlyPayroll: 'Monthly Payroll',
    editStaff: 'Edit Staff Account',
    newStaffAccount: 'New Staff Account',
    fullName: 'Full Name',
    role: 'Assigned Role',
    roleOwner: 'Store Owner (Super Admin)',
    roleManager: 'Duty Manager',
    roleCashier: 'POS Cashier',
    roleClerk: 'Inventory Clerk',
    commissionRate: 'Sales Commission Rate (%)',
    pinCode: '4-Digit Login PIN',
    accountStatus: 'Account Status',
    permissionsMatrix: 'Custom Permissions & Privileges',
    saveStaff: 'Save Staff Member',
    confidentialSuperior: 'Confidential (Superior Role)',
    protectedSuperior: 'Protected Superior',
    myAccessibleTeam: 'My Accessible Team (Peers & Subordinates)',
    allStaffOrganization: 'All Staff Organization',
    superiorNoAccess: 'Superior Role • No Access',
    privateSuperiorContact: 'Confidential • Superior Role',
    executivePayrollRestricted: 'Executive Access Required',
    superiorRestrictedDesc: 'Details of superior accounts are confidential and restricted.',

    // Inventory / Products
    inventoryTitle: 'Inventory & Stock Management',
    addNewProduct: 'Add New Product',
    editProduct: 'Edit Product Details',
    productName: 'Product Name *',
    sku: 'SKU Code',
    barcode: 'Barcode / UPC',
    costPrice: 'Cost Price',
    sellingPrice: 'Selling Price',
    stockQty: 'Current Stock Quantity',
    minStockAlert: 'Low Stock Alert Threshold',
    unitOfMeasure: 'Unit of Measure',
    margin: 'Profit Margin',
    quickRestock: 'Restock',
    saveProduct: 'Save Product',
    lowStockCount: 'Low Stock Items',
    totalProductsCount: 'Total Products',
    inventoryValuation: 'Stock Valuation',

    // Customers & Debt
    customersTitle: 'Customer Accounts & Credit Ledger',
    addNewCustomer: 'Add New Customer',
    editCustomer: 'Edit Customer',
    customerName: 'Customer Name *',
    creditLimit: 'Credit Limit',
    outstandingDebt: 'Outstanding Balance',
    totalSpent: 'Total Purchases',
    collectDebt: 'Collect Payment',
    saveCustomer: 'Save Customer',
    totalReceivables: 'Total Receivables (Debt)',

    // Suppliers & Payables
    suppliersTitle: 'Suppliers & Vendor Accounts',
    addNewSupplier: 'Add New Supplier',
    editSupplier: 'Edit Supplier',
    supplierName: 'Company / Supplier Name *',
    contactPerson: 'Contact Person',
    outstandingBalance: 'Amount Owed (Payable)',
    paySupplier: 'Pay Supplier',
    saveSupplier: 'Save Supplier',
    totalPayables: 'Total Payables Owed',

    // Expenses
    expensesTitle: 'Operating Expenses',
    recordExpense: 'Record Expense',
    expenseDescription: 'Expense Description *',
    paidTo: 'Paid To / Vendor',
    paidFromAccount: 'Paid From Account',
    saveExpense: 'Save Expense',
    totalExpensesMonth: 'Expenses This Month',

    // Finance / Cash & Bank
    cashBankTitle: 'Cash Registers & Bank Accounts',
    totalAvailableFunds: 'Total Liquid Funds',
    addAccount: 'Add Account',
    transferFunds: 'Transfer Funds',
    accountLabel: 'Internal Account Label *',
    accountType: 'Account Type',
    cashRegister: 'Cash Register Till',
    bankAccount: 'Bank Account',
    bankDetails: 'Official Banking Details',
    bankName: 'Bank Name',
    accountNumber: 'Account / Mobile Number',
    accountHolder: 'Account Holder / Beneficiary',
    nibIban: 'NIB / IBAN',
    swiftBic: 'SWIFT / BIC',
    initialBalance: 'Current Balance',
    saveAccount: 'Save Account',
    sourceAccount: 'Source Account',
    destAccount: 'Destination Account',
    transferAmount: 'Transfer Amount',
    executeTransfer: 'Execute Transfer',

    // Reports
    reportsTitle: 'Financial Performance & P&L',
    grossRevenue: 'Gross Revenue',
    costOfGoodsSold: 'Cost of Goods Sold (COGS)',
    grossProfit: 'Gross Profit',
    operatingExpenses: 'Operating Expenses',
    netProfit: 'Net Operating Profit',
    salesVolume: 'Total Transactions',
    profitMargin: 'Net Profit Margin',

    // Quotations & Purchase Orders
    quotations: 'Quotations',
    quotation: 'Quotation',
    newQuotation: 'New Quotation',
    purchaseOrders: 'Purchase Orders',
    purchaseOrder: 'Purchase Order',
    newPO: 'New PO',
    createPO: 'Create Purchase Order',
    convertToSale: 'Convert to Sale',
    receiveGoods: 'Receive Stock',
    saveAsQuotation: 'Save as Quotation',
  },

  pt: {
    // Navigation
    overview: 'Painel Geral',
    sales: 'Vendas',
    inventory: 'Stock',
    customers: 'Clientes',
    suppliers: 'Fornecedores',
    expenses: 'Despesas',
    staff: 'Funcionários',
    cash_bank: 'Caixa e Bancos',
    reports: 'Relatórios',
    settings: 'Configurações',

    // Header
    quickSale: '+ Venda',
    cloudDatabase: 'Base de Dados Cloud',
    syncing: 'A sincronizar...',
    syncError: 'Erro de Sincronização',
    connected: 'Conectado',
    unlinked: 'Não Vinculado',
    live: 'Ativo',
    lockScreen: 'Bloquear Terminal',
    signOut: 'Terminar Sessão',
    alerts: 'Notificações',

    // Settings
    settingsTitleDb: 'Configurações e Base de Dados Cloud',
    settingsTitleStore: 'Perfil da Loja e Configurações',
    settingsSubtitleDb: 'Sincronização em nuvem, dados da empresa, moeda e idioma do sistema',
    settingsSubtitleStore: 'Gerir contactos da loja, taxas de imposto, moeda dos recibos e idioma',
    tabCloudDatabase: 'Base de Dados Cloud',
    tabStoreProfile: 'Perfil da Loja',
    tabCurrencyTax: 'Moeda e Impostos',
    tabLanguage: 'Idioma / Language',

    // Store Profile Form
    storeContactInfo: 'Informações de Contacto da Loja',
    businessName: 'Nome da Empresa / Loja *',
    ownerName: 'Nome do Proprietário / Diretor',
    storePhone: 'Telefone da Loja',
    storeEmail: 'Email da Loja',
    storeAddress: 'Endereço Físico (Impresso nas Faturas/Recibos)',

    // Currency & Tax
    currencyTerms: 'Moeda e Condições de Faturação',
    currencySymbol: 'Símbolo da Moeda (ex: MT, R$, €)',
    salesTax: 'Taxa Padrão de IVA / Imposto (%)',
    invoiceFooter: 'Mensagem de Rodapé do Recibo',

    // Language Section
    languageSettings: 'Idioma de Apresentação do Sistema',
    languageSubtitle: 'Escolha o idioma preferido para a interface, formulários e recibos.',
    english: 'English (US / International)',
    englishDesc: 'Interface global com terminologia internacional',
    portuguese: 'Português (Moçambique / Brasil / Portugal)',
    portugueseDesc: 'Interface completa em português com terminologia comercial',

    // Actions & Common
    saveChanges: 'Guardar Alterações',
    saved: 'Guardado com sucesso!',
    cancel: 'Cancelar',
    close: 'Fechar',
    delete: 'Eliminar',
    edit: 'Editar',
    search: 'Pesquisar...',
    filter: 'Filtrar',
    export: 'Exportar',
    actions: 'Ações',
    confirm: 'Confirmar',
    status: 'Estado',
    date: 'Data',
    category: 'Categoria',
    description: 'Descrição',
    amount: 'Valor',
    loading: 'A carregar...',
    viewAll: 'Ver Todos',
    back: 'Voltar',
    all: 'Todos',
    active: 'Ativo',
    suspended: 'Suspenso',
    total: 'Total',
    success: 'Sucesso',
    error: 'Erro',

    // Cloud Database Panel
    cloudDbTitle: 'Base de Dados Cloud',
    cloudDbSubtitle: 'Sincronização em tempo real e cópias de segurança na nuvem',
    pullData: 'Carregar da Nuvem',
    pushAll: 'Enviar Tudo para a Nuvem',
    testConnection: 'Testar Ligação',
    testing: 'A testar...',
    syncPolicy: 'Política de Sincronização e Quota Diária',
    syncPolicyDesc: 'Regras de persistência automática com proteção contra limites de requisições',
    smartBatch: 'Lote Inteligente (Auto)',
    smartBatchDesc: 'Envia alterações pendentes a cada 60 segundos',
    interval15m: 'Intervalo de 15 Minutos',
    interval15mDesc: 'Agrupa pedidos em blocos periódicos de 15 minutos',
    manualPush: 'Envio Manual',
    manualPushDesc: 'Sincroniza apenas mediante clique do operador',
    callsToday: 'Chamadas Hoje',
    inQueue: 'Na Fila',
    lastSynced: 'Última sincronização',

    // Sales & Invoice Modal
    walkInCustomer: 'Cliente Balcão (Venda Direta / Retalho)',
    enterClient: '+ Novo Cliente ou Cliente Pontual...',
    saveInSystem: 'Registar Cliente no Sistema',
    customerAccount: 'Conta do Cliente',
    clientNamePlaceholder: 'Nome do Cliente (ex: Maria Silva)',
    phoneOptional: 'Telefone (Opcional)',
    paymentMethod: 'Forma de Pagamento',
    cash: 'Numerário (Dinheiro)',
    bankTransfer: 'Transferência Bancária',
    mobileMoney: 'Carteira Móvel (M-Pesa / E-Mola)',
    credit: 'A Crédito / Conta Corrente',
    posCard: 'Cartão POS / Débito',
    completeSale: 'Concluir Venda e Emitir Recibo',
    newSaleTitle: 'Nova Venda e Faturação',
    itemsInCart: 'Artigos no Carrinho',
    emptyCartPrompt: 'Leia o código de barras ou selecione produtos para adicionar à venda',
    unitPrice: 'Preço Unitário',
    lineTotal: 'Total da Linha',
    subtotal: 'Subtotal',
    discount: 'Desconto',
    tax: 'Imposto / IVA',
    grandTotal: 'Total Geral',
    amountPaid: 'Valor Entregue / Pago',
    balanceDue: 'Saldo Devedor',
    changeDue: 'Troco',
    browseCatalog: 'Navegar Catálogo',
    searchProductPlaceholder: 'Pesquisar nome do produto, SKU ou código...',
    barcodePrompt: 'Digitalize ou digite código e pressione Enter...',
    inStock: 'em stock',
    outOfStock: 'Esgotado',
    scanBarcode: 'Ler Código',
    addCustomItem: '+ Artigo Avulso',

    // Receipt & Print
    receiptTitle: 'Recibo Oficial de Venda / Fatura',
    printReceipt: 'Imprimir Recibo',
    savePdf: 'Guardar PDF',
    generatingPdf: 'A gerar PDF...',
    invoiceNo: 'Nº da Fatura',
    dateTime: 'Data e Hora',
    customer: 'Cliente',
    issuedBy: 'Emitido por (Operador)',
    item: 'Artigo',
    qty: 'Qtd',
    price: 'Preço',
    fullPaymentReceived: 'Pagamento Integral Efetuado',
    paidInFull: 'TOTALMENTE PAGO',
    notes: 'Notas',
    thankYouBusiness: 'Obrigado pela sua preferência!',
    goodsPurchasedCondition: 'Mercadorias conferidas e em bom estado. Conserve este recibo.',
    phoneLabel: 'Telefone',
    emailLabel: 'Email',
    pdfDownloadSuccess: 'PDF descarregado com sucesso!',
    pdfGenerating: 'A desenhar recibo vetorial...',

    // Login & Authentication
    terminalAccess: 'Acesso ao Terminal POS',
    lockedSessionFor: 'Sessão bloqueada para',
    secureStaffAuth: 'Autenticação segura de funcionários',
    protectedBadge: 'Protegido',
    quickPin: 'PIN Rápido',
    password: 'Palavra-passe / Senha',
    enterPinPrompt: 'Insira o PIN de 4 dígitos para autenticar',
    staffIdentifier: 'Email de Trabalho ou Utilizador do Funcionário',
    clear: 'Limpar',
    signIn: 'Entrar',
    switchStaff: 'Trocar Conta de Funcionário',
    forgotPin: 'Esqueceu o PIN ou conta?',
    securityLockout: 'Bloqueio de segurança ativo: Tente novamente em',
    accessGranted: 'Acesso Permitido',
    connectingToDatabase: 'A Conectar à Base de Dados',
    syncingStaffCredentials: 'A sincronizar credenciais seguras e perfis de terminais...',
    noStaffConfigured: 'Nenhuma conta de funcionário configurada',
    initializeOwner: 'Inicialize a sua conta de proprietário para começar com privilégios totais.',
    createOwner: 'Criar Proprietário',
    unlockTerminal: 'Desbloquear Terminal',
    enterPasswordPlaceholder: 'Insira a palavra-passe da conta',

    // Staff View
    staffHeaderTitle: 'Funcionários, Acessos e Funções',
    teamMembers: 'membros da equipa',
    clockedIn: 'em serviço',
    addStaffAccount: 'Adicionar Funcionário',
    readOnlyMode: 'Modo Somente Leitura',
    staffLogins: 'Contas de Acesso',
    attendance: 'Presenças',
    monthlyPayroll: 'Folha Salarial Mensal',
    editStaff: 'Editar Funcionário',
    newStaffAccount: 'Novo Registo de Funcionário',
    fullName: 'Nome Completo',
    role: 'Função Atribuída',
    roleOwner: 'Proprietário (Administrador Geral)',
    roleManager: 'Gerente de Turno',
    roleCashier: 'Operador de Caixa (Vendas)',
    roleClerk: 'Responsável de Stock',
    commissionRate: 'Taxa de Comissão de Venda (%)',
    pinCode: 'PIN de Acesso (4 Dígitos)',
    accountStatus: 'Estado da Conta',
    permissionsMatrix: 'Permissões e Privilégios Personalizados',
    saveStaff: 'Guardar Funcionário',
    confidentialSuperior: 'Confidencial (Cargo Superior)',
    protectedSuperior: 'Superior Protegido',
    myAccessibleTeam: 'Minha Equipa (Pares e Subordinados)',
    allStaffOrganization: 'Toda a Organização',
    superiorNoAccess: 'Cargo Superior • Sem Acesso',
    privateSuperiorContact: 'Dados Confidenciais • Cargo Superior',
    executivePayrollRestricted: 'Acesso Executivo Necessário',
    superiorRestrictedDesc: 'Os detalhes de contas com cargos superiores são confidenciais e restritos.',

    // Inventory / Products
    inventoryTitle: 'Gestão de Inventário e Stock',
    addNewProduct: 'Adicionar Produto',
    editProduct: 'Editar Detalhes do Produto',
    productName: 'Nome do Artigo / Produto *',
    sku: 'Código SKU',
    barcode: 'Código de Barras / UPC',
    costPrice: 'Preço de Custo',
    sellingPrice: 'Preço de Venda',
    stockQty: 'Quantidade Atual em Stock',
    minStockAlert: 'Limite de Alerta de Stock Baixo',
    unitOfMeasure: 'Unidade de Medida (ex: un, kg, cx)',
    margin: 'Margem de Lucro',
    quickRestock: 'Entrada de Stock',
    saveProduct: 'Guardar Produto',
    lowStockCount: 'Artigos com Stock Baixo',
    totalProductsCount: 'Total de Artigos',
    inventoryValuation: 'Valor Total em Stock',

    // Customers & Debt
    customersTitle: 'Contas Correntes de Clientes e Créditos',
    addNewCustomer: 'Adicionar Cliente',
    editCustomer: 'Editar Cliente',
    customerName: 'Nome do Cliente *',
    creditLimit: 'Limite de Crédito Permitido',
    outstandingDebt: 'Saldo Devedor / Dívida Atual',
    totalSpent: 'Total Comprado na Loja',
    collectDebt: 'Cobrar Dívida / Pagamento',
    saveCustomer: 'Guardar Cliente',
    totalReceivables: 'Total a Receber (Crédito)',

    // Suppliers & Payables
    suppliersTitle: 'Fornecedores e Contas a Pagar',
    addNewSupplier: 'Adicionar Fornecedor',
    editSupplier: 'Editar Fornecedor',
    supplierName: 'Nome da Empresa / Fornecedor *',
    contactPerson: 'Pessoa de Contacto',
    outstandingBalance: 'Valor em Dívida ao Fornecedor',
    paySupplier: 'Registar Pagamento',
    saveSupplier: 'Guardar Fornecedor',
    totalPayables: 'Total a Pagar (Passivo)',

    // Expenses
    expensesTitle: 'Despesas Operacionais',
    recordExpense: 'Registar Despesa',
    expenseDescription: 'Descrição da Despesa *',
    paidTo: 'Pago a (Beneficiário)',
    paidFromAccount: 'Pago a partir da Conta',
    saveExpense: 'Guardar Despesa',
    totalExpensesMonth: 'Despesas Este Mês',

    // Finance / Cash & Bank
    cashBankTitle: 'Caixas Registadoras e Contas Bancárias',
    totalAvailableFunds: 'Fundos Disponíveis (Total Líquido)',
    addAccount: 'Adicionar Conta',
    transferFunds: 'Transferir Fundos',
    accountLabel: 'Etiqueta Interna da Conta *',
    accountType: 'Tipo de Conta',
    cashRegister: 'Caixa Registadora / Gaveta',
    bankAccount: 'Conta Bancária',
    bankDetails: 'Dados Bancários Oficiais',
    bankName: 'Nome da Instituição Bancária',
    accountNumber: 'Número de Conta / Telemóvel',
    accountHolder: 'Titular da Conta / Beneficiário',
    nibIban: 'NIB / IBAN (Transferências Interbancárias)',
    swiftBic: 'Código SWIFT / BIC',
    initialBalance: 'Saldo Atual',
    saveAccount: 'Guardar Conta',
    sourceAccount: 'Conta de Origem',
    destAccount: 'Conta de Destino',
    transferAmount: 'Valor a Transferir',
    executeTransfer: 'Efetuar Transferência',

    // Reports
    reportsTitle: 'Desempenho Financeiro e DRE',
    grossRevenue: 'Faturação Bruta',
    costOfGoodsSold: 'Custo das Mercadorias Vendidas (CMV)',
    grossProfit: 'Lucro Bruto',
    operatingExpenses: 'Despesas Operacionais',
    netProfit: 'Resultado Líquido do Exercício',
    salesVolume: 'Total de Transações',
    profitMargin: 'Margem Líquida',

    // Quotations & Purchase Orders
    quotations: 'Orçamentos',
    quotation: 'Orçamento',
    newQuotation: 'Novo Orçamento',
    purchaseOrders: 'Ordens de Compra',
    purchaseOrder: 'Ordem de Compra',
    newPO: 'Nova OC',
    createPO: 'Criar Ordem de Compra',
    convertToSale: 'Converter em Venda',
    receiveGoods: 'Dar Entrada de Stock',
    saveAsQuotation: 'Guardar como Orçamento',
  },
};

export type TranslationHelper = TranslationDictionary & {
  (key: string, fallback?: string): string;
};

export const getTranslation = (lang: Language = 'en'): TranslationHelper => {
  const dict = translations[lang] || translations.en;
  const helperFn = (key: string, fallback?: string): string => {
    return (dict as any)[key] || fallback || key;
  };
  return Object.assign(helperFn, dict);
};
