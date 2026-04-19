// src/utils/whatsapp.js
import { Linking, Alert } from 'react-native';

export const sendWhatsAppReminder = async (phone, name, amount, dueDate, loanDate) => {
  if (!phone) {
    Alert.alert("Error", "Customer ka phone number majood nahi hai.");
    return;
  }

  // Pakistan numbers format fix (converts 0300... to +92300...)
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+92' + formattedPhone.substring(1);
  }

  const message = `Assalam-o-Alaikum ${name},\n\nAap ne ${loanDate || 'recently'} qarza par shopping ki thi.\nPending amount: Rs. ${amount}\nDue date: ${dueDate || 'N/A'}\n\nMeharbani karke due date se pehle payment clear kar dein. Shukriya.`;
  
  const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "WhatsApp is phone mein install nahi hai.");
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "WhatsApp open karne mein masla aa raha hai.");
  }
};

export const sendWhatsAppClearMessage = async (phone, name) => {
  if (!phone) {
    Alert.alert("Error", "Customer ka phone number majood nahi hai.");
    return;
  }

  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+92' + formattedPhone.substring(1);
  }

  const message = `Assalam-o-Alaikum ${name}, your payment is clear. Thank you.`;
  const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "WhatsApp is phone mein install nahi hai.");
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "WhatsApp open karne mein masla aa raha hai.");
  }
};

export const sendWhatsAppDueStatusWarning = async (
  phone,
  name,
  amount,
  dueDate,
  status
) => {
  if (!phone) {
    Alert.alert('Error', 'Customer ka phone number majood nahi hai.');
    return;
  }

  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+92' + formattedPhone.substring(1);
  }

  let openingLine = 'Aapki payment due hone wali hai.';
  if (status === 'dueToday') {
    openingLine = 'Aapki payment aaj due hai.';
  } else if (status === 'overdue') {
    openingLine = 'Aapki payment due date se late ho chuki hai.';
  }

  const message = `Assalam-o-Alaikum ${name},\n\n${openingLine}\nPending amount: Rs. ${amount}\nDue date: ${dueDate || 'N/A'}\n\nBaraye meharbani payment clear kar dein. Shukriya.`;
  const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'WhatsApp is phone mein install nahi hai.');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'WhatsApp open karne mein masla aa raha hai.');
  }
};