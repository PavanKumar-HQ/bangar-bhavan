import React, { createContext, useContext, useState } from 'react';
import { Order, ShopSettings } from '../types';
import { buildReceiptBuffer } from '../lib/escpos';

interface PrinterContextType {
  isConnected: boolean;
  deviceName: string | null;
  connectPrinter: () => Promise<boolean>;
  disconnectPrinter: () => void;
  printReceipt: (order: Order, settings?: ShopSettings) => Promise<boolean>;
  testPrint: (settings?: ShopSettings) => Promise<boolean>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [device, setDevice] = useState<any>(null);
  const [characteristic, setCharacteristic] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  const connectPrinter = async (): Promise<boolean> => {
    if (!(navigator as any).bluetooth) {
      alert('Web Bluetooth API is not supported on this browser or platform. Please use Chrome on Android or Desktop.');
      return false;
    }

    try {
      const selectedDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS printer service
          '00001101-0000-1000-8000-00805f9b34fb', // Serial port profile
          '49535343-fe7d-4ae5-8fa9-9fafd205e455'
        ]
      });

      if (!selectedDevice) return false;

      const server = await selectedDevice.gatt.connect();
      setDevice(selectedDevice);
      setDeviceName(selectedDevice.name || 'Thermal ESC/POS Printer');

      // Search primary services
      const services = await server.getPrimaryServices();
      let targetChar = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            targetChar = char;
            break;
          }
        }
        if (targetChar) break;
      }

      if (targetChar) {
        setCharacteristic(targetChar);
        setIsConnected(true);

        selectedDevice.addEventListener('gattserverdisconnected', () => {
          setIsConnected(false);
          setCharacteristic(null);
        });

        return true;
      } else {
        alert('Could not find writable printer characteristic.');
        return false;
      }
    } catch (err: any) {
      console.warn('Bluetooth connection cancelled or failed:', err);
      return false;
    }
  };

  const disconnectPrinter = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setCharacteristic(null);
    setIsConnected(false);
    setDeviceName(null);
  };

  const printReceipt = async (order: Order, settings?: ShopSettings): Promise<boolean> => {
    if (!characteristic || !isConnected) {
      console.log('Printer not connected. Proceeding without physical printing.');
      return false;
    }

    try {
      const bytes = buildReceiptBuffer(order, settings);
      
      // Chunk writes to prevent Bluetooth buffer overflow (max 100 bytes per chunk)
      const chunkSize = 100;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk);
        } else {
          await characteristic.writeValue(chunk);
        }
      }
      return true;
    } catch (err) {
      console.error('Error during Bluetooth receipt printing:', err);
      return false;
    }
  };

  const testPrint = async (settings?: ShopSettings): Promise<boolean> => {
    const dummyOrder: Order = {
      id: 'TEST_101',
      tenantId: 'demo',
      invoiceNo: 'BBC-TEST-001',
      subtotal: 140,
      parcelCharge: 5,
      grandTotal: 145,
      paymentMode: 'UPI',
      status: 'SERVED',
      isParcel: true,
      createdAt: new Date().toISOString(),
      items: [
        { name: 'Pani Puri (6 pcs)', price: 40, quantity: 1 },
        { name: 'Masala Puri', price: 50, quantity: 1 },
        { name: 'Sev Puri', price: 50, quantity: 1 }
      ]
    };
    return printReceipt(dummyOrder, settings);
  };

  return (
    <PrinterContext.Provider
      value={{
        isConnected,
        deviceName,
        connectPrinter,
        disconnectPrinter,
        printReceipt,
        testPrint
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
};
