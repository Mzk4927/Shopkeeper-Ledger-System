// src/screens/LedgerScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getTransactions } from '../database/db';
import { sendWhatsAppReminder } from '../utils/whatsapp';

export default function LedgerScreen({ route }) {
  // Route params se customer ka data mil raha hai (passed from Dashboard)
  const { customer } = route.params; 
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const data = await getTransactions(customer.id);
    setTransactions(data);
  };

  const handleSendReminder = () => {
    if (customer.total_balance <= 0) {
      alert("No pending amount to remind!");
      return;
    }

    sendWhatsAppReminder(
      customer.phone,
      customer.name,
      customer.total_balance,
      customer.due_date,
      customer.loan_date
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerCard}>
        <Text style={styles.headerName}>{customer.name}</Text>
        <Text style={styles.headerBalance}>Net Pending: Rs. {customer.total_balance}</Text>
      </View>

      {/* WhatsApp Button */}
      <TouchableOpacity style={styles.whatsappBtn} onPress={handleSendReminder}>
        <Text style={styles.btnText}>Send WhatsApp Reminder</Text>
      </TouchableOpacity>

      {/* Transaction History */}
      <Text style={styles.historyTitle}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.transactionRow}>
            <Text style={styles.date}>{item.date}</Text>
            <View>
              <Text style={item.type === 'given' ? styles.redText : styles.greenText}>
                {item.type === 'given' ? 'Udhaar Diya' : 'Payment Aayi'}
              </Text>
              <Text style={styles.amount}>Rs. {item.amount}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Koi transaction nahi hai.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 15 },
  headerCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 15, elevation: 2 },
  headerName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerBalance: { fontSize: 20, color: '#D32F2F', marginTop: 5, fontWeight: 'bold' },
  whatsappBtn: { backgroundColor: '#25D366', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#555' },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 8, elevation: 1 },
  date: { color: '#888', alignSelf: 'center' },
  redText: { color: '#D32F2F', fontWeight: 'bold', textAlign: 'right' },
  greenText: { color: '#388E3C', fontWeight: 'bold', textAlign: 'right' },
  amount: { fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  empty: { textAlign: 'center', marginTop: 20, color: '#777' }
});