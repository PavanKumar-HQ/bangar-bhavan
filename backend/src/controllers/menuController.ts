import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getMenuItems = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const includeInactive = req.query.includeInactive === 'true';

    const menuItems = await prisma.menuItem.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true })
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    return res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

export const createMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId!;
    const { name, price, category, displayOrder, isActive, isFavorite } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const highestOrder = await prisma.menuItem.aggregate({
      where: { tenantId },
      _max: { displayOrder: true }
    });

    const nextOrder = displayOrder !== undefined ? displayOrder : (highestOrder._max.displayOrder || 0) + 1;

    const newItem = await prisma.menuItem.create({
      data: {
        tenantId,
        name,
        price: parseFloat(price),
        category: category || 'Chats',
        displayOrder: nextOrder,
        isActive: isActive !== undefined ? isActive : true,
        isFavorite: isFavorite !== undefined ? isFavorite : false
      }
    });

    return res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    return res.status(500).json({ error: 'Failed to create menu item' });
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    const { name, price, category, displayOrder, isActive, isFavorite } = req.body;

    const existing = await prisma.menuItem.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category !== undefined && { category }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
        ...(isActive !== undefined && { isActive }),
        ...(isFavorite !== undefined && { isFavorite })
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return res.status(500).json({ error: 'Failed to update menu item' });
  }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const existing = await prisma.menuItem.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await prisma.menuItem.delete({
      where: { id }
    });

    return res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

export const reorderMenuItems = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { items } = req.body; // Array of { id, displayOrder }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    await prisma.$transaction(
      items.map((item: { id: string; displayOrder: number }) =>
        prisma.menuItem.updateMany({
          where: { id: item.id, tenantId },
          data: { displayOrder: item.displayOrder }
        })
      )
    );

    return res.json({ message: 'Menu items reordered successfully' });
  } catch (error) {
    console.error('Error reordering menu items:', error);
    return res.status(500).json({ error: 'Failed to reorder menu items' });
  }
};
