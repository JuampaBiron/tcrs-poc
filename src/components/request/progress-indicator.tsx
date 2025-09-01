"use client";

import { FileText, DollarSign, Upload } from "lucide-react";
import React from "react";

interface ProgressIndicatorProps {
  currentStep: "invoice" | "gl-coding" | "validation" | "submit";
}

const steps = [
  { key: "invoice", label: "Invoice Details", icon: FileText },
  { key: "gl-coding", label: "GL Coding", icon: DollarSign },
  { key: "validation", label: "Review & Submit", icon: Upload },
] as const;

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const stepIndex = steps.findIndex((s) => s.key === currentStep);
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Create New Request</h2>
        <div className="text-sm text-gray-500">
          Step {stepIndex + 1} of {steps.length}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.key;
          return (
            <React.Fragment key={step.key}>
              <div className={`flex items-center ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                <Icon className="w-5 h-5 mr-2" />
                {step.label}
              </div>
              {idx < steps.length - 1 && <div className="w-8 h-px bg-gray-300" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;