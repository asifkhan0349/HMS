import React, { useState, useMemo, useCallback } from 'react';
import { useApp, mapInvoiceFromApi, mapPatientFromApi, mapMedicineFromApi, createCode, formatDate } from '../context/AppContext';
import { useCrud } from '../hooks/useCrud';
import { invoicesApi, patientsApi, medicinesApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import DeleteConfirmation from '../components/UI/DeleteConfirmation';
import Pagination from '../components/UI/Pagination';
import { Skeleton } from 'boneyard-js/react';
import { usePagination } from '../hooks/usePagination';

const Billing = () => {
  const { showToast, user, triggerGlobalRefresh } = useApp();
  const isDoctor = user?.role === 'Doctor';
  const isNurse = user?.role === 'Nurse';
  const isReception = user?.role === 'Reception';
  // canOperate: Admin + Reception — create invoices, mark paid/cancelled, download, send email
  const canOperate = !isDoctor && !isNurse;
  // canManage: Admin only — can also edit and delete invoices
  const canManage = canOperate && !isReception;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const { 
    data: invoices = [], 
    loading,
    addData: addInvoice,
    updateData: updateInvoice,
    removeData: deleteInvoice,
    loadData: loadInvoices
  } = useCrud(invoicesApi, mapInvoiceFromApi);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForView, setSelectedPatientForView] = useState(null);
  const [isPatientInvoicesModalOpen, setIsPatientInvoicesModalOpen] = useState(false);

  const { data: patients = [] } = useCrud(patientsApi, mapPatientFromApi);

  const getPatientId = useCallback((patientName) => {
    if (!patientName) return '-';
    const patient = patients.find(p => p.name?.trim().toLowerCase() === patientName.trim().toLowerCase());
    return patient ? patient.id : '-';
  }, [patients]);

  const totalPaidAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  }, [invoices]);

  const totalPendingAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + Math.max(0, (inv.amountValue || 0) - (inv.amountPaid || 0)), 0);
  }, [invoices]);

  // Build one-row-per-patient summary with aggregated totals
  const patientSummaryRows = useMemo(() => {
    const map = new Map();
    for (const inv of invoices) {
      const patientName = inv.patient;
      const patientId = getPatientId(patientName);
      const key = patientId !== '-' ? patientId : patientName;
      if (!map.has(key)) {
        map.set(key, {
          patientId,
          patientName,
          totalInvoiceAmount: 0,
          totalPaidAmount: 0,
          totalPendingAmount: 0,
          invoices: [],
        });
      }
      const row = map.get(key);
      row.totalInvoiceAmount += inv.amountValue || 0;
      row.totalPaidAmount += inv.amountPaid || 0;
      row.totalPendingAmount += Math.max(0, (inv.amountValue || 0) - (inv.amountPaid || 0));
      row.invoices.push(inv);
    }
    return Array.from(map.values());
  }, [invoices, patients, getPatientId]);

  const filteredPatientRows = patientSummaryRows.filter(row =>
    row.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.patientId.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    paginatedData: paginatedInvoices,
    currentPage,
    totalPages,
    rowsPerPage,
    totalItems,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(filteredPatientRows);
  
  const { data: medicines = [], loadData: loadMedicines } = useCrud(medicinesApi, mapMedicineFromApi);

  const BILLING_CATEGORIES = [
    'Doctor Consultation Fees',
    'Registration Fees',
    'Lab Tests',
    'Scan/Radiology',
    'Procedures/Treatments',
    'Room Charges',
    'Nursing Charges',
    'ICU Charges',
    'Medical Equipment Usage',
    'Surgery Charges',
    'Miscellaneous Charges',
    'Medicines/Pharmacy',
  ];

  const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Net Banking', 'Insurance'];
  const PAYMENT_STATUSES = ['Pending', 'Partial', 'Paid', 'Draft', 'Cancelled'];

  const [lineItems, setLineItems] = useState([]);
  const [newRow, setNewRow] = useState({
    category: 'Medicines/Pharmacy',
    name: '',
    description: '',
    quantity: '1',
    unitPrice: '',
    tax: '0',
    discount: '0',
  });

  const normalizeItem = (item) => {
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
    const taxPercentage = Math.min(100, Math.max(0, parseFloat(item.tax) || 0));
    const discountPercentage = Math.min(100, Math.max(0, parseFloat(item.discount) || 0));
    const subtotal = parseFloat((quantity * unitPrice).toFixed(2));
    const discountAmount = parseFloat((subtotal * (discountPercentage / 100)).toFixed(2));
    const taxableAmount = parseFloat((subtotal - discountAmount).toFixed(2));
    const taxAmount = parseFloat((taxableAmount * (taxPercentage / 100)).toFixed(2));
    const total = parseFloat((taxableAmount + taxAmount).toFixed(2));

    return {
      ...item,
      quantity,
      unitPrice,
      taxPercentage,
      discountPercentage,
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  };

  const lineItemsSubtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0),
    [lineItems]
  );

  const lineItemsTax = useMemo(
    () => lineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0),
    [lineItems]
  );

  const lineItemsDiscount = useMemo(
    () => lineItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0),
    [lineItems]
  );

  const lineItemsTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + (item.total || 0), 0),
    [lineItems]
  );

  const [formData, setFormData] = useState({
    patient: '',
    billingType: 'OP',
    admissionId: '',
    wardName: '',
    stayDuration: '',
    roomCharge: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    amountPaid: '',
    insuranceProvider: '',
    policyNumber: '',
    coveredAmount: '',
    remainingAmount: '',
    gstType: 'CGST_SGST',
    expectedPaymentDate: '',
  });

  const calculatedGst = useMemo(() => {
    const taxVal = parseFloat(lineItemsTax.toFixed(2));
    if (formData.gstType === 'IGST') {
      return {
        cgst: 0,
        sgst: 0,
        igst: taxVal,
      };
    }
    const halfTax = parseFloat((taxVal / 2).toFixed(2));
    return {
      cgst: halfTax,
      sgst: parseFloat((taxVal - halfTax).toFixed(2)),
      igst: 0,
    };
  }, [lineItemsTax, formData.gstType]);

  const effectiveTaxRate = useMemo(() => {
    const taxableBase = lineItemsSubtotal - lineItemsDiscount;
    return taxableBase > 0 ? (lineItemsTax / taxableBase) * 100 : 0;
  }, [lineItemsSubtotal, lineItemsDiscount, lineItemsTax]);
  const [isPatientSuggestionsVisible, setPatientSuggestionsVisible] = useState(false);

  const filteredPatients = useMemo(() => {
    const query = formData.patient.trim().toLowerCase();
    if (!query) return patients.slice(0, 8);
    return patients.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      p.id.toString().toLowerCase().includes(query)
    ).slice(0, 8);
  }, [patients, formData.patient]);

  const [validationErrors, setValidationErrors] = useState({});

  const roomChargeAmount = useMemo(() => {
    if (formData.billingType !== 'IP') return 0;
    const days = Math.max(0, parseInt(formData.stayDuration, 10) || 0);
    const rate = Math.max(0, parseFloat(formData.roomCharge) || 0);
    return parseFloat((days * rate).toFixed(2));
  }, [formData.billingType, formData.stayDuration, formData.roomCharge]);

  const invoiceTotal = useMemo(
    () => parseFloat((lineItemsTotal + roomChargeAmount).toFixed(2)),
    [lineItemsTotal, roomChargeAmount]
  );

  const amountPaidValue = Number(parseFloat(formData.amountPaid || 0));
  const dueAmountValue = parseFloat(Math.max(0, invoiceTotal - amountPaidValue).toFixed(2));

  const handleAddRow = () => {
    if (!newRow.name.trim()) {
      setValidationErrors((prev) => ({ ...prev, rowName: true }));
      showToast('Please enter an item name.', 'warning');
      return;
    }

    if (newRow.category === 'Medicines/Pharmacy') {
      const matched = medicines.find(m => m.name.toLowerCase() === newRow.name.trim().toLowerCase());
      if (!matched) {
        showToast('Selected medicine is not valid. Please choose from the list.', 'error');
        return;
      }
      const qty = parseInt(newRow.quantity, 10) || 1;
      if (matched.stock < qty) {
        showToast(`Cannot add item: Insufficient stock for ${matched.name}. Available: ${matched.stock}`, 'error');
        return;
      }
      newRow.unitPrice = matched.priceValue.toString();
      newRow.medicine_code = matched.id;
    }

    setValidationErrors((prev) => ({ ...prev, rowName: false }));
    setLineItems((prev) => [
      ...prev,
      normalizeItem({ rowId: Date.now(), ...newRow }),
    ]);

    setNewRow({
      category: 'Medicines/Pharmacy',
      name: '',
      description: '',
      quantity: '1',
      unitPrice: '',
      tax: '0',
      discount: '0',
    });
  };

  const updateLineItemField = (rowId, field, value) => {
    setLineItems((prev) => prev.map((item) => {
      if (item.rowId !== rowId) return item;
      if (field === 'quantity') {
        const qty = parseInt(value, 10) || 1;
        if (item.category === 'Medicines/Pharmacy') {
          const matched = medicines.find(m => m.name.toLowerCase() === item.name.trim().toLowerCase());
          if (matched && matched.stock < qty) {
            showToast(`Insufficient stock for ${item.name}. Available: ${matched.stock}`, 'warning');
            return normalizeItem({ ...item, [field]: matched.stock.toString() });
          }
        }
      }
      return normalizeItem({ ...item, [field]: value });
    }));
  };

  const removeLineItem = (rowId) => {
    setLineItems((prev) => prev.filter((i) => i.rowId !== rowId));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [emailFormData, setEmailFormData] = useState({ recipientEmail: '' });
  const [emailValidationError, setEmailValidationError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  const handleDownloadPdf = async (inv) => {
    setDownloadingPdfId(inv.id);
    try {
      await invoicesApi.downloadPdf(inv.apiId, inv.id);
      showToast(`Invoice ${inv.id} PDF downloaded successfully.`);
    } catch (error) {
      showToast(error.message || 'Failed to download PDF.', 'error');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentExpectedDate, setPaymentExpectedDate] = useState('');

  const [editFormData, setEditFormData] = useState({
    patient: '',
    amount: '',
    status: 'Pending',
    method: 'Cash',
    cgst: '',
    sgst: '',
    igst: '',
    expectedPaymentDate: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.patient.trim()) errors.patient = true;
    if (!formData.paymentMethod) errors.paymentMethod = true;
    if (formData.paymentStatus === 'Partial' && !formData.expectedPaymentDate) {
      errors.expectedPaymentDate = true;
    }
    if (lineItems.length === 0 && formData.billingType === 'OP') {
      errors.lineItems = true;
    }
    if (formData.billingType === 'IP' && (!formData.wardName.trim() || !formData.stayDuration || !formData.roomCharge)) {
      errors.ipDetails = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all required billing details and add at least one line item.', 'warning');
      return;
    }

    // Validate medicine stock before submitting invoice
    for (const item of lineItems) {
      if (item.category === 'Medicines/Pharmacy') {
        const matched = medicines.find(m => m.name.toLowerCase() === item.name.trim().toLowerCase());
        if (!matched) {
          showToast(`Medicine ${item.name} is not registered in inventory.`, 'error');
          return;
        }
        if (matched.stock < item.quantity) {
          showToast(`Insufficient stock for ${item.name}. Available: ${matched.stock}, Requested: ${item.quantity}`, 'error');
          return;
        }
      }
    }

    const paymentStatus = formData.paymentStatus;
    const status = paymentStatus === 'Paid' ? 'Paid' : paymentStatus === 'Partial' ? 'Partially Paid' : paymentStatus;
    const amountPaid = parseFloat(formData.amountPaid || 0);
    if (amountPaid > invoiceTotal) {
      showToast('Amount paid cannot be greater than the grand total.', 'error');
      return;
    }
    const dueAmount = parseFloat(Math.max(0, invoiceTotal - amountPaid).toFixed(2));

    try {
      await addInvoice({
        patient_name: formData.patient.trim(),
        billing_type: formData.billingType,
        invoice_date: new Date().toISOString().slice(0, 10),
        amount: invoiceTotal,
        amount_paid: amountPaid,
        due_amount: dueAmount,
        tax_total: lineItemsTax,
        discount_total: lineItemsDiscount,
        cgst: calculatedGst.cgst,
        sgst: calculatedGst.sgst,
        igst: calculatedGst.igst,
        status,
        payment_method: formData.paymentMethod,
        payment_status: paymentStatus,
        expected_payment_date: formData.paymentStatus === 'Partial' ? formData.expectedPaymentDate || null : null,
        admission_id: formData.admissionId.trim() || null,
        ward_name: formData.wardName.trim() || null,
        stay_duration_days: formData.billingType === 'IP' ? parseInt(formData.stayDuration, 10) || 0 : null,
        room_charge_per_day: formData.billingType === 'IP' ? parseFloat(formData.roomCharge || 0) : null,
        room_charges: formData.billingType === 'IP' ? roomChargeAmount : null,
        insurance_provider: formData.paymentMethod === 'Insurance' ? formData.insuranceProvider.trim() : null,
        policy_number: formData.paymentMethod === 'Insurance' ? formData.policyNumber.trim() : null,
        covered_amount: formData.paymentMethod === 'Insurance' ? parseFloat(formData.coveredAmount || 0) : null,
        remaining_amount: formData.paymentMethod === 'Insurance' ? parseFloat(formData.remainingAmount || 0) : null,
        invoice_code: createCode('INV'),
        line_items: lineItems.map((item) => ({
          category: item.category,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_percentage: item.taxPercentage,
          discount_percentage: item.discountPercentage,
          subtotal: item.subtotal,
          tax_amount: item.taxAmount,
          discount_amount: item.discountAmount,
          total: item.total,
          medicine_code: item.medicine_code || null,
        })),
      });

      showToast(`Invoice for ${formData.patient} created successfully.`);
      setIsModalOpen(false);
      triggerGlobalRefresh();
      if (loadMedicines) {
        loadMedicines();
      }
      setFormData({
        patient: '',
        billingType: 'OP',
        admissionId: '',
        wardName: '',
        stayDuration: '',
        roomCharge: '',
        paymentMethod: 'Cash',
        paymentStatus: 'Pending',
        amountPaid: '',
        insuranceProvider: '',
        policyNumber: '',
        coveredAmount: '',
        remainingAmount: '',
        gstType: 'CGST_SGST',
        expectedPaymentDate: '',
      });
      setLineItems([]);
      setNewRow({
        category: 'Medicines/Pharmacy',
        name: '',
        description: '',
        quantity: '1',
        unitPrice: '',
        tax: '0',
        discount: '0',
      });
      setValidationErrors({});
    } catch (error) {
      showToast(error.message || 'Unable to create the invoice.', 'error');
    }
  };

  const openEditModal = (inv) => {
    const matchedPatient = patients.find((patient) => patient.name === inv.patient);
    setEditingInvoice(inv);
    setEditFormData({
      patient: inv.patient,
      amount: inv.amountValue,
      status: inv.status,
      method: inv.method,
      cgst: inv.cgst?.toString() || '0.00',
      sgst: inv.sgst?.toString() || '0.00',
      igst: inv.igst?.toString() || '0.00',
      expectedPaymentDate: inv.expectedPaymentDate || '',
    });
    setEmailFormData({ recipientEmail: matchedPatient?.email || '' });
    setEmailValidationError('');
    setIsEmailSent(false);
    setEmailSentMessage('');
    setIsEditModalOpen(true);
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailValidationError('');
    setIsEmailSent(false);
    setEmailSentMessage('');
  };

  const openPaymentModal = (inv) => {
    setEditingInvoice(inv);
    setEditFormData({
      patient: inv.patient,
      amount: inv.amountValue,
      status: inv.status,
      method: inv.method,
    });
    const balance = (inv.amountValue || 0) - (inv.amountPaid || 0);
    setPaymentAmount(balance > 0 ? balance.toString() : '');
    setPaymentExpectedDate(inv.expectedPaymentDate || '');
    setValidationErrors({});
    setIsPaymentModalOpen(true);
  };

  const handleReceivePayment = async (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (amount <= 0) {
      showToast('Please enter a valid payment amount.', 'warning');
      return;
    }
    const maxAllowed = parseFloat((editingInvoice.amountValue - (editingInvoice.amountPaid || 0)).toFixed(2));
    if (amount > maxAllowed) {
      showToast(`Payment amount cannot be greater than the pending balance (₹${maxAllowed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).`, 'warning');
      return;
    }
    
    const newAmountPaid = parseFloat(((editingInvoice.amountPaid || 0) + amount).toFixed(2));
    const isFullyPaid = newAmountPaid >= parseFloat((editingInvoice.amountValue || 0).toFixed(2));
    const newStatus = isFullyPaid ? 'Paid' : 'Partially Paid';
    const isPartial = !isFullyPaid;

    if (isPartial && !paymentExpectedDate) {
      setValidationErrors(prev => ({ ...prev, paymentExpectedDate: true }));
      showToast('Please select the expected payment date for the remaining balance.', 'warning');
      return;
    }

    try {
      await updateInvoice(editingInvoice.apiId, { 
        amount_paid: newAmountPaid, 
        status: newStatus,
        expected_payment_date: isPartial ? paymentExpectedDate || null : null
      });
      showToast(`Payment of ₹${amount} received. Invoice marked as ${newStatus}.`);
      setIsPaymentModalOpen(false);
      const updatedInv = { ...editingInvoice, amountPaid: newAmountPaid, status: newStatus, expectedPaymentDate: isPartial ? paymentExpectedDate : '' };
      setEditingInvoice(updatedInv);
      setEditFormData({
        patient: updatedInv.patient,
        amount: updatedInv.amountValue,
        status: updatedInv.status,
        method: updatedInv.method,
      });
      const matchedPatient = patients.find((p) => p.name === updatedInv.patient);
      setEmailFormData({ recipientEmail: matchedPatient?.email || '' });
      setEmailValidationError('');
      setIsEmailSent(false);
      setEmailSentMessage('');
      setIsEmailModalOpen(true);
    } catch (error) {
      showToast(error.message || `Unable to process payment.`, 'error');
    }
  };

  const handleUpdateStatus = async (inv, newStatus) => {
    try {
      await updateInvoice(inv.apiId, { status: newStatus });
      showToast(`Invoice for ${inv.patient} marked as ${newStatus}.`);
    } catch (error) {
      showToast(error.message || `Unable to update status to ${newStatus}.`, 'error');
    }
  };

  const getEditStatus = () => {
    const newAmount = Number(editFormData.amount || 0);
    const currentPaid = editingInvoice?.amountPaid || 0;
    let status = editingInvoice?.status;
    if (currentPaid >= newAmount && newAmount > 0) {
      status = 'Paid';
    } else if (currentPaid > 0 && currentPaid < newAmount) {
      status = 'Partially Paid';
    } else if (currentPaid === 0 && status !== 'Cancelled') {
      status = 'Pending';
    }
    return status;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editFormData.patient.trim()) errors.patient = true;
    if (!editFormData.amount) errors.amount = true;
    if (getEditStatus() === 'Partially Paid' && !editFormData.expectedPaymentDate) {
      errors.expectedPaymentDate = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    try {
      const newAmount = Number(editFormData.amount);
      const currentPaid = editingInvoice.amountPaid || 0;
      if (currentPaid > newAmount) {
        showToast(`Invoice amount (₹${newAmount}) cannot be less than the amount already paid (₹${currentPaid}).`, 'error');
        return;
      }
      
      let dynamicStatus = editingInvoice.status;
      if (currentPaid >= newAmount && newAmount > 0) {
        dynamicStatus = 'Paid';
      } else if (currentPaid > 0 && currentPaid < newAmount) {
        dynamicStatus = 'Partially Paid';
      } else if (currentPaid === 0 && dynamicStatus !== 'Cancelled') {
        dynamicStatus = 'Pending';
      }

      const newCgst = parseFloat(editFormData.cgst) || 0;
      const newSgst = parseFloat(editFormData.sgst) || 0;
      const newIgst = parseFloat(editFormData.igst) || 0;
      const newTaxTotal = newCgst + newSgst + newIgst;

      const payload = {
        patient_name: editFormData.patient,
        amount: newAmount,
        status: dynamicStatus,
        payment_method: editFormData.method,
        cgst: newCgst,
        sgst: newSgst,
        igst: newIgst,
        tax_total: newTaxTotal,
        expected_payment_date: dynamicStatus === 'Partially Paid' ? editFormData.expectedPaymentDate || null : null,
      };
      await updateInvoice(editingInvoice.apiId, payload);
      showToast(`Invoice for ${editFormData.patient} updated successfully.`);
      setIsEditModalOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      showToast(error.message || 'Unable to update the invoice.', 'error');
    }
  };

  const handleSendPaidInvoiceEmail = async (e) => {
    e.preventDefault();

    const normalizedEmail = emailFormData.recipientEmail.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setEmailValidationError('Enter a valid email address before sending the invoice.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const payload = {
        status: editingInvoice?.status || editFormData.status,
        recipient_email: normalizedEmail,
      };

      if (editingInvoice?.patient?.trim()) {
        payload.patient_name = editingInvoice.patient.trim();
      } else if (editFormData.patient?.trim()) {
        payload.patient_name = editFormData.patient.trim();
      }

      if (typeof editingInvoice?.amountValue === 'number') {
        payload.amount = editingInvoice.amountValue;
      } else if (editFormData.amount !== '') {
        payload.amount = Number(editFormData.amount);
      }

      if (editingInvoice?.method) {
        payload.payment_method = editingInvoice.method;
      } else if (editFormData.method) {
        payload.payment_method = editFormData.method;
      }

      const response = await invoicesApi.sendPaidInvoiceEmail(editingInvoice.apiId, payload);
      await loadInvoices();

      if (response.email_sent) {
        setIsEmailSent(true);
        setEmailSentMessage(response.message || `Invoice successfully dispatched to ${normalizedEmail}.`);
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast(error.message || 'Unable to email the invoice PDF.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(deletingInvoice.apiId);
      showToast(`Invoice for ${deletingInvoice.patient} removed from records.`);
      setIsDeleteModalOpen(false);
      setDeletingInvoice(null);
    } catch (error) {
      showToast(error.message || 'Unable to delete the invoice.', 'error');
    }
  };

  const getInvoiceStatusStyle = (status) => {
    const palette = {
      Pending: {
        color: '#f59e0b',
        background: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.35)',
      },
      'Partially Paid': {
        color: '#059669',
        background: 'rgba(5, 150, 105, 0.12)',
        borderColor: 'rgba(5, 150, 105, 0.35)',
      },
      Paid: {
        color: '#10b981',
        background: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
      },
      Cancelled: {
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)',
      },
    };

    return palette[status] || palette.Pending;
  };

  const canUpdateInvoiceStatus = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    return canOperate && normalizedStatus !== 'paid' && normalizedStatus !== 'cancelled';
  };

  return (
    <main className="billing-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Financial Records</h2>
          <p className="text-muted mb-0">Manage clinical billing and payment records.</p>
        </div>
        {canOperate && (
          <button className="btn btn-primary px-4 py-2" onClick={() => setIsModalOpen(true)}>
            <i className="bi bi-plus-circle me-2" aria-hidden="true"></i>
            Create New Invoice
          </button>
        )}
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="glass-card p-4 border d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
            <div>
              <p className="text-muted fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Paid Amount</p>
              <h3 className="fw-bold mb-0 text-success" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ₹{totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '56px', height: '56px' }}>
              <i className="bi bi-cash-stack fs-4"></i>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="glass-card p-4 border d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
            <div>
              <p className="text-muted fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Total Pending Amount</p>
              <h3 className="fw-bold mb-0 text-warning" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '56px', height: '56px' }}>
              <i className="bi bi-clock-history fs-4"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden border">
        <div
          className="p-4 border-bottom d-flex justify-content-between align-items-center"
          style={{ background: 'var(--accents-1)' }}
        >
          <h6 className="fw-bold mb-0">Recent Invoices</h6>
          <div className="d-flex gap-3 align-items-center">
            <div className="input-group input-group-sm" style={{ width: '200px' }}>
              <span className="input-group-text bg-transparent border-end-0 border-accents-2 opacity-50"><i className="bi bi-search" aria-hidden="true"></i></span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder="Search invoices…" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onPageChange(1);
                }}
              />
            </div>
            {canOperate && (
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-glass border px-3" onClick={() => showToast('Exporting ledger...')}>
                  Export CSV
                </button>
                <button
                  className="btn btn-sm btn-glass border px-3"
                  onClick={() => showToast('Syncing with financial server...')}
                >
                  Sync Ledger
                </button>
              </div>
            )}
          </div>
        </div>
        <Skeleton name="billing-table" loading={loading}>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th className="px-4 py-3">Patient ID</th>
                <th className="py-3">Patient Name</th>
                <th className="py-3">Total Invoice Amt</th>
                <th className="py-3">Total Paid Amt</th>
                <th className="py-3">Total Pending Amt</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-0">
                    <EmptyState 
                      icon="bi-receipt"
                      title="No Invoices"
                      description="No financial records or billing cycles have been initialized."
                      actionText={canOperate ? "Create New Invoice" : undefined}
                      onAction={canOperate ? () => setIsModalOpen(true) : undefined}
                    />
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-0">
                    <EmptyState 
                      icon="bi-search"
                      title="No matching patients"
                      description={`We couldn't find any patients matching "${searchTerm}".`}
                      actionText="Clear Search"
                      onAction={() => { setSearchTerm(''); onPageChange(1); }}
                    />
                  </td>
                </tr>
              ) : paginatedInvoices.map((row) => (
                <tr key={row.patientId !== '-' ? row.patientId : row.patientName}>
                  <td className="px-4 py-4 fw-bold text-muted small" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.patientId}
                  </td>
                  <td className="py-4 fw-bold">{row.patientName}</td>
                  <td className="py-4 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ₹{row.totalInvoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-success fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ₹{row.totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-warning fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ₹{row.totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-center">
                    <button
                      className="btn btn-sm btn-glass border px-3"
                      title="View Invoices"
                      onClick={() => {
                        setSelectedPatientForView(row);
                        setIsPatientInvoicesModalOpen(true);
                      }}
                    >
                      <i className="bi bi-eye me-1" aria-hidden="true"></i>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Skeleton>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          totalItems={totalItems}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setLineItems([]);
        setFormData(prev => ({ ...prev, gstType: 'CGST_SGST' }));
        setNewRow({
          category: 'Medicines/Pharmacy',
          name: '',
          description: '',
          quantity: '1',
          unitPrice: '',
          tax: '0',
          discount: '0',
        });
      }} title="Generate Invoice">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="invoice-patient" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Patient Name</label>
            <div className="position-relative">
              <input
                id="invoice-patient"
                type="text"
                autoComplete="off"
                className={`form-control ${validationErrors.patient ? 'is-invalid' : ''}`}
                placeholder="Search or enter patient name"
                value={formData.patient}
                onChange={(e) => {
                  setPatientSuggestionsVisible(true);
                  setFormData({ ...formData, patient: e.target.value });
                }}
                onFocus={() => setPatientSuggestionsVisible(true)}
                onBlur={() => setTimeout(() => setPatientSuggestionsVisible(false), 150)}
              />
              {isPatientSuggestionsVisible && filteredPatients.length > 0 && (
                <div className="list-group position-absolute w-100 " style={{ zIndex: 1050, maxHeight: '250px', overflowY: 'auto' }}>
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="list-group-item list-group-item-action text-start"
                      onMouseDown={() => {
                        setFormData({ ...formData, patient: patient.name });
                        setPatientSuggestionsVisible(false);
                      }}
                    >
                      <div className="fw-bold">{patient.name}</div>
                      <small className="text-muted">{patient.id}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label text-muted fw-bold small text-uppercase mb-2">Billing Type</label>
              <select
                className="form-select"
                value={formData.billingType}
                onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
              >
                <option value="OP">OP (Outpatient)</option>
                <option value="IP">IP (Inpatient)</option>
              </select>
            </div>
            {formData.billingType === 'IP' && (
              <>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2">Admission ID</label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.ipDetails ? 'is-invalid' : ''}`}
                    placeholder="Admission ID"
                    value={formData.admissionId}
                    onChange={(e) => setFormData({ ...formData, admissionId: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2">Ward / Room</label>
                  <input
                    type="text"
                    className={`form-control ${validationErrors.ipDetails ? 'is-invalid' : ''}`}
                    placeholder="Ward name or room"
                    value={formData.wardName}
                    onChange={(e) => setFormData({ ...formData, wardName: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2">Stay Duration (days)</label>
                  <input
                    type="number"
                    min="0"
                    className={`form-control ${validationErrors.ipDetails ? 'is-invalid' : ''}`}
                    placeholder="0"
                    value={formData.stayDuration}
                    onChange={(e) => setFormData({ ...formData, stayDuration: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-4">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2">Room Charge / day</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-control ${validationErrors.ipDetails ? 'is-invalid' : ''}`}
                    placeholder="0.00"
                    value={formData.roomCharge}
                    onChange={(e) => setFormData({ ...formData, roomCharge: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4 d-flex align-items-end">
                  <div className="w-100 p-3 rounded-3" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
                    <div className="text-muted small">Room stay total</div>
                    <div className="fw-bold">₹{roomChargeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label text-muted fw-bold small text-uppercase mb-2">Billing Items</label>
            <div className="rounded-3 p-3" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
              <div className="row g-2 align-items-end">
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted required-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Category</label>
                  <select
                    className="form-select form-select-sm"
                    value={newRow.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setNewRow((r) => ({
                        ...r,
                        category: cat,
                        name: '',
                        unitPrice: '',
                        medicine_code: undefined
                      }));
                    }}
                  >
                    {BILLING_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted required-label" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Item Name</label>
                  <input
                    type="text"
                    className={`form-control form-control-sm ${validationErrors.rowName ? 'is-invalid' : ''}`}
                    placeholder="Description / service"
                    value={newRow.name}
                    list={newRow.category === 'Medicines/Pharmacy' ? 'medicine-autocomplete' : undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      let updatedRow = { ...newRow, name: value };
                      if (newRow.category === 'Medicines/Pharmacy') {
                        const matched = medicines.find(m => m.name.toLowerCase() === value.trim().toLowerCase());
                        if (matched) {
                          updatedRow.unitPrice = matched.priceValue.toString();
                          updatedRow.medicine_code = matched.id;
                          const qty = parseInt(newRow.quantity, 10) || 1;
                          if (matched.stock < qty) {
                            showToast(`Warning: Insufficient stock for ${matched.name}. Available: ${matched.stock}`, 'warning');
                          }
                        }
                      }
                      setNewRow(updatedRow);
                    }}
                  />
                  {newRow.category === 'Medicines/Pharmacy' && (
                    <datalist id="medicine-autocomplete">
                      {medicines.map((m) => (
                        <option key={m.apiId} value={m.name}>
                          ₹{m.priceValue} · Stock: {m.stock}
                        </option>
                      ))}
                    </datalist>
                  )}
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Description</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Optional item notes"
                    value={newRow.description}
                    onChange={(e) => setNewRow((r) => ({ ...r, description: e.target.value }))}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Qty</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control form-control-sm"
                    value={newRow.quantity}
                    onChange={(e) => {
                      const qtyVal = e.target.value;
                      const qty = parseInt(qtyVal, 10) || 1;
                      if (newRow.category === 'Medicines/Pharmacy' && newRow.name) {
                        const matched = medicines.find(m => m.name.toLowerCase() === newRow.name.trim().toLowerCase());
                        if (matched && matched.stock < qty) {
                          showToast(`Insufficient stock for ${matched.name}. Available: ${matched.stock}`, 'warning');
                        }
                      }
                      setNewRow((r) => ({ ...r, quantity: qtyVal }));
                    }}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control form-control-sm"
                    value={newRow.unitPrice}
                    onChange={(e) => setNewRow((r) => ({ ...r, unitPrice: e.target.value }))}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Tax %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control form-control-sm"
                    value={newRow.tax}
                    onChange={(e) => setNewRow((r) => ({ ...r, tax: e.target.value }))}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control form-control-sm"
                    value={newRow.discount}
                    onChange={(e) => setNewRow((r) => ({ ...r, discount: e.target.value }))}
                  />
                </div>
                <div className="col-12 col-md-2 d-grid">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm h-100"
                    onClick={handleAddRow}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>

          {(lineItems.length > 0 || formData.billingType === 'IP') && (
            <div className="mb-4 rounded-3 overflow-hidden" style={{ border: '1px solid var(--accents-2)' }}>
              <table className="table table-sm mb-0 align-middle">
                <thead style={{ background: 'var(--accents-1)' }}>
                  <tr>
                    <th className="px-3 py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Category</th>
                    <th className="px-3 py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Item</th>
                    <th className="px-3 py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Description</th>
                    <th className="py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Qty</th>
                    <th className="py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Unit</th>
                    <th className="py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Tax</th>
                    <th className="py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Discount</th>
                    <th className="py-2 text-muted small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>Total</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.rowId}>
                      <td className="px-3 py-2" style={{ fontSize: '0.825rem' }}>{item.category}</td>
                      <td className="px-3 py-2 fw-bold" style={{ fontSize: '0.825rem' }}>{item.name}</td>
                      <td className="px-3 py-2" style={{ fontSize: '0.825rem' }}>{item.description}</td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm"
                          style={{ width: '70px' }}
                          value={item.quantity}
                          onChange={(e) => updateLineItemField(item.rowId, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control form-control-sm"
                          style={{ width: '100px' }}
                          value={item.unitPrice}
                          onChange={(e) => updateLineItemField(item.rowId, 'unitPrice', e.target.value)}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-control form-control-sm"
                          style={{ width: '70px' }}
                          value={item.taxPercentage}
                          onChange={(e) => updateLineItemField(item.rowId, 'tax', e.target.value)}
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-control form-control-sm"
                          style={{ width: '70px' }}
                          value={item.discountPercentage}
                          onChange={(e) => updateLineItemField(item.rowId, 'discount', e.target.value)}
                        />
                      </td>
                      <td className="py-2 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 pe-2 text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-glass text-danger p-1"
                          onClick={() => removeLineItem(item.rowId)}
                          title="Remove"
                        >
                          <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 border-top" style={{ background: 'var(--accents-1)' }}>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <div className="text-muted small text-uppercase mb-1">Subtotal</div>
                    <div className="fw-bold">₹{lineItemsSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-muted small text-uppercase mb-1">Tax Total</div>
                    <div className="fw-bold">₹{lineItemsTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-muted small text-uppercase mb-1">Discount Total</div>
                    <div className="fw-bold">- ₹{lineItemsDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
                <div className="row g-3 mt-2 border-top pt-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-muted fw-bold small text-uppercase mb-1">GST Type</label>
                    <select
                      className="form-select form-select-sm"
                      value={formData.gstType}
                      onChange={(e) => setFormData({ ...formData, gstType: e.target.value })}
                    >
                      <option value="CGST_SGST">CGST + SGST (Intra-state)</option>
                      <option value="IGST">IGST (Inter-state)</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6 d-flex align-items-center">
                    <div className="small text-muted w-100">
                      <div className="fw-semibold text-uppercase mb-1">GST Breakdown:</div>
                      {formData.gstType === 'CGST_SGST' ? (
                        <div className="d-flex gap-3">
                          <div>CGST ({parseFloat((effectiveTaxRate / 2).toFixed(4))}%): <span className="fw-bold">₹{calculatedGst.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                          <div>SGST ({parseFloat((effectiveTaxRate / 2).toFixed(4))}%): <span className="fw-bold">₹{calculatedGst.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                        </div>
                      ) : (
                        <div>IGST ({parseFloat(effectiveTaxRate.toFixed(4))}%): <span className="fw-bold">₹{calculatedGst.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                      )}
                    </div>
                  </div>
                </div>
                {formData.billingType === 'IP' && (
                  <div className="row g-3 mt-3">
                    <div className="col-12 col-md-4">
                      <div className="text-muted small text-uppercase mb-1">Room Charges</div>
                      <div className="fw-bold">₹{roomChargeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                )}
                <div className="row g-3 mt-3 align-items-center">
                  <div className="col-12 col-md-4">
                    <div className="text-muted small text-uppercase mb-1">Grand Total</div>
                    <div className="fs-5 fw-bold">₹{invoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-muted small text-uppercase mb-1">Amount Paid</div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control form-control-sm"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-muted small text-uppercase mb-1">Due Amount</div>
                    <div className="fs-5 fw-bold text-warning">₹{dueAmountValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="invoice-method" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Payment Method</label>
              <select
                id="invoice-method"
                className={`form-select ${validationErrors.paymentMethod ? 'is-invalid' : ''}`}
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="invoice-status" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Payment Status</label>
              <select
                id="invoice-status"
                className="form-select"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            {formData.paymentStatus === 'Partial' && (
              <div className="col-12 col-md-6">
                <label htmlFor="invoice-expected-payment-date" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Expected Payment Date</label>
                <input
                  id="invoice-expected-payment-date"
                  type="date"
                  className={`form-control ${validationErrors.expectedPaymentDate ? 'is-invalid' : ''}`}
                  value={formData.expectedPaymentDate || ''}
                  onChange={(e) => setFormData({ ...formData, expectedPaymentDate: e.target.value })}
                  required
                />
              </div>
            )}
          </div>

          {formData.paymentMethod === 'Insurance' && (
            <div className="mb-4 rounded-3 p-3" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2">Insurance Provider</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.insuranceProvider}
                    onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2">Policy Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2">Covered Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control form-control-sm"
                    value={formData.coveredAmount}
                    onChange={(e) => setFormData({ ...formData, coveredAmount: e.target.value })}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label text-muted fw-bold small text-uppercase mb-2">Remaining Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control form-control-sm"
                    value={formData.remainingAmount}
                    onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="p-3 rounded-3 mb-5" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle text-muted me-2" aria-hidden="true"></i>
              <small className="text-muted">Invoices are initialized as pending until payment is finalized.</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-glass w-100 py-2" onClick={() => { setIsModalOpen(false); setLineItems([]); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-100 py-2">
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Invoice Information">
        {editingInvoice && (
          <form onSubmit={handleEditSubmit}>
            <div className="mb-4">
              <label htmlFor="edit-invoice-patient" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Patient Name</label>
              <input
                id="edit-invoice-patient"
                type="text"
                className={`form-control ${validationErrors.patient ? 'is-invalid' : ''}`}
                placeholder="Enter patient name..."
                value={editFormData.patient}
                onChange={(e) => setEditFormData({ ...editFormData, patient: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="edit-invoice-amount" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Amount (INR)</label>
              <input
                id="edit-invoice-amount"
                type="number"
                className={`form-control ${validationErrors.amount ? 'is-invalid' : ''}`}
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="edit-invoice-method" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Payment Method</label>
              <select
                id="edit-invoice-method"
                className={`form-select ${validationErrors.method ? 'is-invalid' : ''}`}
                value={editFormData.method}
                onChange={(e) => setEditFormData({ ...editFormData, method: e.target.value })}
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Insurance</option>
                <option>UPI</option>
              </select>
            </div>
            <div className="mb-4 row g-3">
              <div className="col-4">
                <label htmlFor="edit-invoice-cgst" className="form-label text-muted fw-bold small text-uppercase mb-2">CGST (₹)</label>
                <input
                  id="edit-invoice-cgst"
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={editFormData.cgst}
                  onChange={(e) => setEditFormData({ ...editFormData, cgst: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label htmlFor="edit-invoice-sgst" className="form-label text-muted fw-bold small text-uppercase mb-2">SGST (₹)</label>
                <input
                  id="edit-invoice-sgst"
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={editFormData.sgst}
                  onChange={(e) => setEditFormData({ ...editFormData, sgst: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label htmlFor="edit-invoice-igst" className="form-label text-muted fw-bold small text-uppercase mb-2">IGST (₹)</label>
                <input
                  id="edit-invoice-igst"
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={editFormData.igst}
                  onChange={(e) => setEditFormData({ ...editFormData, igst: e.target.value })}
                />
              </div>
            </div>
            {getEditStatus() === 'Partially Paid' && (
              <div className="mb-4">
                <label htmlFor="edit-invoice-expected-payment-date" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Expected Payment Date</label>
                <input
                  id="edit-invoice-expected-payment-date"
                  type="date"
                  className={`form-control ${validationErrors.expectedPaymentDate ? 'is-invalid' : ''}`}
                  value={editFormData.expectedPaymentDate || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, expectedPaymentDate: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="d-flex gap-2 mt-5">
              <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-100 py-2">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Receive Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setEditingInvoice(null);
        }}
        title="Receive Payment"
        icon="bi-cash-coin"
        theme="primary"
      >
        {editingInvoice && (
          <form onSubmit={handleReceivePayment}>
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Total Invoice Amount:</span>
                <span className="fw-bold">₹{editingInvoice.amountValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Amount Already Paid:</span>
                <span className="fw-bold text-success">₹{(editingInvoice.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="d-flex justify-content-between pb-3 border-bottom">
                <span className="text-muted small">Remaining Balance:</span>
                <span className="fw-bold text-warning">₹{Math.max(0, editingInvoice.amountValue - (editingInvoice.amountPaid || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">
                Payment Amount to Receive (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={Math.max(0, parseFloat((editingInvoice.amountValue - (editingInvoice.amountPaid || 0)).toFixed(2)))}
                className="form-control form-control-lg fw-bold"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            {paymentAmount && Number(paymentAmount) > 0 && Number(paymentAmount) < (editingInvoice.amountValue - (editingInvoice.amountPaid || 0)) && (
              <div className="mb-4">
                <label htmlFor="receive-payment-expected-date" className="form-label text-muted fw-bold small text-uppercase mb-2 required-label">Expected Payment Date</label>
                <input
                  id="receive-payment-expected-date"
                  type="date"
                  className={`form-control ${validationErrors.paymentExpectedDate ? 'is-invalid' : ''}`}
                  value={paymentExpectedDate}
                  onChange={(e) => setPaymentExpectedDate(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="d-flex gap-2 mt-5">
              <button type="button" className="btn btn-glass w-100 py-2" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-100 py-2">
                Confirm Payment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={`Invoice ${deletingInvoice?.id} for ${deletingInvoice?.patient}`}
        itemType="Invoice"
      />

      {/* Patient Invoices Detail Modal */}
      <Modal
        isOpen={isPatientInvoicesModalOpen}
        onClose={() => { setIsPatientInvoicesModalOpen(false); setSelectedPatientForView(null); }}
        title={selectedPatientForView ? `Invoices — ${selectedPatientForView.patientName}` : 'Patient Invoices'}
        icon="bi-eye"
      >
        {selectedPatientForView && (
          <div>
            <div className="d-flex gap-4 mb-4 p-3 rounded-3" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
              <div>
                <div className="text-muted small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Patient ID</div>
                <div className="fw-bold">{selectedPatientForView.patientId}</div>
              </div>
              <div>
                <div className="text-muted small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Patient Name</div>
                <div className="fw-bold">{selectedPatientForView.patientName}</div>
              </div>
              <div>
                <div className="text-muted small text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Total Invoices</div>
                <div className="fw-bold">{selectedPatientForView.invoices.length}</div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="py-2 px-3" style={{ whiteSpace: 'nowrap' }}>Invoice No.</th>
                    <th className="py-2" style={{ whiteSpace: 'nowrap' }}>Date</th>
                    <th className="py-2" style={{ whiteSpace: 'nowrap' }}>Invoice Amt</th>
                    <th className="py-2" style={{ whiteSpace: 'nowrap' }}>Paid Amt</th>
                    <th className="py-2" style={{ whiteSpace: 'nowrap' }}>Pending Amt</th>
                    <th className="py-2" style={{ whiteSpace: 'nowrap' }}>Status</th>
                    {canOperate && <th className="py-2 text-center" style={{ whiteSpace: 'nowrap' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedPatientForView.invoices.map((inv) => {
                    const pendingAmt = Math.max(0, (inv.amountValue || 0) - (inv.amountPaid || 0));
                    const statusStyle = getInvoiceStatusStyle(inv.status);
                    return (
                      <tr key={inv.id}>
                        <td className="py-3 px-3 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{inv.id}</td>
                        <td className="py-3 text-muted small" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{inv.date}</td>
                        <td className="py-3 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ₹{(inv.amountValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-success fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ₹{(inv.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-warning fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ₹{pendingAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3">
                          <span
                            className="badge rounded-pill px-3 py-1 border"
                            style={{
                              background: statusStyle.background,
                              color: statusStyle.color,
                              borderColor: statusStyle.borderColor,
                              fontSize: '0.72rem',
                            }}
                          >
                            <span
                              className="pulsing-dot me-2"
                              aria-hidden="true"
                              style={{ width: '6px', height: '6px', background: statusStyle.color }}
                            ></span>
                            {inv.status}
                          </span>
                        </td>
                        {canOperate && (
                          <td className="py-3 text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                                <button
                                  className="btn btn-sm btn-glass text-success p-1"
                                  title="Receive Payment"
                                  onClick={() => openPaymentModal(inv)}
                                >
                                  <i className="bi bi-cash-coin"></i>
                                </button>
                              )}
                              {canUpdateInvoiceStatus(inv.status) && (
                                <button
                                  className="btn btn-sm btn-glass text-warning p-1"
                                  title="Cancel Invoice"
                                  onClick={() => handleUpdateStatus(inv, 'Cancelled')}
                                >
                                  <i className="bi bi-x-circle"></i>
                                </button>
                              )}
                              {canManage && (
                                <button
                                  className="btn btn-sm btn-glass text-primary p-1"
                                  title="Edit Invoice"
                                  onClick={() => openEditModal(inv)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                              )}
                              {canManage && (
                                <button
                                  className="btn btn-sm btn-glass text-danger p-1"
                                  title="Delete Invoice"
                                  onClick={() => { setDeletingInvoice(inv); setIsDeleteModalOpen(true); }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-glass text-muted p-1"
                                title="Download PDF"
                                onClick={() => handleDownloadPdf(inv)}
                                disabled={downloadingPdfId === inv.id}
                              >
                                {downloadingPdfId === inv.id ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className="bi bi-download"></i>
                                )}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot style={{ background: 'var(--accents-1)', borderTop: '2px solid var(--accents-2)' }}>
                  <tr>
                    <td colSpan="2" className="py-3 px-3 fw-bold text-muted small text-uppercase" style={{ letterSpacing: '0.5px' }}>Totals</td>
                    <td className="py-3 fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ₹{selectedPatientForView.totalInvoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-success fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ₹{selectedPatientForView.totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-warning fw-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ₹{selectedPatientForView.totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                    {canOperate && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-glass border px-4 py-2"
                onClick={() => { setIsPatientInvoicesModalOpen(false); setSelectedPatientForView(null); }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isEmailModalOpen} onClose={closeEmailModal} title="Email Paid Invoice">
        {isEmailSent ? (
          <div className="text-center py-4">
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
              style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
            >
              <i className="bi bi-check-lg fs-1 text-success" aria-hidden="true"></i>
            </div>
            <h4 className="fw-bold mb-2">Invoice Sent!</h4>
            <p className="text-muted mb-5 px-4">{emailSentMessage}</p>
            <button 
              type="button" 
              className="btn btn-primary w-100 py-2" 
              onClick={() => {
                closeEmailModal();
                setIsEditModalOpen(false);
                setEditingInvoice(null);
              }}
            >
              Back to Invoices
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendPaidInvoiceEmail} noValidate>
            <div className="mb-3">
              <label htmlFor="invoice-recipient-email" className="form-label text-muted fw-bold small text-uppercase mb-2">
                Recipient Email
              </label>
              <input
                id="invoice-recipient-email"
                type="email"
                className={`form-control ${emailValidationError ? 'is-invalid' : ''}`}
                placeholder="patient@example.com"
                value={emailFormData.recipientEmail}
                onChange={(e) => {
                  setEmailFormData({ recipientEmail: e.target.value });
                  if (emailValidationError) {
                    setEmailValidationError('');
                  }
                }}
                required
              />
              {emailValidationError && <div className="invalid-feedback d-block">{emailValidationError}</div>}
            </div>
            <div className="p-3 rounded-3 mb-4" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
              <small className="text-muted">
                Marking this invoice as paid will generate a PDF on the backend and email it as an attachment.
              </small>
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-glass w-100 py-2" onClick={closeEmailModal} disabled={isSendingEmail}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={isSendingEmail}>
                {isSendingEmail ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  'Send Invoice PDF'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </main>
  );
};

export default Billing;
