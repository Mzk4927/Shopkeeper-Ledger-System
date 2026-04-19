// src/components/CustomerCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function CustomerCard({ customer, onPress }) {
  // Agar balance 0 se zyada hai toh red, warna green/black
  const balanceColor = customer.total_balance > 0 ? '#D32F2F' : '#388E3C';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.phone}>{customer.phone}</Text>
        {customer.loan_date ? <Text style={styles.meta}>Loan: {customer.loan_date}</Text> : null}
        {customer.due_date ? <Text style={styles.meta}>Due: {customer.due_date}</Text> : null}
      </View>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={[styles.balance, { color: balanceColor }]}>
          Rs. {customer.total_balance}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    padding: 15, 
    marginVertical: 8, 
    marginHorizontal: 15, 
    backgroundColor: 'white', 
    borderRadius: 10, 
    elevation: 3, // Shadow for Android
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  phone: { fontSize: 14, color: '#666', marginTop: 4 },
  meta: { fontSize: 12, color: '#555', marginTop: 2 },
  balanceContainer: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 12, color: '#888' },
  balance: { fontSize: 18, fontWeight: 'bold' }
});