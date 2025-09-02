"use client";

import { useState } from "react";
import { Plus, RotateCcw, FileText } from "lucide-react";
import { useRejectedRequests } from "@/hooks/use-dashboard-data";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorMessage from "@/components/ui/error-message";

interface RequestCreationSelectorProps {
  userEmail: string;
  onCreateNew: () => void;
  onCreateFromRejected: (rejectedRequest: any) => void;
}

export default function RequestCreationSelector({ 
  userEmail, 
  onCreateNew, 
  onCreateFromRejected 
}: RequestCreationSelectorProps) {
  const [showRejectedList, setShowRejectedList] = useState(false);
  const { data: rejectedRequests, isLoading, error } = useRejectedRequests(userEmail);

  if (showRejectedList) {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Select a rejected request to recreate</h3>
          <button 
            onClick={() => setShowRejectedList(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>
        
        {rejectedRequests?.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No rejected requests found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rejectedRequests?.map((request: any) => (
              <div 
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onCreateFromRejected(request)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{request.vendor}</p>
                    <p className="text-sm text-gray-600">{request.currency} {request.amount}</p>
                    <p className="text-xs text-gray-500">PO: {request.po}</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Rejected
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create a Request</h2>
        <p className="text-gray-600">Choose how you'd like to create your request</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create New */}
        <button
          onClick={onCreateNew}
          className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Request</h3>
          <p className="text-gray-600">Start fresh with a new approval request</p>
        </button>

        {/* From Rejected */}
        <button
          onClick={() => setShowRejectedList(true)}
          className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
        >
          <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">From Rejected Request</h3>
          <p className="text-gray-600">Recreate from a previously rejected request</p>
        </button>
      </div>
    </div>
  );
}