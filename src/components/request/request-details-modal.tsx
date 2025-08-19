// src/components/request/request-details-modal.tsx
"use client";

import { useState } from "react";
import { X, Check, Ban, FileText, DollarSign, Building, User, Calendar, MessageSquare } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { REQUEST_STATUS } from "@/constants";

// Type derivation from constants
type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

interface PendingRequest {
  id: string;
  requestId: string;
  title: string;
  requester: string;
  amount: string;
  currency: string;
  submittedOn: string;
  branch: string;
  vendor: string;
  po?: string;
  status: RequestStatus;
}

interface GLCodingDetail {
  accountCode: string;
  accountDescription: string;
  facilityCode: string;
  facilityDescription: string;
  taxCode: string;
  amount: number;
  equipment?: string;
  comments?: string;
}

interface RequestDetailsModalProps {
  request: PendingRequest;
  onClose: () => void;
  onApprove: (comments: string) => void;
  onReject: (comments: string) => void;
  loading: boolean;
}

export default function RequestDetailsModal({ 
  request, 
  onClose, 
  onApprove, 
  onReject, 
  loading 
}: RequestDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'gl-coding' | 'documents'>('overview');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [glCodingDetails, setGLCodingDetails] = useState<GLCodingDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Mock GL Coding data - in real app, this would be fetched
  const mockGLCoding: GLCodingDetail[] = [
    {
      accountCode: '1001',
      accountDescription: 'Office Supplies',
      facilityCode: 'FAC001',
      facilityDescription: 'Toronto Main',
      taxCode: 'HST',
      amount: 1500.00,
      equipment: 'Printer HP-2024',
      comments: 'Monthly office supplies order'
    },
    {
      accountCode: '1002',
      accountDescription: 'Equipment',
      facilityCode: 'FAC001',
      facilityDescription: 'Toronto Main',
      taxCode: 'HST',
      amount: 2500.00,
      equipment: 'Laptop Dell-XPS',
      comments: 'Replacement for damaged unit'
    }
  ];

  const handleAction = () => {
    if (action === 'approve') {
      onApprove(comments);
    } else if (action === 'reject') {
      onReject(comments);
    }
    setAction(null);
    setComments('');
  };

  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    return `${currency} $${numAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`;
  };

  const totalGLAmount = mockGLCoding.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
            <p className="text-sm text-gray-600 mt-1">{request.requestId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'gl-coding', label: 'GL Coding', icon: DollarSign },
              { id: 'documents', label: 'Documents', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Requester</p>
                      <p className="text-gray-900">{request.requester}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Building className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Branch</p>
                      <p className="text-gray-900">{request.branch}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Submitted</p>
                      <p className="text-gray-900">
                        {new Date(request.submittedOn).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatAmount(request.amount, request.currency)}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vendor</p>
                    <p className="text-gray-900">{request.vendor}</p>
                  </div>
                  
                  {request.po && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Purchase Order</p>
                      <p className="text-gray-900">{request.po}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gl-coding' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">GL Coding Breakdown</h3>
                <div className="text-sm text-gray-600">
                  Total: <span className="font-medium">${totalGLAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockGLCoding.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.accountCode}</div>
                            <div className="text-sm text-gray-500">{item.accountDescription}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.facilityCode}</div>
                            <div className="text-sm text-gray-500">{item.facilityDescription}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.taxCode}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          ${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Attached Documents</h3>
              
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Invoice PDF</p>
                <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Section */}
        {!action && (
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAction('reject')}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 flex items-center"
              >
                <Ban className="w-4 h-4 mr-2" />
                Reject
              </button>
              <button
                onClick={() => setAction('approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </button>
            </div>
          </div>
        )}

        {/* Comments Section for Action */}
        {action && (
          <div className="border-t border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {action === 'approve' ? 'Approval Comments (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={action === 'approve' ? 'Add any approval notes...' : 'Please provide a reason for rejection...'}
                  required={action === 'reject'}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setAction(null);
                    setComments('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={loading || (action === 'reject' && !comments.trim())}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    action === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                      : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400'
                  }`}
                >
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      {action === 'approve' ? <Check className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                      {action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}