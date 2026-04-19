import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import {
  initDB,
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  markCustomerAsDone,
  markCustomerAsPending,
} from '../database/db';
import CustomerCard from '../components/CustomerCard';
import {
  sendWhatsAppReminder,
  sendWhatsAppClearMessage,
  sendWhatsAppDueStatusWarning,
} from '../utils/whatsapp';
import { generateCustomerSlipPdf } from '../utils/pdfSlip';

export default function DashboardScreen({ currentUser, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  const [loanDateInput, setLoanDateInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [creditDaysInput, setCreditDaysInput] = useState('');
  const [itemsInput, setItemsInput] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [dueWarningGroups, setDueWarningGroups] = useState({
    dueTomorrow: [],
    dueToday: [],
    overdue: [],
  });

  useEffect(() => {
    const bootstrap = async () => {
      await initDB();
      await loadData();
    };

    bootstrap();
  }, []);

  const loadData = async () => {
    const data = await getCustomers();
    setCustomers(data);
    setDueWarningGroups(getDueWarningGroups(data));
  };

  const resetForm = () => {
    setNameInput('');
    setPhoneInput('');
    setBalanceInput('');
    setLoanDateInput('');
    setDueDateInput('');
    setCreditDaysInput('');
    setItemsInput('');
    setEditingCustomerId(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const getDueWarningGroups = (data) => {
    const dueTomorrow = [];
    const dueToday = [];
    const overdue = [];

    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];

    data.forEach((item) => {
      if (!item.due_date || Number(item.total_balance) <= 0) {
        return;
      }

      if (item.due_date === tomorrowIso) {
        dueTomorrow.push(item);
      } else if (item.due_date === todayIso) {
        dueToday.push(item);
      } else if (item.due_date < todayIso) {
        overdue.push(item);
      }
    });

    return { dueTomorrow, dueToday, overdue };
  };

  const isValidIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

  const parseItems = (rawText) => {
    return rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [namePart = '', qtyPart = '1', pricePart = '0'] = line.split(',');
        const qty = Number(qtyPart.trim() || '1');
        const price = Number(pricePart.trim() || '0');

        return {
          name: namePart.trim(),
          qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
          price: Number.isFinite(price) && price >= 0 ? price : 0,
          total:
            (Number.isFinite(qty) && qty > 0 ? qty : 1) *
            (Number.isFinite(price) && price >= 0 ? price : 0),
        };
      })
      .filter((item) => item.name.length > 0);
  };

  const buildDueDate = () => {
    if (dueDateInput.trim()) {
      return dueDateInput.trim();
    }

    const days = Number(creditDaysInput || '0');
    if (!Number.isFinite(days) || days <= 0) {
      return '';
    }

    const loanDate = new Date(loanDateInput);
    loanDate.setDate(loanDate.getDate() + days);
    return loanDate.toISOString().split('T')[0];
  };

  const handleAddKhata = async () => {
    if (!nameInput.trim() || !phoneInput.trim()) {
      Alert.alert('Missing Info', 'Name aur phone dono required hain.');
      return;
    }

    const parsedBalance = Number(balanceInput || '0');
    if (!Number.isFinite(parsedBalance) || parsedBalance < 0) {
      Alert.alert('Invalid Amount', 'Qarza amount sahi number me dalain.');
      return;
    }

    const parsedItems = parseItems(itemsInput);
    if (!parsedItems.length) {
      Alert.alert('Items Required', 'Kam az kam ek item add karein. Format: item,qty,price');
      return;
    }

    const computedItemsTotal = parsedItems.reduce((sum, item) => sum + item.total, 0);
    const finalBalance = parsedBalance > 0 ? parsedBalance : computedItemsTotal;

    const finalDueDate = buildDueDate();

    if (!isValidIsoDate(loanDateInput) || !isValidIsoDate(finalDueDate)) {
      Alert.alert('Invalid Date', 'Loan Date aur Due Date format YYYY-MM-DD hona chahiye.');
      return;
    }

    if (new Date(finalDueDate) < new Date(loanDateInput)) {
      Alert.alert('Invalid Due Date', 'Due Date, Loan Date se pehle nahi ho sakti.');
      return;
    }

    if (editingCustomerId) {
      const updated = await updateCustomer(
        editingCustomerId,
        nameInput,
        phoneInput,
        finalBalance,
        loanDateInput,
        finalDueDate,
        parsedItems
      );

      if (!updated) {
        Alert.alert('Update Failed', 'Record update nahi hua. Dobara try karein.');
        return;
      }
    } else {
      await addCustomer(
        nameInput,
        phoneInput,
        finalBalance,
        loanDateInput,
        finalDueDate,
        parsedItems
      );
    }

    closeAddModal();
    await loadData();
  };

  const openEditModal = (customer) => {
    setEditingCustomerId(customer.id);
    setNameInput(customer.name || '');
    setPhoneInput(customer.phone || '');
    setBalanceInput(String(customer.total_balance ?? ''));
    setLoanDateInput(customer.loan_date || '');
    setDueDateInput(customer.due_date || '');
    setCreditDaysInput('');

    const itemsLines = Array.isArray(customer.items)
      ? customer.items
          .map((entry) => `${entry.name},${entry.qty},${entry.price}`)
          .join('\n')
      : '';
    setItemsInput(itemsLines);
    setShowAddModal(true);
  };

  const handleDueStatusReminder = async (customer, status) => {
    await sendWhatsAppDueStatusWarning(
      customer.phone,
      customer.name,
      customer.total_balance,
      customer.due_date,
      status
    );
  };

  const renderDueSection = (title, list, status, boxStyle) => {
    if (!list.length) {
      return null;
    }

    return (
      <View style={[styles.reminderBox, boxStyle]}>
        <Text style={styles.reminderTitle}>{title}</Text>
        {list.map((item) => (
          <View key={`${status}-${item.id}`} style={styles.reminderRow}>
            <View>
              <Text style={styles.reminderName}>{item.name}</Text>
              <Text style={styles.reminderMeta}>Due: {item.due_date} | Rs. {item.total_balance}</Text>
            </View>
            <TouchableOpacity
              style={styles.reminderBtn}
              onPress={() => handleDueStatusReminder(item, status)}
            >
              <Text style={styles.reminderBtnText}>Warn</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const handleReminder = async (customer) => {
    await sendWhatsAppReminder(
      customer.phone,
      customer.name,
      customer.total_balance,
      customer.due_date,
      customer.loan_date
    );
  };

  const confirmAction = (title, message, onConfirm) => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true;
      if (confirmed) {
        onConfirm();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm },
    ]);
  };

  const handleDeleteCustomer = (customer) => {
    confirmAction(
      'Delete Customer',
      `Kya aap ${customer.name} ka khata delete karna chahte hain?`,
      async () => {
        const deleted = await deleteCustomer(customer.id);
        if (!deleted) {
          Alert.alert('Delete Failed', 'Customer delete nahi hua. Dobara try karein.');
          return;
        }

        Alert.alert('Deleted', 'Customer khata delete ho gaya.');
        await loadData();
      }
    );
  };

  const handleMarkAsDone = (customer) => {
    if (Number(customer.total_balance) <= 0) {
      Alert.alert('Already Clear', 'Ye khata pehle se clear hai.');
      return;
    }

    confirmAction(
      'Mark as Done',
      `Confirm karein ke ${customer.name} ne loan return kar diya hai?`,
      async () => {
        const marked = await markCustomerAsDone(customer.id);
        if (!marked) {
          Alert.alert('Failed', 'Khata done mark nahi hua. Dobara try karein.');
          return;
        }

        await sendWhatsAppClearMessage(customer.phone, customer.name);
        Alert.alert('Payment Cleared', 'Your payment is clear');
        await loadData();
      }
    );
  };

  const handleGenerateSlip = async (customer) => {
    await generateCustomerSlipPdf(customer);
  };

  const handleUndoDone = (customer) => {
    confirmAction(
      'Undo Done',
      `Kya aap ${customer.name} ko wapas pending karna chahte hain?`,
      async () => {
        const restored = await markCustomerAsPending(customer.id);
        if (!restored) {
          Alert.alert('Undo Failed', 'Is khata ka previous pending amount available nahi hai.');
          return;
        }

        Alert.alert('Restored', 'Khata wapas pending me chala gaya.');
        await loadData();
      }
    );
  };

  const handleExportBackup = async () => {
    setShowSettingsMenu(false);
    const { exportBackupFile } = await import('../utils/backup');
    await exportBackupFile();
  };

  const handleRestoreBackup = async () => {
    setShowSettingsMenu(false);
    const { restoreBackupFile } = await import('../utils/backup');
    const restored = await restoreBackupFile();
    if (restored) {
      await loadData();
    }
  };

  const handleLogout = () => {
    setShowSettingsMenu(false);
    onLogout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgAccentTop} />
      <View style={styles.bgAccentBottom} />

      <View style={styles.headerCard}>
        <View style={styles.brandRow}>
          <View style={styles.brandInfoRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>KH</Text>
            </View>
            <View>
              <Text style={styles.headerText}>Udhaar Khata</Text>
              <Text style={styles.headerSubText}>Signed in as {currentUser?.email}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettingsMenu(true)}>
            <Text style={styles.settingsBtnText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {renderDueSection('Due Tomorrow Warnings', dueWarningGroups.dueTomorrow, 'dueTomorrow')}
        {renderDueSection('Due Today Warnings', dueWarningGroups.dueToday, 'dueToday', styles.dueTodayBox)}
        {renderDueSection('Overdue Warnings', dueWarningGroups.overdue, 'overdue', styles.overdueBox)}

        {customers.length ? (
          customers.map((item) => (
            <View key={item.id}>
              <CustomerCard customer={item} onPress={() => {}} />
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => handleMarkAsDone(item)}
                >
                  <Text style={styles.doneBtnText}>Mark as Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.slipBtn}
                  onPress={() => handleGenerateSlip(item)}
                >
                  <Text style={styles.slipBtnText}>Generate PDF Slip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteCustomer(item)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
              {Array.isArray(item.items) && item.items.length > 0 ? (
                <View style={styles.itemsBox}>
                  <Text style={styles.itemsTitle}>Items Detail</Text>
                  {item.items.map((entry, index) => (
                    <Text key={`${item.id}-${entry.name}-${index}`} style={styles.itemLine}>
                      {entry.name} x{entry.qty} @ Rs. {entry.price} = Rs. {entry.total}
                    </Text>
                  ))}
                </View>
              ) : null}
              {Number(item.total_balance) <= 0 ? (
                <View style={styles.clearedActionsRow}>
                  <Text style={styles.clearedText}>Khata clear ho gaya</Text>
                  <View style={styles.clearedRightSide}>
                    {item.cleared_on ? <Text style={styles.clearedDate}>On: {item.cleared_on}</Text> : null}
                    <TouchableOpacity
                      style={styles.undoBtn}
                      onPress={() => handleUndoDone(item)}
                    >
                      <Text style={styles.undoBtnText}>Undo Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No customers yet. Add one!</Text>
          )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Text style={styles.fabText}>+ Add Khata</Text>
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={closeAddModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingCustomerId ? 'Edit Khata Record' : 'Add New Khata'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Customer Name"
              value={nameInput}
              onChangeText={setNameInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phoneInput}
              onChangeText={setPhoneInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Opening Balance (Qarza)"
              keyboardType="numeric"
              value={balanceInput}
              onChangeText={setBalanceInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Loan Date (YYYY-MM-DD)"
              value={loanDateInput}
              onChangeText={setLoanDateInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Due Date (YYYY-MM-DD)"
              value={dueDateInput}
              onChangeText={setDueDateInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Or Credit Days (e.g. 2 or 30)"
              keyboardType="numeric"
              value={creditDaysInput}
              onChangeText={setCreditDaysInput}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              placeholder={'Items (har line: item,qty,price)\nSugar,2,160\nTea,1,420'}
              value={itemsInput}
              onChangeText={setItemsInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeAddModal}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddKhata}>
                <Text style={styles.saveText}>{editingCustomerId ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSettingsMenu}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSettingsMenu(false)}
      >
        <View style={styles.settingsOverlay}>
          <TouchableOpacity
            style={styles.settingsOverlayTap}
            activeOpacity={1}
            onPress={() => setShowSettingsMenu(false)}
          />
          <View style={styles.settingsMenuCard}>
            <TouchableOpacity style={styles.settingsMenuItem} onPress={handleExportBackup}>
              <Text style={styles.settingsMenuText}>Export Backup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsMenuItem} onPress={handleRestoreBackup}>
              <Text style={styles.settingsMenuText}>Restore Backup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsMenuItem} onPress={handleLogout}>
              <Text style={styles.settingsMenuTextDanger}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
    overflow: 'hidden',
  },
  bgAccentTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    top: -90,
    right: -110,
  },
  bgAccentBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    bottom: -70,
    left: -90,
  },
  contentContainer: { paddingBottom: 130, paddingTop: 4 },
  headerCard: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerText: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  headerSubText: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    color: '#1f2937',
    fontSize: 20,
    marginTop: -3,
    fontWeight: '700',
  },
  settingsOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 78,
    paddingRight: 20,
  },
  settingsOverlayTap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  settingsMenuCard: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    overflow: 'hidden',
  },
  settingsMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsMenuText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsMenuTextDanger: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    backgroundColor: '#2563eb',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 28,
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  fabText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#ececec',
    borderRadius: 8,
  },
  cancelText: {
    color: '#444',
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#007BFF',
    borderRadius: 8,
  },
  saveText: {
    color: 'white',
    fontWeight: '700',
  },
  reminderBox: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#fff4e5',
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde7bf',
  },
  dueTodayBox: {
    backgroundColor: '#fff3cd',
  },
  overdueBox: {
    backgroundColor: '#fde8e8',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8a5a00',
    marginBottom: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3ddb7',
  },
  reminderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2a2a2a',
  },
  reminderMeta: {
    fontSize: 12,
    color: '#5f5f5f',
    marginTop: 2,
  },
  reminderBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  reminderBtnText: {
    color: 'white',
    fontWeight: '700',
  },
  cardActionsRow: {
    marginHorizontal: 15,
    marginTop: 2,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  editBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  editBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  doneBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  slipBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  slipBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  itemsBox: {
    marginHorizontal: 15,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2f2f2f',
    marginBottom: 6,
  },
  itemLine: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 2,
  },
  clearedActionsRow: {
    marginHorizontal: 15,
    marginTop: 2,
    marginBottom: 8,
    backgroundColor: '#eef8ef',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearedText: {
    color: '#2d7d46',
    fontSize: 13,
    fontWeight: '600',
  },
  clearedDate: {
    color: '#2d7d46',
    fontSize: 12,
    fontWeight: '600',
  },
  clearedRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  undoBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#c62828',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});