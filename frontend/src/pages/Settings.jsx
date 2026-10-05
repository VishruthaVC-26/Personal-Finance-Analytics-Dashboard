import { useState, useEffect } from 'react';
import { categoryService, authService, reportService } from '../services';
import { useAuth } from '../context/AuthContext';
import { downloadBlob } from '../utils/formatters';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ name: '', currency: 'INR' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [newCat, setNewCat] = useState({ name: '', type: 'expense' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, currency: user.currency });
    }
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const showMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await authService.updateProfile(profile);
      await refreshUser();
      showMessage('Profile updated successfully.');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Update failed.', true);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage('New passwords do not match.', true);
      return;
    }
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('Password changed successfully.');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Password change failed.', true);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await categoryService.create(newCat);
      setNewCat({ name: '', type: 'expense' });
      loadCategories();
      showMessage('Category added.');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Failed to add category.', true);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await categoryService.delete(cat.id);
      loadCategories();
      showMessage('Category deleted.');
    } catch (err) {
      showMessage(err.response?.data?.error || 'Delete failed.', true);
    }
  };

  const handleExportAll = async () => {
    try {
      const blob = await reportService.exportTransactionsCSV({});
      downloadBlob(blob, 'all-transactions.csv');
      showMessage('Export downloaded.');
    } catch (err) {
      showMessage('Export failed.', true);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'categories', label: 'Categories' },
    { id: 'data', label: 'Data & Export' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`text-sm px-4 py-2.5 rounded-lg ${
          message.includes('failed') || message.includes('do not match') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-gray-900 mb-4">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={user?.email || ''} className="input-field bg-gray-50" disabled />
            </div>
            <div>
              <label className="label">Currency</label>
              <select
                value={profile.currency}
                onChange={(e) => setProfile(p => ({ ...p, currency: e.target.value }))}
                className="input-field"
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="GBP">£ British Pound (GBP)</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                className="input-field"
                placeholder="Min. 6 characters"
                required
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn-primary">Change Password</button>
          </form>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="card max-w-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Add Custom Category</h2>
            <form onSubmit={handleAddCategory} className="flex gap-3">
              <input
                type="text"
                value={newCat.name}
                onChange={(e) => setNewCat(p => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
                className="input-field flex-1"
                required
              />
              <select
                value={newCat.type}
                onChange={(e) => setNewCat(p => ({ ...p, type: e.target.value }))}
                className="input-field w-32"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <button type="submit" className="btn-primary">Add</button>
            </form>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Your Categories</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className={`text-xs ${cat.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {cat.type}
                    </p>
                  </div>
                  {!cat.is_default && (
                    <button onClick={() => handleDeleteCategory(cat)} className="text-gray-400 hover:text-red-600 text-sm">🗑️</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="card max-w-lg">
          <h2 className="font-semibold text-gray-900 mb-2">Data Export</h2>
          <p className="text-sm text-gray-500 mb-4">Download all your transaction data as a CSV file.</p>
          <button onClick={handleExportAll} className="btn-primary">Export All Transactions (CSV)</button>
        </div>
      )}
    </div>
  );
}
