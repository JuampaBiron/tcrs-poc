"use client";

import React from "react";
import { Check, AlertCircle } from "lucide-react";

interface ReviewAmountValidationProps {
  invoiceTotal: number;
  glCodingTotal: number;
}

const ReviewAmountValidation: React.FC<ReviewAmountValidationProps> = ({
  invoiceTotal,
  glCodingTotal,
}) => {
  const amountsMatch = Math.abs(invoiceTotal - glCodingTotal) < 0.01;

  return (
    <div className="mb-6">
      <div
        className={`p-4 rounded-lg ${
          amountsMatch
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex items-center">
          {amountsMatch ? (
            <Check className="w-5 h-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          )}
          <div>
            <p
              className={`font-medium ${
                amountsMatch ? "text-green-800" : "text-red-800"
              }`}
            >
              {amountsMatch ? "Amounts Match" : "Amount Mismatch"}
            </p>
            <p className="text-sm text-red-600 mt-1">
              Invoice: ${invoiceTotal.toFixed(2)} | GL Coding: $
              {glCodingTotal.toFixed(2)}
              {!amountsMatch &&
                ` | Difference: ${Math.abs(
                  invoiceTotal - glCodingTotal
                ).toFixed(2)}`}
            </p>
            {!amountsMatch && (
              <p className="text-sm text-red-600 mt-1">
                Please review your entries before submitting.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAmountValidation;