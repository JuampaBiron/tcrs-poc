"use client";

import React from "react";
import type { GLCodingEntry } from "@/types";
import type { DictionaryAccount, DictionaryFacility } from "@/types";

interface Dictionaries {
  accounts: DictionaryAccount[];
  facilities: DictionaryFacility[];
}

interface ReviewGLCodingSummaryProps {
  glCodingData: GLCodingEntry[];
  dictionaries?: Dictionaries;
  glCodingTotal: number;
}

const ReviewGLCodingSummary: React.FC<ReviewGLCodingSummaryProps> = ({
  glCodingData,
  dictionaries,
  glCodingTotal,
}) => {
  return (
    <div className="mb-6">
      <h4 className="text-md font-medium text-gray-700 mb-3">
        GL Coding ({glCodingData.length} entries)
      </h4>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-2 mb-3">
          {glCodingData.map((entry, index) => {
            const account = dictionaries?.accounts.find(
              (a) => a.accountCode === entry.accountCode
            );
            const facility = dictionaries?.facilities.find(
              (f) => f.facilityCode === entry.facilityCode
            );
            return (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {account?.accountCombined || entry.accountCode} -{" "}
                  {facility?.facilityCombined || entry.facilityCode}
                </span>
                <span className="font-medium">${entry.amount.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <div className="border-t pt-2 flex justify-between font-medium">
          <span>Total GL Coding:</span>
          <span>${glCodingTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewGLCodingSummary;