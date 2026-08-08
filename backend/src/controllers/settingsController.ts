import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;

    let settings = await prisma.settings.findUnique({
      where: { tenantId }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          tenantId,
          shopName: 'Bangar Bhavan Chats',
          address: 'Near Central Bus Stand, Bengaluru',
          phone: '+91 98765 43210',
          footerText: 'Authentic Taste • Quality Guaranteed! Visit Again!',
          parcelCharge: 5.0,
          currency: '₹'
        }
      });
    }

    return res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch shop settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { shopName, address, phone, footerText, parcelCharge, currency } = req.body;

    const updated = await prisma.settings.upsert({
      where: { tenantId },
      update: {
        ...(shopName !== undefined && { shopName }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(footerText !== undefined && { footerText }),
        ...(parcelCharge !== undefined && { parcelCharge: parseFloat(parcelCharge) }),
        ...(currency !== undefined && { currency })
      },
      create: {
        tenantId,
        shopName: shopName || 'Bangar Bhavan Chats',
        address: address || 'Near Central Bus Stand, Bengaluru',
        phone: phone || '+91 98765 43210',
        footerText: footerText || 'Authentic Taste • Quality Guaranteed! Visit Again!',
        parcelCharge: parcelCharge !== undefined ? parseFloat(parcelCharge) : 5.0,
        currency: currency || '₹'
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Failed to update shop settings' });
  }
};
