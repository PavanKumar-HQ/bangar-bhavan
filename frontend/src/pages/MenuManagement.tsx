import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { api } from '../lib/api';
import { Plus, Trash2, Edit2, Star, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { sound } from '../lib/sound';

export const MenuManagement: React.FC = () => {
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingDish, setEditingDish] = useState<Partial<MenuItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/menu?includeInactive=true');
      setDishes(res.data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish?.name || editingDish.price === undefined) return;

    try {
      if (editingDish.id) {
        await api.put(`/menu/${editingDish.id}`, editingDish);
      } else {
        await api.post('/menu', editingDish);
      }
      sound.playSuccess();
      setIsModalOpen(false);
      setEditingDish(null);
      fetchMenu();
    } catch (err) {
      alert('Failed to save menu item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      sound.playError();
      setDishes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleToggleActive = async (dish: MenuItem) => {
    try {
      const updated = await api.put(`/menu/${dish.id}`, { isActive: !dish.isActive });
      sound.playTap();
      setDishes((prev) => prev.map((d) => (d.id === dish.id ? updated.data : d)));
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleToggleFavorite = async (dish: MenuItem) => {
    try {
      const updated = await api.put(`/menu/${dish.id}`, { isFavorite: !dish.isFavorite });
      sound.playTap();
      setDishes((prev) => prev.map((d) => (d.id === dish.id ? updated.data : d)));
    } catch (err) {
      alert('Failed to toggle favorite');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    if (
      (direction === 'UP' && index === 0) ||
      (direction === 'DOWN' && index === dishes.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const updatedDishes = [...dishes];
    const temp = updatedDishes[index];
    updatedDishes[index] = updatedDishes[targetIndex];
    updatedDishes[targetIndex] = temp;

    // Recalculate displayOrders
    const reorderedPayload = updatedDishes.map((item, idx) => ({
      id: item.id,
      displayOrder: idx + 1
    }));

    setDishes(updatedDishes);

    try {
      await api.put('/menu/reorder', { items: reorderedPayload });
      sound.playTap();
    } catch (err) {
      console.error('Reorder sync error:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-cream-300 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-xl text-darkbrown-900">Menu Management</h1>
          <p className="text-xs text-darkbrown-600">Add, edit prices, toggle availability, and reorder dishes</p>
        </div>

        <button
          onClick={() => {
            setEditingDish({ name: '', price: 40, category: 'Chats', isActive: true, isFavorite: false });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-deepred-800 hover:bg-deepred-900 text-cream-50 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 border border-deepred-900"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-xl border border-cream-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-darkbrown-900">
            <thead className="bg-cream-100 uppercase font-black text-darkbrown-600 border-b border-cream-300">
              <tr>
                <th className="p-3 text-center">Order</th>
                <th className="p-3">Dish Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-center">Favorite</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-darkbrown-500">Loading menu...</td>
                </tr>
              ) : dishes.map((dish, idx) => (
                <tr key={dish.id} className={`hover:bg-cream-50 transition-colors ${!dish.isActive ? 'opacity-50 bg-cream-100/50' : ''}`}>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-cream-200 disabled:opacity-20"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold px-1">{idx + 1}</span>
                      <button
                        onClick={() => handleMoveOrder(idx, 'DOWN')}
                        disabled={idx === dishes.length - 1}
                        className="p-1 rounded bg-cream-200 disabled:opacity-20"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 font-bold text-sm text-darkbrown-900">{dish.name}</td>
                  <td className="p-3">
                    <span className="bg-cream-200 px-2 py-0.5 rounded text-[10px] font-black">
                      {dish.category}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-black text-base text-deepred-800">
                    ₹{dish.price}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleFavorite(dish)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        dish.isFavorite ? 'bg-softyellow-200 border-softyellow-400 text-warmorange-600' : 'bg-cream-100 border-cream-300 text-darkbrown-400'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleActive(dish)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                        dish.isActive
                          ? 'bg-successgreen-800 text-white'
                          : 'bg-deepred-800 text-white'
                      }`}
                    >
                      {dish.isActive ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingDish(dish);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded bg-cream-200 hover:bg-cream-300 text-darkbrown-900"
                        title="Edit Dish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dish.id)}
                        className="p-1.5 rounded bg-deepred-100 hover:bg-deepred-200 text-deepred-800"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-darkbrown-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border-2 border-deepred-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <h3 className="font-display font-black text-lg text-darkbrown-900">
                {editingDish?.id ? 'Edit Dish' : 'Add New Dish'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg bg-cream-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block mb-1 text-darkbrown-700">Dish Name</label>
                <input
                  type="text"
                  required
                  value={editingDish?.name || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                  placeholder="e.g. Masala Puri"
                  className="w-full p-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl text-darkbrown-900 font-semibold focus:outline-none focus:border-deepred-700"
                />
              </div>

              <div>
                <label className="block mb-1 text-darkbrown-700">Price (₹)</label>
                <input
                  type="number"
                  required
                  step="1"
                  value={editingDish?.price || 40}
                  onChange={(e) => setEditingDish({ ...editingDish, price: parseFloat(e.target.value) })}
                  className="w-full p-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl text-darkbrown-900 font-semibold focus:outline-none focus:border-deepred-700"
                />
              </div>

              <div>
                <label className="block mb-1 text-darkbrown-700">Category</label>
                <input
                  type="text"
                  required
                  value={editingDish?.category || 'Chats'}
                  onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })}
                  placeholder="Puris, Chats, Pav Specialties, Beverages"
                  className="w-full p-2.5 bg-cream-50 border-2 border-cream-300 rounded-xl text-darkbrown-900 font-semibold focus:outline-none focus:border-deepred-700"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish?.isFavorite || false}
                    onChange={(e) => setEditingDish({ ...editingDish, isFavorite: e.target.checked })}
                    className="w-4 h-4 accent-deepred-800"
                  />
                  <span>Mark Top Favorite</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish?.isActive !== false}
                    onChange={(e) => setEditingDish({ ...editingDish, isActive: e.target.checked })}
                    className="w-4 h-4 accent-deepred-800"
                  />
                  <span>Active</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-4 rounded-xl bg-deepred-800 hover:bg-deepred-900 text-cream-50 font-black text-sm uppercase tracking-wider shadow-md"
              >
                Save Dish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
