import { Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportDatabaseSnapshot, importDatabaseSnapshot } from '../database/db';

const buildBackupName = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `khata-backup-${stamp}.json`;
};

export const exportBackupFile = async () => {
  try {
    const snapshot = await exportDatabaseSnapshot();
    const fileName = buildBackupName();
    const file = new File(Paths.document, fileName);
    const jsonText = JSON.stringify(snapshot, null, 2);
    file.create({ intermediates: true, overwrite: true });
    file.write(jsonText);

    const fileUri = file.uri;

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Khata backup export',
      });
    } else {
      Alert.alert('Backup Saved', `Backup saved to:\n${fileUri}`);
    }

    return fileUri;
  } catch (error) {
    console.error(error);
    Alert.alert('Backup Error', 'Backup export mein masla aya.');
    return null;
  }
};

export const restoreBackupFile = async () => {
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (picked.canceled) {
      return false;
    }

    const selected = picked.assets?.[0];
    if (!selected?.uri) {
      Alert.alert('Restore Error', 'Backup file select nahi hui.');
      return false;
    }

    let rawJson = '';
    rawJson = await new File(selected.uri).text();

    const parsed = JSON.parse(rawJson);
    const restored = await importDatabaseSnapshot(parsed);

    if (!restored) {
      Alert.alert('Restore Error', 'Invalid backup file format.');
      return false;
    }

    Alert.alert('Restore Complete', 'Backup data successfully restore ho gaya.');
    return true;
  } catch (error) {
    console.error(error);
    Alert.alert('Restore Error', 'Backup restore mein masla aya.');
    return false;
  }
};
