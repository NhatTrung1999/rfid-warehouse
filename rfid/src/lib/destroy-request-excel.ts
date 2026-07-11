import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { Platform } from 'react-native';
import type { DestroyRequestData } from './destroy-request-service';

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface DestroyRequestExcelColumn {
  label: string;
  key: keyof DestroyRequestData;
}

export interface ExportDestroyRequestsResult {
  fileName: string;
  fileUri: string;
  savedToFolder: boolean;
}

function formatTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '_',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function formatCellValue(value: DestroyRequestData[keyof DestroyRequestData]) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export async function exportDestroyRequestsToExcel(
  rows: DestroyRequestData[],
  columns: readonly DestroyRequestExcelColumn[],
): Promise<ExportDestroyRequestsResult> {
  const worksheetRows = rows.map((row) =>
    columns.reduce<Record<string, string>>((nextRow, column) => {
      nextRow[column.label] = formatCellValue(row[column.key]);
      return nextRow;
    }, {}),
  );

  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: columns.map((column) => column.label),
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Destroy Request');

  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const fileName = `Destroy_Request_${formatTimestamp()}.xlsx`;

  if (Platform.OS === 'android') {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      throw new Error('Save canceled.');
    }

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      EXCEL_MIME_TYPE,
    );

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { fileName, fileUri, savedToFolder: true };
  }

  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    throw new Error('Document directory is not available on this device.');
  }

  const fileUri = `${documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { fileName, fileUri, savedToFolder: false };
}
