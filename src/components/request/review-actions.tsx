"use client";

import React from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface ReviewActionsProps {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  amountsMatch: boolean;
  pdfUploading: boolean;
  excelUploading: boolean;
}

const ReviewActions: React.FC<ReviewActionsProps> = ({
  onBack,
  onSubmit,
  isSubmitting,
  amountsMatch,
  pdfUploading,
  excelUploading,
}) => (
  <div className="flex justify-between">
    <button
      onClick={onBack}
      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      type="button"
      disabled={isSubmitting}
    >
      Back to GL Coding
    </button>
    <button
      onClick={onSubmit}
      disabled={isSubmitting || !amountsMatch}
      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      type="button"
    >
      {isSubmitting ? (
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span>
            {pdfUploading
              ? "Uploading PDF..."
              : excelUploading
              ? "Uploading Excel..."
              : "Creating Request..."}
          </span>
        </div>
      ) : (
        "Submit Request"
      )}
    </button>
  </div>
);

export default ReviewActions;