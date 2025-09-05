// src/components/admin/dictionary-grid.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Edit2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Database,
  Users,
  Building,
  MapPin,
  AlertTriangle,
  Check,
  Clock,
  User
} from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorMessage from "@/components/ui/error-message";

// Dictionary types based on schema with audit fields
interface ApproverEntry {
  approverId: string;
  erp: string | null;
  branch: string | null;
  authorizedAmount: string | null;
  authorizedApprover: string | null;
  emailAddress: string | null;
  backUpApprover: string | null;
  backUpEmailAddress: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdDate?: Date | null;
  modifiedDate?: Date | null;
}

interface AccountEntry {
  accountCode: string;
  accountDescription: string | null;
  accountCombined: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdDate?: Date | null;
  modifiedDate?: Date | null;
}

interface FacilityEntry {
  facilityCode: string;
  facilityDescription: string | null;
  facilityCombined: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdDate?: Date | null;
  modifiedDate?: Date | null;
}

type DictionaryEntry = ApproverEntry | AccountEntry | FacilityEntry;

type DictionaryType = 'approvers' | 'accounts' | 'facilities';

interface DictionaryGridProps {
  userEmail: string;
}

export default function DictionaryGrid({ userEmail }: DictionaryGridProps) {
  const [activeTab, setActiveTab] = useState<DictionaryType>('approvers');
  const [approvers, setApprovers] = useState<ApproverEntry[]>([]);
  const [accounts, setAccounts] = useState<AccountEntry[]>([]);
  const [facilities, setFacilities] = useState<FacilityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<DictionaryEntry | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntryData, setNewEntryData] = useState<Partial<DictionaryEntry>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadDictionaryData();
  }, []);

  const loadDictionaryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load all dictionary data from API
      const [approversRes, accountsRes, facilitiesRes] = await Promise.all([
        fetch('/api/admin/dictionaries/approvers'),
        fetch('/api/admin/dictionaries/accounts'),
        fetch('/api/admin/dictionaries/facilities')
      ]);

      // Check individual responses and provide specific error messages
      if (!approversRes.ok) {
        console.error('Approvers API failed:', approversRes.status, approversRes.statusText);
      }
      if (!accountsRes.ok) {
        console.error('Accounts API failed:', accountsRes.status, accountsRes.statusText);
      }
      if (!facilitiesRes.ok) {
        console.error('Facilities API failed:', facilitiesRes.status, facilitiesRes.statusText);
      }

      // Parse responses - handle cases where API might not exist yet
      let approversData: { data?: { data?: ApproverEntry[] } } = { data: { data: [] } };
      let accountsData: { data?: { data?: AccountEntry[] } } = { data: { data: [] } };
      let facilitiesData: { data?: { data?: FacilityEntry[] } } = { data: { data: [] } };

      if (approversRes.ok) {
        try {
          approversData = await approversRes.json();
        } catch (e) {
          console.warn('Failed to parse approvers response:', e);
        }
      }

      if (accountsRes.ok) {
        try {
          accountsData = await accountsRes.json();
        } catch (e) {
          console.warn('Failed to parse accounts response:', e);
        }
      }

      if (facilitiesRes.ok) {
        try {
          facilitiesData = await facilitiesRes.json();
        } catch (e) {
          console.warn('Failed to parse facilities response:', e);
        }
      }

      // Fix: APIs return nested data structure {success: true, data: {data: [...], message: '...'}}
      setApprovers(Array.isArray(approversData.data?.data) ? approversData.data.data : []);
      setAccounts(Array.isArray(accountsData.data?.data) ? accountsData.data.data : []);
      setFacilities(Array.isArray(facilitiesData.data?.data) ? facilitiesData.data.data : []);

      console.log('Dictionary data loaded:', {
        approvers: approversData.data?.data?.length || 0,
        accounts: accountsData.data?.data?.length || 0,
        facilities: facilitiesData.data?.data?.length || 0
      });
      
      // Debug: Log actual data structure
      console.log('Raw API responses:', {
        approversData,
        accountsData, 
        facilitiesData
      });
      
      // Debug: Log what we're setting in state
      console.log('Setting state with:', {
        approvers: Array.isArray(approversData.data?.data) ? approversData.data.data : [],
        accounts: Array.isArray(accountsData.data?.data) ? accountsData.data.data : [],
        facilities: Array.isArray(facilitiesData.data?.data) ? facilitiesData.data.data : []
      });

    } catch (err) {
      console.error('Dictionary loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dictionary data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, entry: DictionaryEntry) => {
    setEditingId(id);
    setEditingData({ ...entry });
  };

  const handleSave = async () => {
    if (!editingData || !editingId) return;

    try {
      const response = await fetch(`/api/admin/dictionaries/${activeTab}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingData,
          updatedBy: userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update entry');
      }

      // Refresh data
      await loadDictionaryData();
      setEditingId(null);
      setEditingData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
    setShowAddForm(false);
    setNewEntryData({});
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/dictionaries/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: userEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      // Refresh data
      await loadDictionaryData();
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch(`/api/admin/dictionaries/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEntryData,
          createdBy: userEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create entry');
      }

      // Refresh data and reset form
      await loadDictionaryData();
      setShowAddForm(false);
      setNewEntryData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
    }
  };

  const getCurrentData = () => {
    const currentData = (() => {
      switch (activeTab) {
        case 'approvers': return approvers;
        case 'accounts': return accounts;
        case 'facilities': return facilities;
        default: return [];
      }
    })();
    
    // Debug: Log what data is being rendered
    console.log(`Current data for ${activeTab}:`, currentData);
    return currentData;
  };

  const getTabIcon = (tab: DictionaryType) => {
    switch (tab) {
      case 'approvers': return Users;
      case 'accounts': return Building;
      case 'facilities': return MapPin;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="lg" text="Loading dictionary data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={loadDictionaryData} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {(['approvers', 'accounts', 'facilities'] as DictionaryType[]).map((tab) => {
          const Icon = getTabIcon(tab);
          const isActive = activeTab === tab;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {getCurrentData().length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dictionary
          </h3>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add Entry
        </button>
      </div>

      {/* Add Entry Form */}
      {showAddForm && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">
            Add New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
          </h4>
          <AddEntryForm
            type={activeTab}
            data={newEntryData}
            onChange={(field, value) => setNewEntryData(prev => ({ ...prev, [field]: value }))}
            onSave={handleAdd}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Data Grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'approvers' && (
            <ApproversTable
              data={approvers}
              editingId={editingId}
              editingData={editingData as ApproverEntry}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={(id) => setConfirmDelete(id)}
              onFieldChange={(field, value) => 
                setEditingData(prev => prev ? ({ ...prev, [field]: value }) : null)
              }
            />
          )}
          
          {activeTab === 'accounts' && (
            <AccountsTable
              data={accounts}
              editingId={editingId}
              editingData={editingData as AccountEntry}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={(id) => setConfirmDelete(id)}
              onFieldChange={(field, value) => 
                setEditingData(prev => prev ? ({ ...prev, [field]: value }) : null)
              }
            />
          )}
          
          {activeTab === 'facilities' && (
            <FacilitiesTable
              data={facilities}
              editingId={editingId}
              editingData={editingData as FacilityEntry}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={(id) => setConfirmDelete(id)}
              onFieldChange={(field, value) => 
                setEditingData(prev => prev ? ({ ...prev, [field]: value }) : null)
              }
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Approvers Table Component
function ApproversTable({ 
  data, editingId, editingData, onEdit, onSave, onCancel, onDelete, onFieldChange 
}: {
  data: ApproverEntry[];
  editingId: string | null;
  editingData: ApproverEntry | null;
  onEdit: (id: string, entry: ApproverEntry) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            ERP
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Branch
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Authorized Amount
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Authorized Approver
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email Address
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Back-up Approver
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Back-up Email
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {(data || []).map((approver) => (
          <tr key={approver.approverId} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === approver.approverId ? (
                <input
                  type="text"
                  value={editingData?.erp || ''}
                  onChange={(e) => onFieldChange('erp', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                approver.erp || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === approver.approverId ? (
                <input
                  type="text"
                  value={editingData?.branch || ''}
                  onChange={(e) => onFieldChange('branch', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              ) : (
                approver.branch || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === approver.approverId ? (
                <input
                  type="number"
                  step="0.01"
                  value={editingData?.authorizedAmount || ''}
                  onChange={(e) => onFieldChange('authorizedAmount', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                approver.authorizedAmount ? `$${parseFloat(approver.authorizedAmount).toLocaleString()}` : '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === approver.approverId ? (
                <input
                  type="text"
                  value={editingData?.authorizedApprover || ''}
                  onChange={(e) => onFieldChange('authorizedApprover', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              ) : (
                approver.authorizedApprover || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === approver.approverId ? (
                <input
                  type="email"
                  value={editingData?.emailAddress || ''}
                  onChange={(e) => onFieldChange('emailAddress', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                approver.emailAddress || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === approver.approverId ? (
                <input
                  type="text"
                  value={editingData?.backUpApprover || ''}
                  onChange={(e) => onFieldChange('backUpApprover', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                approver.backUpApprover || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === approver.approverId ? (
                <input
                  type="email"
                  value={editingData?.backUpEmailAddress || ''}
                  onChange={(e) => onFieldChange('backUpEmailAddress', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                approver.backUpEmailAddress || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              {editingId === approver.approverId ? (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onSave}
                    className="text-green-600 hover:text-green-900"
                    title="Save changes"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={onCancel}
                    className="text-gray-600 hover:text-gray-900"
                    title="Cancel editing"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(approver.approverId, approver)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit approver"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(approver.approverId)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete approver"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
        {(!data || data.length === 0) && (
          <tr>
            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
              No approvers found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// Accounts Table Component
function AccountsTable({ 
  data, editingId, editingData, onEdit, onSave, onCancel, onDelete, onFieldChange 
}: {
  data: AccountEntry[];
  editingId: string | null;
  editingData: AccountEntry | null;
  onEdit: (id: string, entry: AccountEntry) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Account Code
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Combined Display
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <User size={12} />
              Created By
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              Modified
            </div>
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {(data || []).map((account) => (
          <tr key={account.accountCode} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {account.accountCode}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === account.accountCode ? (
                <input
                  type="text"
                  value={editingData?.accountDescription || ''}
                  onChange={(e) => onFieldChange('accountDescription', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                account.accountDescription || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === account.accountCode ? (
                <input
                  type="text"
                  value={editingData?.accountCombined || ''}
                  onChange={(e) => onFieldChange('accountCombined', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                account.accountCombined || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <div className="flex flex-col">
                <span className="text-xs font-medium">{account.createdBy || '-'}</span>
                <span className="text-xs text-gray-400">
                  {account.createdDate ? new Date(account.createdDate).toLocaleDateString() : '-'}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <div className="flex flex-col">
                <span className="text-xs font-medium">{account.updatedBy || '-'}</span>
                <span className="text-xs text-gray-400">
                  {account.modifiedDate ? new Date(account.modifiedDate).toLocaleDateString() : '-'}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              {editingId === account.accountCode ? (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onSave}
                    className="text-green-600 hover:text-green-900"
                    title="Save changes"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={onCancel}
                    className="text-gray-600 hover:text-gray-900"
                    title="Cancel editing"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(account.accountCode, account)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit account"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(account.accountCode)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete account"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
        {(!data || data.length === 0) && (
          <tr>
            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
              No accounts found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// Add Entry Form Component
function AddEntryForm({ 
  type, data, onChange, onSave, onCancel 
}: {
  type: DictionaryType;
  data: Partial<DictionaryEntry>;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  if (type === 'approvers') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ERP</label>
            <input
              type="text"
              value={(data as Partial<ApproverEntry>).erp || ''}
              onChange={(e) => onChange('erp', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Branch *</label>
            <input
              type="text"
              value={(data as Partial<ApproverEntry>).branch || ''}
              onChange={(e) => onChange('branch', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Authorized Amount</label>
            <input
              type="number"
              step="0.01"
              value={(data as Partial<ApproverEntry>).authorizedAmount || ''}
              onChange={(e) => onChange('authorizedAmount', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Authorized Approver *</label>
            <input
              type="text"
              value={(data as Partial<ApproverEntry>).authorizedApprover || ''}
              onChange={(e) => onChange('authorizedApprover', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={(data as Partial<ApproverEntry>).emailAddress || ''}
              onChange={(e) => onChange('emailAddress', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Back-up Approver</label>
            <input
              type="text"
              value={(data as Partial<ApproverEntry>).backUpApprover || ''}
              onChange={(e) => onChange('backUpApprover', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Back-up Email</label>
            <input
              type="email"
              value={(data as Partial<ApproverEntry>).backUpEmailAddress || ''}
              onChange={(e) => onChange('backUpEmailAddress', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Save size={16} className="inline mr-1" />
            Create Approver
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <X size={16} className="inline mr-1" />
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (type === 'accounts') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Code *</label>
            <input
              type="text"
              value={(data as Partial<AccountEntry>).accountCode || ''}
              onChange={(e) => onChange('accountCode', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={(data as Partial<AccountEntry>).accountDescription || ''}
              onChange={(e) => onChange('accountDescription', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Combined Display</label>
            <input
              type="text"
              value={(data as Partial<AccountEntry>).accountCombined || ''}
              onChange={(e) => onChange('accountCombined', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Leave empty to auto-generate"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Save size={16} className="inline mr-1" />
            Create Account
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <X size={16} className="inline mr-1" />
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (type === 'facilities') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Facility Code *</label>
            <input
              type="text"
              value={(data as Partial<FacilityEntry>).facilityCode || ''}
              onChange={(e) => onChange('facilityCode', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={(data as Partial<FacilityEntry>).facilityDescription || ''}
              onChange={(e) => onChange('facilityDescription', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Combined Display</label>
            <input
              type="text"
              value={(data as Partial<FacilityEntry>).facilityCombined || ''}
              onChange={(e) => onChange('facilityCombined', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Leave empty to auto-generate"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Save size={16} className="inline mr-1" />
            Create Facility
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <X size={16} className="inline mr-1" />
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return null;
}

// Facilities Table Component  
function FacilitiesTable({ 
  data, editingId, editingData, onEdit, onSave, onCancel, onDelete, onFieldChange 
}: {
  data: FacilityEntry[];
  editingId: string | null;
  editingData: FacilityEntry | null;
  onEdit: (id: string, entry: FacilityEntry) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onFieldChange: (field: string, value: string) => void;
}) {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Facility Code
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Combined Display
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <User size={12} />
              Created By
            </div>
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              Modified
            </div>
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {(data || []).map((facilityEntry) => (
          <tr key={facilityEntry.facilityCode} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {facilityEntry.facilityCode}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === facilityEntry.facilityCode ? (
                <input
                  type="text"
                  value={editingData?.facilityDescription || ''}
                  onChange={(e) => onFieldChange('facilityDescription', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                facilityEntry.facilityDescription || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {editingId === facilityEntry.facilityCode ? (
                <input
                  type="text"
                  value={editingData?.facilityCombined || ''}
                  onChange={(e) => onFieldChange('facilityCombined', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                facilityEntry.facilityCombined || '-'
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <div className="flex flex-col">
                <span className="text-xs font-medium">{facilityEntry.createdBy || '-'}</span>
                <span className="text-xs text-gray-400">
                  {facilityEntry.createdDate ? new Date(facilityEntry.createdDate).toLocaleDateString() : '-'}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              <div className="flex flex-col">
                <span className="text-xs font-medium">{facilityEntry.updatedBy || '-'}</span>
                <span className="text-xs text-gray-400">
                  {facilityEntry.modifiedDate ? new Date(facilityEntry.modifiedDate).toLocaleDateString() : '-'}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              {editingId === facilityEntry.facilityCode ? (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={onSave}
                    className="text-green-600 hover:text-green-900"
                    title="Save changes"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={onCancel}
                    className="text-gray-600 hover:text-gray-900"
                    title="Cancel editing"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(facilityEntry.facilityCode, facilityEntry)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit facility"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(facilityEntry.facilityCode)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete facility"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
        {(!data || data.length === 0) && (
          <tr>
            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
              No facilities found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}