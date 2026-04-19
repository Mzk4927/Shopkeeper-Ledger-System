import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportDatabaseSnapshot } from '../database/db';

const buildBackupName = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `khata-backup-${stamp}.json`;
};

export const exportBackupFile = async () => {
  try {
    const snapshot = await exportDatabaseSnapshot();
    const fileName = buildBackupName();
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(snapshot, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

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
